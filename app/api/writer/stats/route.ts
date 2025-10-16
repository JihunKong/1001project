import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a writer
    if (session.user.role !== UserRole.WRITER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    // Get volunteer submission statistics using correct field names
    const submissionStats = await prisma.volunteerSubmission.groupBy({
      by: ['status'],
      where: {
        volunteerId: userId, // Correct field name from schema
      },
      _count: {
        id: true,
      },
    });

    // Calculate totals
    const totalSubmissions = submissionStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const approvedSubmissions = submissionStats.find(stat => stat.status === 'APPROVED')?._count.id || 0;
    const publishedSubmissions = submissionStats.find(stat => stat.status === 'PUBLISHED')?._count.id || 0;

    // Get published submission IDs to calculate impact
    const publishedSubmissionIds = (await prisma.volunteerSubmission.findMany({
      where: {
        volunteerId: userId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
      },
    })).map(submission => submission.id);

    // Calculate readers reached through publications
    const publicationsWithImpact = await prisma.publication.findMany({
      where: {
        submissionId: {
          in: publishedSubmissionIds,
        },
      },
      include: {
        book: {
          select: {
            viewCount: true,
            downloadCount: true,
          },
        },
      },
    });

    // Calculate total impact
    const readersReached = publicationsWithImpact.reduce((total, pub) => {
      const views = pub.book?.viewCount || 0;
      const downloads = pub.book?.downloadCount || 0;
      return total + Math.max(views, downloads);
    }, 0);

    // Calculate achievements
    const achievements = {
      firstSubmission: totalSubmissions > 0,
      publishedAuthor: publishedSubmissions >= 3,
      globalReach: readersReached >= 1000,
      prolificWriter: totalSubmissions >= 10,
    };

    // Calculate total contributions score
    const totalContributions = (totalSubmissions * 10) + (approvedSubmissions * 20) + (publishedSubmissions * 50) + readersReached;

    // Determine rank based on contributions
    let rank = 'New Contributor';
    if (totalContributions >= 500) {
      rank = 'Story Master';
    } else if (totalContributions >= 200) {
      rank = 'Story Expert';
    } else if (totalContributions >= 100) {
      rank = 'Story Contributor';
    } else if (totalContributions >= 50) {
      rank = 'Story Writer';
    }

    // Prepare response
    const stats = {
      submissionsTotal: totalSubmissions,
      submissionsApproved: approvedSubmissions,
      submissionsPublished: publishedSubmissions,
      readersReached: readersReached,
      totalContributions: totalContributions,
      rank: rank,
      achievements: [
        {
          name: 'First Submission',
          icon: 'Award',
          earned: achievements.firstSubmission,
          description: 'Submit your first story',
        },
        {
          name: 'Published Author',
          icon: 'BookOpen',
          earned: achievements.publishedAuthor,
          description: 'Have 3 stories published',
        },
        {
          name: 'Global Reach',
          icon: 'Globe',
          earned: achievements.globalReach,
          description: 'Reach 1000+ readers',
        },
        {
          name: 'Prolific Writer',
          icon: 'FileText',
          earned: achievements.prolificWriter,
          description: 'Submit 10 stories',
        },
      ],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching writer stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}