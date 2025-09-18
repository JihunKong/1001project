import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * GET /api/story-manager/submissions/[id]
 * 
 * Get detailed submission information for review
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

    // Fetch detailed submission data
    const submission = await prisma.bookSubmission.findUnique({
      where: { id: submissionId },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true
          }
        },
        coordinator: {
          select: {
            id: true,
            name: true
          }
        },
        admin: {
          select: {
            id: true,
            name: true
          }
        },
        workflowTransitions: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true
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

    // Transform workflow transitions to feedback format
    const feedback = submission.workflowTransitions.map(transition => ({
      id: transition.id,
      message: transition.reason || `Status changed from ${transition.fromStatus} to ${transition.toStatus}`,
      type: getTransitionType(transition.toStatus),
      createdAt: transition.createdAt.toISOString(),
      reviewer: transition.performedBy
    }));

    // Check for AI analysis (mock data for now)
    const aiAnalysis = {
      readingLevel: calculateReadingLevel(submission.wordCount, submission.pageCount),
      themes: extractThemes(submission.summary, submission.categories),
      suggestedCategories: suggestCategories(submission.summary),
      contentWarnings: checkContentWarnings(submission.summary)
    };

    const transformedSubmission = {
      id: submission.id,
      title: submission.title,
      authorName: submission.authorName,
      authorAge: submission.authorAge,
      authorLocation: submission.authorLocation,
      summary: submission.summary,
      language: submission.language,
      ageRange: submission.ageRange,
      categories: submission.categories,
      tags: submission.tags,
      format: submission.format,
      filePath: submission.filePath,
      coverImagePath: submission.coverImagePath,
      pageCount: submission.pageCount,
      wordCount: submission.wordCount,
      status: submission.status,
      priority: submission.priority || 'MEDIUM',
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      submittedBy: submission.submittedBy,
      currentReviewer: submission.reviewedBy,
      feedback,
      aiAnalysis
    };

    return NextResponse.json({
      success: true,
      submission: transformedSubmission
    });

  } catch (error) {
    console.error('Error fetching submission detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission detail' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/story-manager/submissions/[id]
 * 
 * Update submission status and metadata
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
    const { action, data } = await request.json();

    // Get current submission
    const currentSubmission = await prisma.bookSubmission.findUnique({
      where: { id: submissionId },
      select: { status: true }
    });

    if (!currentSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let newStatus = currentSubmission.status;
    let reason = '';

    switch (action) {
      case 'approve':
        newStatus = 'REVIEWED';
        updateData = {
          status: newStatus,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: data?.notes || 'Approved by Story Manager'
        };
        reason = data?.notes || 'Approved for next stage';
        break;

      case 'reject':
        newStatus = 'REJECTED';
        updateData = {
          status: newStatus,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          rejectionReason: data?.reason || 'Rejected by Story Manager',
          reviewNotes: data?.notes
        };
        reason = data?.reason || 'Rejected by Story Manager';
        break;

      case 'request_changes':
        newStatus = 'PENDING_REVIEW';
        updateData = {
          reviewNotes: data?.notes || 'Changes requested'
        };
        reason = data?.notes || 'Changes requested';
        break;

      case 'assign_priority':
        updateData = {
          priority: data?.priority || 'MEDIUM'
        };
        reason = `Priority updated to ${data?.priority || 'MEDIUM'}`;
        break;

      case 'update_metadata':
        updateData = {
          categories: data?.categories || [],
          tags: data?.tags || [],
          ageRange: data?.ageRange,
          readingLevel: data?.readingLevel
        };
        reason = 'Metadata updated by Story Manager';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update submission
    const updatedSubmission = await prisma.bookSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        submittedBy: {
          select: { name: true, email: true }
        }
      }
    });

    // Log workflow transition
    await prisma.workflowTransition.create({
      data: {
        submissionId,
        submissionType: 'BookSubmission',
        fromStatus: currentSubmission.status,
        toStatus: newStatus,
        performedById: session.user.id,
        reason
      }
    });

    // TODO: Send notification to submitter if status changed
    if (newStatus !== currentSubmission.status) {
      await sendStatusChangeNotification(
        updatedSubmission.submittedBy.email,
        updatedSubmission.title,
        currentSubmission.status,
        newStatus,
        reason
      );
    }

    return NextResponse.json({
      success: true,
      message: `Submission ${action} successful`,
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        updatedAt: updatedSubmission.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// Helper functions
function getTransitionType(status: string): 'SUGGESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION' {
  switch (status) {
    case 'REVIEWED':
    case 'APPROVED_COORDINATOR':
    case 'PUBLISHED':
      return 'APPROVAL';
    case 'REJECTED':
      return 'REJECTION';
    case 'PENDING_REVIEW':
      return 'CONCERN';
    default:
      return 'SUGGESTION';
  }
}

function calculateReadingLevel(wordCount?: number | null, pageCount?: number | null): string {
  if (!wordCount) return 'Unknown';
  
  if (wordCount < 500) return 'Beginner (K-2)';
  if (wordCount < 1500) return 'Elementary (3-5)';
  if (wordCount < 3000) return 'Middle Grade (6-8)';
  if (wordCount < 5000) return 'Young Adult (9-12)';
  return 'Adult (13+)';
}

function extractThemes(summary?: string | null, categories?: string[]): string[] {
  const themes: string[] = [];
  const text = (summary || '').toLowerCase();
  
  // Common themes to detect
  const themeKeywords = {
    'friendship': ['friend', 'buddy', 'companion'],
    'adventure': ['adventure', 'journey', 'explore', 'quest'],
    'courage': ['brave', 'courage', 'fearless', 'bold'],
    'family': ['family', 'parent', 'sibling', 'mother', 'father'],
    'nature': ['nature', 'forest', 'animal', 'environment'],
    'magic': ['magic', 'wizard', 'fairy', 'enchanted'],
    'learning': ['learn', 'school', 'education', 'teach']
  };

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  });

  // Add categories as themes
  if (categories) {
    themes.push(...categories.map(cat => cat.toLowerCase()));
  }

  return [...new Set(themes)].slice(0, 5);
}

function suggestCategories(summary?: string | null): string[] {
  const suggestions: string[] = [];
  const text = (summary || '').toLowerCase();
  
  const categoryKeywords = {
    'Educational': ['learn', 'teach', 'lesson', 'knowledge'],
    'Fantasy': ['magic', 'dragon', 'fairy', 'wizard', 'enchanted'],
    'Adventure': ['adventure', 'journey', 'explore', 'quest', 'discovery'],
    'Animal Story': ['animal', 'dog', 'cat', 'wildlife', 'pet'],
    'Science Fiction': ['space', 'robot', 'future', 'technology'],
    'Mystery': ['mystery', 'detective', 'clue', 'solve', 'secret']
  };

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      suggestions.push(category);
    }
  });

  return suggestions.slice(0, 3);
}

function checkContentWarnings(summary?: string | null): string[] {
  const warnings: string[] = [];
  const text = (summary || '').toLowerCase();
  
  const warningKeywords = {
    'Mild Violence': ['fight', 'battle', 'conflict'],
    'Scary Content': ['scary', 'frightening', 'monster', 'ghost'],
    'Sad Themes': ['death', 'loss', 'grief', 'sad'],
    'Complex Themes': ['divorce', 'illness', 'poverty']
  };

  Object.entries(warningKeywords).forEach(([warning, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      warnings.push(warning);
    }
  });

  return warnings;
}

async function sendStatusChangeNotification(
  email: string,
  title: string,
  fromStatus: string,
  toStatus: string,
  reason: string
) {
  // TODO: Implement email notification
  console.log('Sending notification:', {
    email,
    title,
    fromStatus,
    toStatus,
    reason
  });
}