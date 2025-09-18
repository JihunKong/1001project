import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/writer/submissions/[id]/status
 * 
 * Returns detailed status information for a specific submission
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;

    // Get the submission with full details
    const submission = await prisma.storySubmission.findUnique({
      where: {
        id: id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        feedback: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            template: {
              select: {
                id: true,
                title: true,
                category: true,
                description: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        workflowHistory: {
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
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if user owns this submission
    if (submission.authorId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own submissions' },
        { status: 403 }
      );
    }

    // Calculate progress based on status
    const getProgressInfo = (status: string) => {
      const stages = [
        { status: 'DRAFT', label: 'Draft', percentage: 0 },
        { status: 'SUBMITTED', label: 'Submitted', percentage: 20 },
        { status: 'IN_REVIEW', label: 'Under Review', percentage: 40 },
        { status: 'EDITING', label: 'Needs Revision', percentage: 50 },
        { status: 'APPROVED', label: 'Approved', percentage: 80 },
        { status: 'PUBLISHED', label: 'Published', percentage: 100 },
        { status: 'REJECTED', label: 'Rejected', percentage: 0 }
      ];
      
      const currentStage = stages.find(stage => stage.status === status);
      return {
        currentStage: currentStage || stages[0],
        allStages: stages,
        isComplete: status === 'PUBLISHED',
        needsAction: status === 'EDITING' || status === 'REJECTED'
      };
    };

    const progressInfo = getProgressInfo(submission.status);
    
    // Calculate estimated timeline
    const getEstimatedTimeline = (status: string, createdAt: Date) => {
      const now = new Date();
      const daysPassed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const timelineEstimates = {
        'SUBMITTED': { total: 7, remaining: Math.max(0, 7 - daysPassed) },
        'IN_REVIEW': { total: 14, remaining: Math.max(0, 14 - daysPassed) },
        'EDITING': { total: null, remaining: null }, // Depends on author
        'APPROVED': { total: 21, remaining: Math.max(0, 21 - daysPassed) },
        'PUBLISHED': { total: daysPassed, remaining: 0 },
        'REJECTED': { total: daysPassed, remaining: 0 }
      };
      
      return timelineEstimates[status as keyof typeof timelineEstimates] || { total: null, remaining: null };
    };

    const timeline = getEstimatedTimeline(submission.status, submission.createdAt);

    // Get next steps based on status
    const getNextSteps = (status: string) => {
      const nextSteps = {
        'DRAFT': ['Complete your story', 'Submit for review'],
        'SUBMITTED': ['Your story is in the review queue', 'You will be notified of updates'],
        'IN_REVIEW': ['Our team is reviewing your story', 'You will receive feedback soon'],
        'EDITING': ['Review the feedback provided', 'Make requested changes', 'Resubmit your story'],
        'APPROVED': ['Your story is approved!', 'It will be published to the library'],
        'PUBLISHED': ['Congratulations! Your story is live', 'Share it with friends and family'],
        'REJECTED': ['Review the rejection feedback', 'Consider making significant changes', 'You may resubmit if appropriate']
      };
      
      return nextSteps[status as keyof typeof nextSteps] || ['Contact support for assistance'];
    };

    const nextSteps = getNextSteps(submission.status);

    // Latest feedback with actionable items
    const latestFeedback = submission.feedback[0];
    const hasActionableItems = latestFeedback && (submission.status === 'EDITING' || submission.status === 'REJECTED');

    return NextResponse.json({
      success: true,
      data: {
        // Basic submission info
        id: submission.id,
        title: submission.title,
        status: submission.status,
        priority: submission.priority,
        category: submission.category,
        ageGroup: submission.ageGroup,
        language: submission.language,
        
        // Timestamps
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        publishDate: submission.publishDate?.toISOString(),
        dueDate: submission.dueDate?.toISOString(),
        
        // Progress tracking
        progress: progressInfo,
        timeline,
        nextSteps,
        
        // Revision info
        revisionCount: submission.feedback.length,
        currentRevision: latestFeedback?.revisionRound || 1,
        
        // Feedback and actions
        hasActionableItems,
        latestFeedback: latestFeedback ? {
          id: latestFeedback.id,
          revisionRound: latestFeedback.revisionRound,
          customMessage: latestFeedback.customMessage,
          createdAt: latestFeedback.createdAt.toISOString(),
          reviewer: latestFeedback.reviewer,
          template: latestFeedback.template
        } : null,
        
        // Complete feedback history
        feedbackHistory: submission.feedback.map(feedback => ({
          id: feedback.id,
          revisionRound: feedback.revisionRound,
          customMessage: feedback.customMessage,
          createdAt: feedback.createdAt.toISOString(),
          reviewer: feedback.reviewer,
          template: feedback.template
        })),
        
        // Status change history
        statusHistory: submission.workflowHistory.map(history => ({
          id: history.id,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          comment: history.comment,
          performedBy: history.performedBy,
          createdAt: history.createdAt.toISOString()
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching submission status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch submission status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}