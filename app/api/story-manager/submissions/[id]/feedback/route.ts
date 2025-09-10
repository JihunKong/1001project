import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * POST /api/story-manager/submissions/[id]/feedback
 * 
 * Add feedback to a submission
 */
export async function POST(
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
    const { message, type } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Feedback message is required' },
        { status: 400 }
      );
    }

    if (!['SUGGESTION', 'CONCERN', 'APPROVAL', 'REJECTION'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Verify submission exists
    const submission = await prisma.bookSubmission.findUnique({
      where: { id: submissionId },
      select: { 
        id: true, 
        status: true,
        submittedBy: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Create feedback as workflow transition
    const feedback = await prisma.workflowTransition.create({
      data: {
        submissionId,
        submissionType: 'BookSubmission',
        fromStatus: submission.status,
        toStatus: submission.status, // Status doesn't change for feedback
        performedById: session.user.id,
        reason: message
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update submission's updated timestamp and notes if needed
    if (type === 'APPROVAL' || type === 'REJECTION') {
      await prisma.bookSubmission.update({
        where: { id: submissionId },
        data: {
          reviewNotes: message,
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });
    }

    // TODO: Send notification to submitter
    await sendFeedbackNotification(
      submission.submittedBy.email,
      submission.submittedBy.name,
      message,
      type,
      session.user.name || 'Story Manager'
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback added successfully',
      feedback: {
        id: feedback.id,
        message: feedback.reason,
        type: getFeedbackType(type),
        createdAt: feedback.createdAt.toISOString(),
        reviewer: feedback.performedBy
      }
    });

  } catch (error) {
    console.error('Error adding feedback:', error);
    return NextResponse.json(
      { error: 'Failed to add feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/story-manager/submissions/[id]/feedback
 * 
 * Get all feedback for a submission
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

    // Get all workflow transitions for this submission
    const transitions = await prisma.workflowTransition.findMany({
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
        createdAt: 'desc'
      }
    });

    const feedback = transitions.map(transition => ({
      id: transition.id,
      message: transition.reason || `Status changed from ${transition.fromStatus} to ${transition.toStatus}`,
      type: getTransitionFeedbackType(transition.fromStatus, transition.toStatus),
      createdAt: transition.createdAt.toISOString(),
      reviewer: transition.performedBy
    }));

    return NextResponse.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// Helper functions
function getFeedbackType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'SUGGESTION': 'SUGGESTION',
    'CONCERN': 'CONCERN',
    'APPROVAL': 'APPROVAL',
    'REJECTION': 'REJECTION'
  };
  return typeMap[type] || 'SUGGESTION';
}

function getTransitionFeedbackType(fromStatus: string, toStatus: string): string {
  if (toStatus === 'REJECTED') return 'REJECTION';
  if (toStatus === 'REVIEWED' || toStatus === 'APPROVED_COORDINATOR' || toStatus === 'PUBLISHED') return 'APPROVAL';
  if (toStatus === 'PENDING_REVIEW') return 'CONCERN';
  return 'SUGGESTION';
}

async function sendFeedbackNotification(
  email: string,
  name: string,
  message: string,
  type: string,
  reviewerName: string
) {
  // TODO: Implement email notification
  const subject = `Feedback on Your Story Submission - ${type}`;
  const notificationData = {
    to: email,
    subject,
    template: 'submission-feedback',
    data: {
      name,
      message,
      type: type.toLowerCase(),
      reviewerName,
      timestamp: new Date().toISOString()
    }
  };

  console.log('Sending feedback notification:', notificationData);
  
  // In a real implementation, you would:
  // 1. Use a service like SendGrid, AWS SES, or Nodemailer
  // 2. Queue the email for background processing
  // 3. Store notification history in the database
  // 4. Handle delivery failures and retries
}