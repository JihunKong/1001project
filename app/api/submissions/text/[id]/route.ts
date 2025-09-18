import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, PublishingWorkflowStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const updateTextSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  contentMd: z.string().min(10, 'Content must be at least 10 characters').max(100000, 'Content too long').optional(),
  chaptersJson: z.string().optional(),
  language: z.string().min(2, 'Language is required').max(5, 'Invalid language code').optional(),
  ageRange: z.string().max(20).optional(),
  category: z.array(z.string().max(50)).optional(),
  tags: z.array(z.string().max(30)).optional(),
  summary: z.string().max(1000).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

async function checkSubmissionAccess(submissionId: string, userId: string, userRole: UserRole, action: 'read' | 'write' | 'delete') {
  const submission = await prisma.textSubmission.findUnique({
    where: { id: submissionId },
    include: {
      class: {
        select: {
          id: true,
          teacherId: true
        }
      }
    }
  });

  if (!submission) {
    return { hasAccess: false, error: 'Submission not found' };
  }

  // Managers and admins have full access
  const managerRoles = [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN];
  if (managerRoles.includes(userRole)) {
    return { hasAccess: true, submission };
  }

  // Authors have access to their own submissions
  if (submission.authorId === userId) {
    // Authors can't delete published submissions
    if (action === 'delete' && submission.status === PublishingWorkflowStatus.PUBLISHED) {
      return { hasAccess: false, error: 'Cannot delete published submissions' };
    }
    return { hasAccess: true, submission };
  }

  // Teachers can access classroom submissions from their classes
  if (userRole === UserRole.TEACHER && submission.source === 'classroom') {
    if (submission.class?.teacherId === userId) {
      // Teachers can't delete published classroom submissions
      if (action === 'delete' && submission.status === PublishingWorkflowStatus.PUBLISHED) {
        return { hasAccess: false, error: 'Cannot delete published classroom submissions' };
      }
      return { hasAccess: true, submission };
    }
  }

  return { hasAccess: false, error: 'Insufficient permissions to access this submission' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { hasAccess, submission, error } = await checkSubmissionAccess(
      params.id,
      session.user.id,
      session.user.role as UserRole,
      'read'
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error },
        { status: error === 'Submission not found' ? 404 : 403 }
      );
    }

    // Fetch full submission data with related information
    const fullSubmission = await prisma.textSubmission.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        transitions: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            transitions: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: fullSubmission!.id,
        title: fullSubmission!.title,
        contentMd: fullSubmission!.contentMd,
        chaptersJson: fullSubmission!.chaptersJson,
        source: fullSubmission!.source,
        status: fullSubmission!.status,
        language: fullSubmission!.language,
        ageRange: fullSubmission!.ageRange,
        category: fullSubmission!.category,
        tags: fullSubmission!.tags,
        summary: fullSubmission!.summary,
        revisionNo: fullSubmission!.revisionNo,
        reviewNotes: fullSubmission!.reviewNotes,
        lastReviewedAt: fullSubmission!.lastReviewedAt?.toISOString() || null,
        createdAt: fullSubmission!.createdAt.toISOString(),
        updatedAt: fullSubmission!.updatedAt.toISOString(),
        author: fullSubmission!.author,
        class: fullSubmission!.class,
        transitions: fullSubmission!.transitions.map(t => ({
          id: t.id,
          fromStatus: t.fromStatus,
          toStatus: t.toStatus,
          reason: t.reason,
          createdAt: t.createdAt.toISOString(),
          performedBy: t.performedBy
        })),
        transitionCount: fullSubmission!._count.transitions
      }
    });

  } catch (error) {
    console.error('Error fetching text submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch text submission' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { hasAccess, submission, error } = await checkSubmissionAccess(
      params.id,
      session.user.id,
      session.user.role as UserRole,
      'write'
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error },
        { status: error === 'Submission not found' ? 404 : 403 }
      );
    }

    // Check if submission can be edited
    const editableStatuses = [PublishingWorkflowStatus.DRAFT, PublishingWorkflowStatus.NEEDS_REVISION];
    if (!editableStatuses.includes(submission!.status)) {
      return NextResponse.json(
        { error: 'Submission cannot be edited in its current status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTextSubmissionSchema.parse(body);

    // Update submission with new revision number if content changed
    const shouldIncrementRevision = validatedData.contentMd && validatedData.contentMd !== submission!.contentMd;
    
    const updatedSubmission = await prisma.textSubmission.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        revisionNo: shouldIncrementRevision ? submission!.revisionNo + 1 : submission!.revisionNo,
        updatedAt: new Date(),
        // Reset review status if content changed significantly
        ...(shouldIncrementRevision && {
          reviewNotes: null,
          lastReviewedAt: null
        })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create workflow transition if significant changes made
    if (shouldIncrementRevision) {
      await prisma.workflowTransition.create({
        data: {
          submissionId: params.id,
          submissionType: 'TextSubmission',
          fromStatus: submission!.status,
          toStatus: submission!.status,
          performedById: session.user.id,
          reason: `Revision ${updatedSubmission.revisionNo}: Content updated`
        }
      });
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: updatedSubmission.id,
        title: updatedSubmission.title,
        status: updatedSubmission.status,
        source: updatedSubmission.source,
        language: updatedSubmission.language,
        ageRange: updatedSubmission.ageRange,
        category: updatedSubmission.category,
        tags: updatedSubmission.tags,
        summary: updatedSubmission.summary,
        revisionNo: updatedSubmission.revisionNo,
        createdAt: updatedSubmission.createdAt.toISOString(),
        updatedAt: updatedSubmission.updatedAt.toISOString(),
        author: updatedSubmission.author,
        class: updatedSubmission.class
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating text submission:', error);
    return NextResponse.json(
      { error: 'Failed to update text submission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { hasAccess, submission, error } = await checkSubmissionAccess(
      params.id,
      session.user.id,
      session.user.role as UserRole,
      'delete'
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error },
        { status: error === 'Submission not found' ? 404 : 403 }
      );
    }

    // Delete related workflow transitions first
    await prisma.workflowTransition.deleteMany({
      where: {
        submissionId: params.id,
        submissionType: 'TextSubmission'
      }
    });

    // Delete the submission
    await prisma.textSubmission.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Text submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting text submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete text submission' },
      { status: 500 }
    );
  }
}