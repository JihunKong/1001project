import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/writer/submissions
 * 
 * Returns story submissions for the authenticated user with status tracking
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's story submissions
    const submissions = await prisma.storySubmission.findMany({
      where: {
        authorId: userId
      },
      include: {
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform the data for frontend consumption
    const transformedSubmissions = submissions.map(submission => {
      const latestFeedback = submission.feedback[0]; // Most recent feedback
      const revisionCount = submission.feedback.filter(f => f.revisionRound).length;
      
      return {
        id: submission.id,
        title: submission.title,
        content: submission.content,
        summary: submission.summary,
        category: submission.category,
        ageGroup: submission.ageGroup,
        language: submission.language,
        status: submission.status,
        priority: submission.priority,
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        publishDate: submission.publishDate?.toISOString(),
        dueDate: submission.dueDate?.toISOString(),
        revisionCount,
        wordCount: submission.content.trim().split(/\s+/).filter(word => word.length > 0).length,
        
        // Latest feedback info
        latestFeedback: latestFeedback ? {
          id: latestFeedback.id,
          revisionRound: latestFeedback.revisionRound,
          customMessage: latestFeedback.customMessage,
          createdAt: latestFeedback.createdAt.toISOString(),
          reviewer: latestFeedback.reviewer,
          template: latestFeedback.template
        } : null,
        
        // Workflow history
        statusHistory: submission.workflowHistory.slice(0, 5).map(history => ({
          id: history.id,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          comment: history.comment,
          performedBy: history.performedBy,
          createdAt: history.createdAt.toISOString()
        }))
      };
    });

    // Calculate stats
    const stats = {
      total: submissions.length,
      draft: submissions.filter(s => s.status === 'DRAFT').length,
      submitted: submissions.filter(s => s.status === 'SUBMITTED').length,
      in_review: submissions.filter(s => s.status === 'IN_REVIEW').length,
      editing: submissions.filter(s => s.status === 'EDITING').length,
      approved: submissions.filter(s => s.status === 'APPROVED').length,
      published: submissions.filter(s => s.status === 'PUBLISHED').length,
      rejected: submissions.filter(s => s.status === 'REJECTED').length
    };

    return NextResponse.json({
      success: true,
      data: {
        submissions: transformedSubmissions,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch submissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/writer/submissions
 * 
 * Creates a new story submission or converts draft to submission
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const {
      title,
      content,
      summary,
      category,
      ageGroup,
      language = 'en',
      draftSessionId, // Optional: convert existing draft
      termsAccepted // Required: terms acceptance data
    } = body;

    // Validate required fields
    if (!title?.trim() || !content?.trim() || !category || !ageGroup) {
      return NextResponse.json(
        { error: 'Title, content, category, and age group are required' },
        { status: 400 }
      );
    }

    // Validate terms acceptance
    if (!termsAccepted?.personalInfoAck || !termsAccepted?.respectfulLangAck) {
      return NextResponse.json(
        { error: 'Terms and disclosures must be accepted' },
        { status: 400 }
      );
    }

    try {
      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Record terms acceptance
        await tx.termsAcceptance.create({
          data: {
            userId: userId,
            termsVersion: '1.0', // Current version
            personalInfoAck: termsAccepted.personalInfoAck,
            respectfulLangAck: termsAccepted.respectfulLangAck,
            ipAddress: request.ip || null
          }
        });

        // Create story submission
        const submission = await tx.storySubmission.create({
          data: {
            authorId: userId,
            title: title.trim(),
            content: content.trim(),
            summary: summary?.trim() || null,
            category,
            ageGroup,
            language,
            status: 'SUBMITTED',
            priority: 'MEDIUM',
            tags: [] // Will be enhanced later with AI tagging
          }
        });

        // Create workflow history entry
        await tx.workflowHistory.create({
          data: {
            storySubmissionId: submission.id,
            fromStatus: null,
            toStatus: 'SUBMITTED',
            comment: 'Story submitted for review',
            performedById: userId
          }
        });

        // Create audit event
        await tx.auditEvent.create({
          data: {
            entityType: 'StorySubmission',
            entityId: submission.id,
            actorId: userId,
            actorRole: session.user.role || 'LEARNER',
            action: 'SUBMITTED',
            newState: {
              title: submission.title,
              status: submission.status,
              category: submission.category,
              ageGroup: submission.ageGroup
            }
          }
        });

        // Optionally delete draft session if provided
        if (draftSessionId) {
          await tx.draftSession.deleteMany({
            where: {
              sessionId: draftSessionId,
              userId: userId
            }
          });
        }

        return submission;
      });

      return NextResponse.json({
        success: true,
        data: {
          id: result.id,
          title: result.title,
          status: result.status,
          createdAt: result.createdAt.toISOString()
        },
        message: 'Story submitted successfully! You will receive notifications about the review progress.'
      });
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit story',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}