import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, TextSubmissionStatus } from '@prisma/client';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer
    if (session.user.role !== UserRole.WRITER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    // Get text submission statistics
    const submissionStats = await prisma.textSubmission.groupBy({
      by: ['status'],
      where: {
        authorId: userId,
      },
      _count: {
        id: true,
      },
    });

    // Calculate totals
    const totalSubmissions = submissionStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const approvedSubmissions = submissionStats.find(stat => stat.status === TextSubmissionStatus.APPROVED)?._count.id || 0;
    const publishedSubmissions = submissionStats.find(stat => stat.status === TextSubmissionStatus.PUBLISHED)?._count.id || 0;
    const reviewStatuses = [
      TextSubmissionStatus.PENDING,
      TextSubmissionStatus.STORY_REVIEW,
      TextSubmissionStatus.FORMAT_REVIEW,
      TextSubmissionStatus.CONTENT_REVIEW
    ];
    const inReviewSubmissions = submissionStats
      .filter(stat => reviewStatuses.includes(stat.status as any))
      .reduce((sum, stat) => sum + stat._count.id, 0);

    // Get recent submissions for trend analysis
    const recentSubmissions = await prisma.textSubmission.findMany({
      where: {
        authorId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        publishedAt: true
      }
    });

    // Calculate readers reached (estimate based on published stories)
    const publishedStories = await prisma.textSubmission.findMany({
      where: {
        authorId: userId,
        status: TextSubmissionStatus.PUBLISHED,
        publishedAt: { not: null }
      },
      select: {
        id: true,
        publishedAt: true,
        wordCount: true
      }
    });

    // Estimate readers reached based on published stories (simplified calculation)
    let readersReached = 0;
    publishedStories.forEach(story => {
      if (story.publishedAt) {
        const daysPublished = Math.floor((Date.now() - story.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
        const baseReach = Math.min(100 + daysPublished * 5, 1000); // Conservative estimate
        readersReached += baseReach;
      }
    });

    // Calculate achievements
    const achievements = {
      firstSubmission: totalSubmissions > 0,
      firstPublished: publishedSubmissions >= 1,
      publishedAuthor: publishedSubmissions >= 3,
      globalReach: readersReached >= 500,
      prolificWriter: totalSubmissions >= 5,
      consistent: recentSubmissions.length >= 3, // Active in last 30 days
    };

    // Calculate total contributions score
    const totalContributions =
      (totalSubmissions * 10) +
      (approvedSubmissions * 25) +
      (publishedSubmissions * 50) +
      Math.floor(readersReached / 10);

    // Determine rank based on contributions
    let rank = 'New Writer';
    if (totalContributions >= 1000) {
      rank = 'Story Master';
    } else if (totalContributions >= 500) {
      rank = 'Published Author';
    } else if (totalContributions >= 200) {
      rank = 'Story Expert';
    } else if (totalContributions >= 100) {
      rank = 'Story Contributor';
    } else if (totalContributions >= 50) {
      rank = 'Story Writer';
    }

    // Get workflow insights
    const workflowInsights = {
      averageReviewTime: 0, // Could be calculated from workflow history
      successRate: totalSubmissions > 0 ? Math.round((publishedSubmissions / totalSubmissions) * 100) : 0,
      currentInReview: inReviewSubmissions,
      needsRevision: submissionStats.find(stat => stat.status === TextSubmissionStatus.NEEDS_REVISION)?._count.id || 0
    };

    // Prepare response
    const stats = {
      // Core metrics
      submissionsTotal: totalSubmissions,
      submissionsApproved: approvedSubmissions,
      submissionsPublished: publishedSubmissions,
      submissionsInReview: inReviewSubmissions,
      readersReached: readersReached,
      totalContributions: totalContributions,
      rank: rank,

      // Workflow insights
      workflowInsights,

      // Recent activity
      recentSubmissions: recentSubmissions.length,

      // Achievements
      achievements: [
        {
          name: 'First Story',
          icon: 'PenTool',
          earned: achievements.firstSubmission,
          description: 'Submit your first story to the platform',
        },
        {
          name: 'Published Author',
          icon: 'BookOpen',
          earned: achievements.firstPublished,
          description: 'Have your first story published',
        },
        {
          name: 'Bestselling Writer',
          icon: 'Award',
          earned: achievements.publishedAuthor,
          description: 'Have 3 stories published',
        },
        {
          name: 'Global Impact',
          icon: 'Globe',
          earned: achievements.globalReach,
          description: 'Reach 500+ readers worldwide',
        },
        {
          name: 'Prolific Writer',
          icon: 'FileText',
          earned: achievements.prolificWriter,
          description: 'Submit 5 or more stories',
        },
        {
          name: 'Consistent Contributor',
          icon: 'Calendar',
          earned: achievements.consistent,
          description: 'Active in the last 30 days',
        },
      ],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching volunteer text submission stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}