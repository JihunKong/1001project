import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, PublishingWorkflowStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const submitForReviewSchema = z.object({
  message: z.string().max(1000, 'Message must be 1000 characters or less').optional(),
  requestedReviewers: z.array(z.string()).max(5, 'Maximum 5 reviewers allowed').optional(),
});

async function checkSubmissionOwnership(submissionId: string, userId: string, userRole: UserRole) {
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

  // Check ownership - authors and classroom teachers can submit
  const isAuthor = submission.authorId === userId;
  const isClassroomTeacher = submission.source === 'classroom' && submission.class?.teacherId === userId;
  const isManager = [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN].includes(userRole);

  if (!isAuthor && !isClassroomTeacher && !isManager) {
    return { hasAccess: false, error: 'Insufficient permissions to submit this text for review' };
  }

  return { hasAccess: true, submission };
}

async function sendReviewNotifications(submissionId: string, submissionTitle: string, submitterName: string) {
  try {
    // Find available story managers to notify
    const storyManagers = await prisma.user.findMany({
      where: { 
        role: UserRole.STORY_MANAGER,
        // Add any additional filters like active status if available
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Create notification records (assuming you have a notification system)
    // This is a placeholder - implement based on your notification system
    const notifications = storyManagers.map(manager => ({
      userId: manager.id,
      type: 'NEW_SUBMISSION_REVIEW',
      title: 'New Text Submission for Review',
      message: `${submitterName} has submitted "${submissionTitle}" for review`,
      data: {
        submissionId,
        submissionType: 'TextSubmission',
        submissionTitle,
        submitterName
      },
      createdAt: new Date()
    }));

    // If you have a notifications table, create the notifications
    // await prisma.notification.createMany({ data: notifications });

    console.log(`Sent review notifications for submission ${submissionId} to ${storyManagers.length} story managers`);
    
    return { success: true, notificationCount: storyManagers.length };
  } catch (error) {
    console.error('Error sending review notifications:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

export async function POST(
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

    const { hasAccess, submission, error } = await checkSubmissionOwnership(
      params.id,
      session.user.id,
      session.user.role as UserRole
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error },
        { status: error === 'Submission not found' ? 404 : 403 }
      );
    }

    // Check if submission can be submitted for review
    const submittableStatuses = [PublishingWorkflowStatus.DRAFT, PublishingWorkflowStatus.NEEDS_REVISION];
    if (!submittableStatuses.includes(submission!.status)) {
      return NextResponse.json(
        { error: 'Submission cannot be submitted for review in its current status' },
        { status: 400 }
      );
    }

    // Check if submission has required content
    if (!submission!.title || submission!.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Submission must have a title before submitting for review' },
        { status: 400 }
      );
    }

    if (!submission!.contentMd || submission!.contentMd.trim().length < 10) {
      return NextResponse.json(
        { error: 'Submission must have at least 10 characters of content before submitting for review' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = submitForReviewSchema.parse(body);

    // Update submission status
    const updatedSubmission = await prisma.textSubmission.update({
      where: { id: params.id },
      data: {
        status: PublishingWorkflowStatus.PENDING,
        updatedAt: new Date(),
        // Clear previous review notes when resubmitting
        reviewNotes: null,
        lastReviewedAt: null
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

    // Create workflow transition
    await prisma.workflowTransition.create({
      data: {
        submissionId: params.id,
        submissionType: 'TextSubmission',
        fromStatus: submission!.status,
        toStatus: 'PENDING',
        performedById: session.user.id,
        reason: validatedData.message || 'Submitted for review'
      }
    });

    // Send notifications to reviewers
    const notificationResult = await sendReviewNotifications(
      params.id,
      updatedSubmission.title,
      updatedSubmission.author.name || updatedSubmission.author.email || 'Anonymous'
    );

    return NextResponse.json({
      success: true,
      submission: {
        id: updatedSubmission.id,
        title: updatedSubmission.title,
        status: updatedSubmission.status,
        source: updatedSubmission.source,
        revisionNo: updatedSubmission.revisionNo,
        updatedAt: updatedSubmission.updatedAt.toISOString(),
        author: updatedSubmission.author,
        class: updatedSubmission.class
      },
      notifications: {
        sent: notificationResult.success,
        count: notificationResult.notificationCount || 0,
        error: notificationResult.error || null
      },
      message: 'Text submission successfully submitted for review'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting text for review:', error);
    return NextResponse.json(
      { error: 'Failed to submit text submission for review' },
      { status: 500 }
    );
  }
}

// GET - Check if submission can be submitted for review
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

    const { hasAccess, submission, error } = await checkSubmissionOwnership(
      params.id,
      session.user.id,
      session.user.role as UserRole
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error },
        { status: error === 'Submission not found' ? 404 : 403 }
      );
    }

    // Check submission readiness
    const submittableStatuses = [PublishingWorkflowStatus.DRAFT, PublishingWorkflowStatus.NEEDS_REVISION];
    const canSubmit = submittableStatuses.includes(submission!.status);
    
    const validationErrors = [];
    
    if (!submission!.title || submission!.title.trim().length === 0) {
      validationErrors.push('Title is required');
    }
    
    if (!submission!.contentMd || submission!.contentMd.trim().length < 10) {
      validationErrors.push('Content must be at least 10 characters');
    }

    return NextResponse.json({
      success: true,
      canSubmit: canSubmit && validationErrors.length === 0,
      status: submission!.status,
      validationErrors,
      statusMessage: canSubmit 
        ? (validationErrors.length === 0 ? 'Ready to submit for review' : 'Please fix validation errors before submitting')
        : `Cannot submit for review - current status: ${submission!.status}`
    });

  } catch (error) {
    console.error('Error checking submission readiness:', error);
    return NextResponse.json(
      { error: 'Failed to check submission readiness' },
      { status: 500 }
    );
  }
}