import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TextSubmissionStatus, UserRole } from '@prisma/client';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { NotificationService } from '@/lib/notifications/NotificationService';
import { notifySubmissionStatusChange, notifyFeedbackReceived } from '@/lib/sse-notifications';
import { logger } from '@/lib/logger';
import { triggerAutoAIReviews } from '@/lib/ai-review-trigger';
import { triggerImageGeneration } from '@/lib/auto-image-generation';
import { getLanguagePreferenceFromHeaders } from '@/lib/i18n/language-cookie';
import { generateContentHash, hasContentChangedSignificantly } from '@/lib/content-hash';
import { createBookFromSubmission } from '@/lib/submission-to-book';

// Initialize DOMPurify for server-side HTML sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// GET /api/text-submissions/[id] - Get specific submission
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const submission = await prisma.textSubmission.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        storyManager: {
          select: { id: true, name: true, email: true }
        },
        bookManager: {
          select: { id: true, name: true, email: true }
        },
        contentAdmin: {
          select: { id: true, name: true, email: true }
        },
        workflowHistory: {
          include: {
            performedBy: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check access permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const storyManagerStatuses: TextSubmissionStatus[] = [TextSubmissionStatus.PENDING, TextSubmissionStatus.STORY_REVIEW];
    const bookManagerStatuses: TextSubmissionStatus[] = [TextSubmissionStatus.STORY_APPROVED, TextSubmissionStatus.FORMAT_REVIEW];

    const canAccess =
      submission.authorId === user.id ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CONTENT_ADMIN ||
      (user.role === UserRole.STORY_MANAGER &&
        (submission.storyManagerId === user.id ||
         storyManagerStatuses.includes(submission.status))) ||
      (user.role === UserRole.BOOK_MANAGER &&
        (submission.bookManagerId === user.id ||
         bookManagerStatuses.includes(submission.status)));

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ submission });

  } catch (error) {
    logger.error('Error fetching text submission', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

// PUT /api/text-submissions/[id] - Update submission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    const submission = await prisma.textSubmission.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle workflow actions
    if (action) {
      return await handleWorkflowAction(submission, user, action, updateData);
    }

    // Handle content updates (only by author or in draft state)
    const editableStatuses: TextSubmissionStatus[] = [TextSubmissionStatus.DRAFT, TextSubmissionStatus.NEEDS_REVISION, TextSubmissionStatus.REJECTED];
    const canEdit =
      submission.authorId === user.id &&
      editableStatuses.includes(submission.status);

    if (!canEdit) {
      return NextResponse.json({ error: 'Cannot edit submission in current state' }, { status: 403 });
    }

    // Sanitize content if provided
    let shouldRegenerateImages = false;
    if (updateData.content) {
      updateData.content = purify.sanitize(updateData.content);

      // Recalculate word count
      const textContent = updateData.content.replace(/<[^>]*>/g, '');
      updateData.wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length;

      // Check if content changed significantly (50%+) for image regeneration
      if (submission.content && hasContentChangedSignificantly(submission.content, updateData.content, 0.5)) {
        shouldRegenerateImages = true;
        updateData.contentHash = generateContentHash(updateData.content);
        updateData.thumbnailUrl = null;
      }
    }

    const updatedSubmission = await prisma.textSubmission.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        storyManager: {
          select: { id: true, name: true, email: true }
        },
        bookManager: {
          select: { id: true, name: true, email: true }
        },
        contentAdmin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Trigger auto AI reviews for draft updates (non-blocking) - only on first save
    if (updatedSubmission.status === TextSubmissionStatus.DRAFT && updateData.content) {
      const existingReviews = await prisma.aIReview.count({
        where: { submissionId: updatedSubmission.id }
      });

      if (existingReviews === 0) {
        const language = getLanguagePreferenceFromHeaders(request.headers.get('cookie'));
        triggerAutoAIReviews(updatedSubmission.id, language).catch((error) => {
          logger.error('Error triggering auto AI reviews', error, {
            submissionId: updatedSubmission.id
          });
        });
      }
    }

    const existingImages = submission.generatedImages && Array.isArray(submission.generatedImages) && submission.generatedImages.length > 0;
    if (shouldRegenerateImages && !existingImages) {
      triggerImageGeneration(updatedSubmission.id);
      logger.info('Triggered image generation for draft (no existing images, significant content change)', {
        submissionId: updatedSubmission.id
      });
    }

    return NextResponse.json({ submission: updatedSubmission });

  } catch (error) {
    logger.error('Error updating text submission', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// Helper function to handle workflow actions
async function handleWorkflowAction(submission: any, user: any, action: string, data: any) {
  const updates: any = {};
  let newStatus: TextSubmissionStatus | null = null;

  switch (action) {
    case 'submit':
      if (submission.authorId !== user.id || submission.status !== TextSubmissionStatus.DRAFT) {
        return NextResponse.json({ error: 'Cannot submit this submission' }, { status: 403 });
      }
      newStatus = TextSubmissionStatus.PENDING;
      updates.submittedAt = new Date();
      break;

    case 'withdraw':
      if (submission.authorId !== user.id) {
        return NextResponse.json({ error: 'Only the author can withdraw this submission' }, { status: 403 });
      }
      if (submission.status !== TextSubmissionStatus.PENDING && submission.status !== TextSubmissionStatus.STORY_REVIEW) {
        return NextResponse.json({ error: 'Cannot withdraw this submission at this stage' }, { status: 403 });
      }
      newStatus = TextSubmissionStatus.DRAFT;
      updates.submittedAt = null;
      break;

    case 'assign_story_manager':
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.CONTENT_ADMIN) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      updates.storyManagerId = data.storyManagerId;
      newStatus = TextSubmissionStatus.STORY_REVIEW;
      break;

    case 'story_approve':
      if (user.role !== UserRole.STORY_MANAGER) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (!submission.storyManagerId) {
        updates.storyManagerId = user.id;
      }
      updates.storyFeedback = data.feedback;
      newStatus = TextSubmissionStatus.STORY_APPROVED;
      break;

    case 'story_needs_revision':
      if (user.role !== UserRole.STORY_MANAGER) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (!submission.storyManagerId) {
        updates.storyManagerId = user.id;
      }
      updates.storyFeedback = data.feedback;
      newStatus = TextSubmissionStatus.NEEDS_REVISION;
      break;

    case 'assign_book_manager':
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.CONTENT_ADMIN) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      updates.bookManagerId = data.bookManagerId;
      newStatus = TextSubmissionStatus.FORMAT_REVIEW;
      break;

    case 'format_decision':
      if (user.role !== UserRole.BOOK_MANAGER) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (!submission.bookManagerId) {
        updates.bookManagerId = user.id;
      }
      updates.bookDecision = data.decision;
      newStatus = TextSubmissionStatus.CONTENT_REVIEW;
      break;

    case 'final_approve':
      if (user.role !== UserRole.CONTENT_ADMIN) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      updates.contentAdminId = user.id;
      updates.finalNotes = data.notes;
      updates.publishedAt = new Date();
      newStatus = TextSubmissionStatus.PUBLISHED;

      if (!submission.publishedBookId) {
        try {
          const book = await createBookFromSubmission({
            submission,
            visibility: 'RESTRICTED',
            publisherId: user.id
          });
          updates.publishedBookId = book.id;
          logger.info('Book auto-created from submission', {
            submissionId: submission.id,
            bookId: book.id,
            title: book.title
          });
        } catch (bookError) {
          logger.error('Error creating book from submission', bookError, {
            submissionId: submission.id
          });
        }
      }
      break;

    case 'reject':
      const rejectAllowedRoles: UserRole[] = [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN];
      if (!rejectAllowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      updates.finalNotes = data.reason;
      newStatus = TextSubmissionStatus.REJECTED;
      break;

    case 'undo_reject':
      const undoRejectAllowedRoles: UserRole[] = [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN];
      if (!undoRejectAllowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (submission.status !== TextSubmissionStatus.REJECTED) {
        return NextResponse.json({ error: 'Can only undo rejection for rejected submissions' }, { status: 400 });
      }
      updates.finalNotes = null;
      newStatus = TextSubmissionStatus.DRAFT;
      break;

    case 'resubmit':
      if (submission.authorId !== user.id) {
        return NextResponse.json({ error: 'Only the author can resubmit' }, { status: 403 });
      }
      if (submission.status !== TextSubmissionStatus.REJECTED && submission.status !== TextSubmissionStatus.NEEDS_REVISION) {
        return NextResponse.json({ error: 'Can only resubmit rejected or revision-needed submissions' }, { status: 400 });
      }
      updates.finalNotes = null;

      // Determine which queue to return to based on who requested the revision
      if (submission.status === TextSubmissionStatus.NEEDS_REVISION) {
        const lastRevisionRequest = await prisma.workflowHistory.findFirst({
          where: {
            textSubmissionId: submission.id,
            toStatus: TextSubmissionStatus.NEEDS_REVISION,
            performedById: {
              not: submission.authorId
            }
          },
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: { select: { role: true } }
          }
        });

        console.log('[Resubmit Debug]', {
          submissionId: submission.id,
          authorId: submission.authorId,
          lastRevisionRequest: lastRevisionRequest ? {
            id: lastRevisionRequest.id,
            performedById: lastRevisionRequest.performedById,
            performedByRole: lastRevisionRequest.performedBy?.role
          } : null
        });

        if (lastRevisionRequest?.performedBy?.role === UserRole.STORY_MANAGER) {
          newStatus = TextSubmissionStatus.STORY_REVIEW;
        } else if (lastRevisionRequest?.performedBy?.role === UserRole.BOOK_MANAGER) {
          newStatus = TextSubmissionStatus.FORMAT_REVIEW;
        } else if (lastRevisionRequest?.performedBy?.role === UserRole.CONTENT_ADMIN) {
          newStatus = TextSubmissionStatus.CONTENT_REVIEW;
        } else {
          newStatus = TextSubmissionStatus.STORY_REVIEW;
        }
      } else {
        // For REJECTED status, go back to PENDING for fresh review
        newStatus = TextSubmissionStatus.PENDING;
      }
      break;

    case 'bm_needs_revision':
      if (user.role !== UserRole.BOOK_MANAGER && user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (submission.status !== TextSubmissionStatus.FORMAT_REVIEW && submission.status !== TextSubmissionStatus.STORY_APPROVED) {
        return NextResponse.json({ error: 'Cannot request revision at this stage' }, { status: 400 });
      }
      updates.bookDecision = data.feedback;
      newStatus = TextSubmissionStatus.NEEDS_REVISION;
      break;

    case 'ca_needs_revision':
      if (user.role !== UserRole.CONTENT_ADMIN && user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (submission.status !== TextSubmissionStatus.CONTENT_REVIEW) {
        return NextResponse.json({ error: 'Cannot request revision at this stage' }, { status: 400 });
      }
      updates.finalNotes = data.feedback;
      updates.contentAdminId = user.id;
      newStatus = TextSubmissionStatus.NEEDS_REVISION;
      break;

    case 'update_revision_feedback':
      const updateRevisionAllowedRoles: UserRole[] = [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN];
      if (!updateRevisionAllowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (submission.status !== TextSubmissionStatus.NEEDS_REVISION) {
        return NextResponse.json({ error: 'Can only update feedback for submissions needing revision' }, { status: 400 });
      }
      updates.storyFeedback = data.feedback;
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (newStatus) {
    updates.status = newStatus;
  }

  // Update submission and create workflow history
  const [updatedSubmission] = await prisma.$transaction([
    prisma.textSubmission.update({
      where: { id: submission.id },
      data: updates,
      include: {
        author: { select: { id: true, name: true, email: true } },
        storyManager: { select: { id: true, name: true, email: true } },
        bookManager: { select: { id: true, name: true, email: true } },
        contentAdmin: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.workflowHistory.create({
      data: {
        textSubmissionId: submission.id,
        fromStatus: submission.status,
        toStatus: newStatus || submission.status,
        comment: data.comment || `Action: ${action}`,
        performedById: user.id,
        metadata: { action, ...data }
      }
    })
  ]);

  // Send notifications for status change
  if (newStatus && newStatus !== submission.status) {
    try {
      const notificationService = new NotificationService();
      await notificationService.handleStatusChange(
        submission.id,
        submission.status,
        newStatus,
        user.id,
        data.feedback || data.notes || data.reason,
        {
          action,
          reviewerName: user.name,
          ...data
        }
      );

      // Send real-time SSE notifications
      await notifySubmissionStatusChange(submission.id, newStatus, submission.authorId);

      // If feedback was provided, also send feedback notification
      if (data.feedback || data.notes || data.reason) {
        await notifyFeedbackReceived(submission.id, user.role, submission.authorId);
      }
    } catch (notificationError) {
      logger.error('Error sending notifications for status change', notificationError, {
        submissionId: submission.id,
        newStatus
      });
    }
  }

  const hasExistingImages = submission.generatedImages && Array.isArray(submission.generatedImages) && submission.generatedImages.length > 0;
  if (newStatus === TextSubmissionStatus.PENDING && !hasExistingImages) {
    triggerImageGeneration(submission.id);
    logger.info('Triggered image generation for PENDING submission (no existing images)', {
      submissionId: submission.id
    });
  }

  return NextResponse.json({ submission: updatedSubmission });
}

// DELETE /api/text-submissions/[id] - Delete submission
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const submission = await prisma.textSubmission.findUnique({
      where: { id }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only author can delete draft submissions, admins can delete any
    const canDelete =
      (submission.authorId === user.id && submission.status === TextSubmissionStatus.DRAFT) ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CONTENT_ADMIN;

    if (!canDelete) {
      return NextResponse.json({ error: 'Cannot delete submission' }, { status: 403 });
    }

    await prisma.textSubmission.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Submission deleted successfully' });

  } catch (error) {
    logger.error('Error deleting text submission', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}