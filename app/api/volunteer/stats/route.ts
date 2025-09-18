import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only volunteers can access their stats
    if (session.user.role !== UserRole.VOLUNTEER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    // Get submission stats from text submissions (for volunteers who now use text submissions)
    const submissionStats = await prisma.textSubmission.groupBy({
      by: ['status'],
      where: {
        authorId: userId,
        authorRole: UserRole.VOLUNTEER
      },
      _count: {
        id: true
      }
    });

    // Calculate stats
    const totalSubmissions = submissionStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const approvedSubmissions = submissionStats.find(s => s.status === 'APPROVED')?._count.id || 0;
    const publishedSubmissions = submissionStats.find(s => s.status === 'PUBLISHED')?._count.id || 0;

    // Get published books that were created from volunteer's text submissions
    // First, get the volunteer's published text submissions
    const publishedTextSubmissions = await prisma.textSubmission.findMany({
      where: {
        authorId: userId,
        authorRole: UserRole.VOLUNTEER,
        status: 'PUBLISHED'
      },
      select: { id: true }
    });

    const publishedSubmissionIds = publishedTextSubmissions.map(submission => submission.id);

    // Then find books that were created from these text submissions
    const publishedContent = await prisma.book.findMany({
      where: {
        primaryTextId: { in: publishedSubmissionIds },
        isPublished: true
      },
      include: {
        _count: {
          select: {
            bookAssignments: true, // Students assigned to read
            bookClubs: true, // Book clubs reading this book
            readingProgress: true, // Users who have reading progress
          }
        }
      }
    });

    // Calculate total readers reached using multiple metrics
    const readersReached = publishedContent.reduce((total, book) => {
      // Count book assignments (each assignment could reach multiple students in a class)
      const assignments = book._count.bookAssignments;
      // Count users with reading progress (actual readers)
      const activeReaders = book._count.readingProgress;
      // Count book club members (estimated based on clubs)
      const bookClubs = book._count.bookClubs;
      
      // Use the highest number as the best estimate of reach
      return total + Math.max(assignments * 25, activeReaders, bookClubs * 10); // Estimate 25 students per assignment, 10 members per club
    }, 0);

    // Get achievements (simplified calculation)
    const achievements = {
      firstSubmission: totalSubmissions > 0,
      publishedAuthor: publishedSubmissions >= 3,
      globalReach: readersReached >= 1000,
      prolificWriter: totalSubmissions >= 10
    };

    // Calculate total impact score
    const totalContributions = (totalSubmissions * 10) + (approvedSubmissions * 20) + (publishedSubmissions * 50) + readersReached;

    // Determine rank based on contributions
    let rank = 'New Contributor';
    if (totalContributions >= 500) rank = 'Story Master';
    else if (totalContributions >= 200) rank = 'Story Expert';
    else if (totalContributions >= 100) rank = 'Story Contributor';
    else if (totalContributions >= 50) rank = 'Story Writer';

    const stats = {
      submissionsTotal: totalSubmissions,
      submissionsApproved: approvedSubmissions,
      submissionsPublished: publishedSubmissions,
      readersReached: readersReached, // Use actual calculated value, 0 if no data
      totalContributions,
      rank,
      achievements: [
        { name: 'First Submission', icon: 'Award', earned: achievements.firstSubmission, description: 'Submit your first story' },
        { name: 'Published Author', icon: 'BookOpen', earned: achievements.publishedAuthor, description: 'Have 3 stories published' },
        { name: 'Global Reach', icon: 'Globe', earned: achievements.globalReach, description: 'Reach 1000+ readers' },
        { name: 'Prolific Writer', icon: 'FileText', earned: achievements.prolificWriter, description: 'Submit 10 stories' }
      ]
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}