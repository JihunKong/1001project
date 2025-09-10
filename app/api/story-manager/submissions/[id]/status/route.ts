import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, BookSubmissionStatus } from '@prisma/client';

/**
 * PUT /api/story-manager/submissions/[id]/status
 * 
 * Update submission status with workflow validation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.STORY_MANAGER) {
      return NextResponse.json(
        { error: 'Unauthorized. Story Manager access required.' },
        { status: 401 }
      );
    }

    const submissionId = params.id;
    const { status, reason, notes, priority } = await request.json();

    // Validate status
    if (!status || !Object.values(BookSubmissionStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Get current submission
    const currentSubmission = await prisma.bookSubmission.findUnique({
      where: { id: submissionId },
      include: {
        submittedBy: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!currentSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Validate workflow transition
    const isValidTransition = validateWorkflowTransition(
      currentSubmission.status,
      status,
      session.user.role
    );

    if (!isValidTransition) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentSubmission.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add role-specific fields
    if (status === 'REVIEWED') {
      updateData.reviewedById = session.user.id;
      updateData.reviewedAt = new Date();
      if (notes) updateData.reviewNotes = notes;
    }

    if (status === 'REJECTED') {
      updateData.reviewedById = session.user.id;
      updateData.reviewedAt = new Date();
      updateData.rejectionReason = reason || 'Rejected by Story Manager';
      if (notes) updateData.reviewNotes = notes;
    }

    if (priority) {
      updateData.priority = priority;
    }

    // Update submission
    const updatedSubmission = await prisma.bookSubmission.update({
      where: { id: submissionId },
      data: updateData
    });

    // Log workflow transition
    await prisma.workflowTransition.create({
      data: {
        submissionId,
        submissionType: 'BookSubmission',
        fromStatus: currentSubmission.status,
        toStatus: status,
        performedById: session.user.id,
        reason: reason || notes || `Status updated to ${status}`
      }
    });

    // Send notification if status changed significantly
    if (shouldSendNotification(currentSubmission.status, status)) {
      await sendStatusUpdateNotification(
        currentSubmission.submittedBy.email,
        currentSubmission.submittedBy.name,
        currentSubmission.title,
        currentSubmission.status,
        status,
        reason || notes,
        session.user.name || 'Story Manager'
      );
    }

    // Calculate next steps based on new status
    const nextSteps = getNextSteps(status);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        updatedAt: updatedSubmission.updatedAt.toISOString()
      },
      nextSteps
    });

  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json(
      { error: 'Failed to update submission status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/story-manager/submissions/[id]/status
 * 
 * Get status history and next possible actions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.STORY_MANAGER) {
      return NextResponse.json(
        { error: 'Unauthorized. Story Manager access required.' },
        { status: 401 }
      );
    }

    const submissionId = params.id;

    // Get submission and status history
    const [submission, statusHistory] = await Promise.all([
      prisma.bookSubmission.findUnique({
        where: { id: submissionId },
        select: {
          id: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.workflowTransition.findMany({
        where: {
          submissionId,
          submissionType: 'BookSubmission'
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get possible next actions
    const possibleActions = getPossibleActions(submission.status, session.user.role);

    return NextResponse.json({
      success: true,
      currentStatus: submission.status,
      priority: submission.priority,
      statusHistory: statusHistory.map(transition => ({
        id: transition.id,
        fromStatus: transition.fromStatus,
        toStatus: transition.toStatus,
        reason: transition.reason,
        performedBy: transition.performedBy,
        createdAt: transition.createdAt.toISOString()
      })),
      possibleActions,
      workflowProgress: calculateWorkflowProgress(submission.status)
    });

  } catch (error) {
    console.error('Error fetching status information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status information' },
      { status: 500 }
    );
  }
}

// Helper functions
function validateWorkflowTransition(
  fromStatus: BookSubmissionStatus,
  toStatus: BookSubmissionStatus,
  userRole: UserRole
): boolean {
  // Story Manager can only transition certain statuses
  if (userRole !== UserRole.STORY_MANAGER) return false;

  const allowedTransitions: { [key in BookSubmissionStatus]?: BookSubmissionStatus[] } = {
    [BookSubmissionStatus.DRAFT]: [BookSubmissionStatus.PENDING_REVIEW],
    [BookSubmissionStatus.PENDING_REVIEW]: [
      BookSubmissionStatus.REVIEWED,
      BookSubmissionStatus.REJECTED,
      BookSubmissionStatus.PENDING_REVIEW // For requesting changes
    ],
    [BookSubmissionStatus.REVIEWED]: [
      BookSubmissionStatus.PENDING_COORDINATOR,
      BookSubmissionStatus.PENDING_REVIEW, // If changes needed
      BookSubmissionStatus.REJECTED
    ]
  };

  return allowedTransitions[fromStatus]?.includes(toStatus) || false;
}

function shouldSendNotification(fromStatus: BookSubmissionStatus, toStatus: BookSubmissionStatus): boolean {
  // Send notifications for significant status changes
  const significantChanges = [
    BookSubmissionStatus.REVIEWED,
    BookSubmissionStatus.REJECTED,
    BookSubmissionStatus.PUBLISHED
  ];
  
  return significantChanges.includes(toStatus) && fromStatus !== toStatus;
}

function getNextSteps(status: BookSubmissionStatus): string[] {
  const nextStepsMap: { [key in BookSubmissionStatus]: string[] } = {
    [BookSubmissionStatus.DRAFT]: [
      'Submit for review',
      'Add additional content',
      'Update metadata'
    ],
    [BookSubmissionStatus.PENDING_REVIEW]: [
      'Wait for Story Manager review',
      'Respond to feedback if requested'
    ],
    [BookSubmissionStatus.REVIEWED]: [
      'Submission will proceed to Book Manager',
      'Book Manager will decide publication format'
    ],
    [BookSubmissionStatus.PENDING_COORDINATOR]: [
      'Wait for Book Manager review',
      'Publication format decision pending'
    ],
    [BookSubmissionStatus.APPROVED_COORDINATOR]: [
      'Submission will proceed to Content Admin',
      'Final approval pending'
    ],
    [BookSubmissionStatus.PENDING_ADMIN]: [
      'Wait for Content Admin final approval',
      'Publication scheduling pending'
    ],
    [BookSubmissionStatus.PUBLISHED]: [
      'Story is live on the platform',
      'Monitor engagement and feedback'
    ],
    [BookSubmissionStatus.REJECTED]: [
      'Review rejection reason',
      'Make requested changes',
      'Resubmit if appropriate'
    ]
  };

  return nextStepsMap[status] || [];
}

function getPossibleActions(status: BookSubmissionStatus, userRole: UserRole): Array<{
  action: string;
  label: string;
  description: string;
  requiresReason?: boolean;
}> {
  if (userRole !== UserRole.STORY_MANAGER) return [];

  const baseActions = [
    {
      action: 'assign_priority',
      label: 'Update Priority',
      description: 'Change submission priority level'
    },
    {
      action: 'add_feedback',
      label: 'Add Feedback',
      description: 'Provide feedback to the author'
    }
  ];

  switch (status) {
    case BookSubmissionStatus.PENDING_REVIEW:
      return [
        ...baseActions,
        {
          action: 'approve',
          label: 'Approve',
          description: 'Approve submission for next stage'
        },
        {
          action: 'reject',
          label: 'Reject',
          description: 'Reject submission',
          requiresReason: true
        },
        {
          action: 'request_changes',
          label: 'Request Changes',
          description: 'Request modifications from author'
        }
      ];

    case BookSubmissionStatus.REVIEWED:
      return [
        ...baseActions,
        {
          action: 'send_to_coordinator',
          label: 'Send to Book Manager',
          description: 'Forward to Book Manager for format decision'
        },
        {
          action: 'revert_to_review',
          label: 'Return for Review',
          description: 'Send back for additional review'
        }
      ];

    default:
      return baseActions;
  }
}

function calculateWorkflowProgress(status: BookSubmissionStatus): {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
} {
  const steps = [
    { status: BookSubmissionStatus.DRAFT, name: 'Draft' },
    { status: BookSubmissionStatus.PENDING_REVIEW, name: 'Story Review' },
    { status: BookSubmissionStatus.REVIEWED, name: 'Reviewed' },
    { status: BookSubmissionStatus.PENDING_COORDINATOR, name: 'Book Manager Review' },
    { status: BookSubmissionStatus.APPROVED_COORDINATOR, name: 'Content Admin Review' },
    { status: BookSubmissionStatus.PUBLISHED, name: 'Published' }
  ];

  const currentStepIndex = steps.findIndex(step => step.status === status);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const totalSteps = steps.length;
  const stepName = steps[currentStepIndex]?.name || 'Unknown';
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return {
    currentStep,
    totalSteps,
    stepName,
    percentage
  };
}

async function sendStatusUpdateNotification(
  email: string,
  name: string,
  title: string,
  fromStatus: string,
  toStatus: string,
  reason?: string,
  reviewerName?: string
) {
  // TODO: Implement email notification
  const notificationData = {
    to: email,
    subject: `Story Submission Status Update: ${title}`,
    template: 'status-update',
    data: {
      name,
      title,
      fromStatus: fromStatus.replace('_', ' '),
      toStatus: toStatus.replace('_', ' '),
      reason,
      reviewerName,
      timestamp: new Date().toISOString()
    }
  };

  console.log('Sending status update notification:', notificationData);
}