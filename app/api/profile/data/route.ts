import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const [
      achievements,
      userAchievements,
      textSubmissions,
      readingProgress,
      comments
    ] = await Promise.all([
      prisma.achievement.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true }
      }),
      prisma.textSubmission.findMany({
        where: {
          authorId: userId,
          ...dateFilter
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      }),
      prisma.readingProgress.findMany({
        where: {
          userId,
          ...dateFilter
        }
      }),
      prisma.comment.findMany({
        where: {
          authorId: userId,
          ...dateFilter
        }
      })
    ]);

    const stats = {
      submissions: {
        total: textSubmissions.length,
        published: textSubmissions.filter(s => s.status === 'PUBLISHED').length,
        draft: textSubmissions.filter(s => s.status === 'DRAFT').length,
        submitted: textSubmissions.filter(s => s.status === 'PENDING').length,
        underReview: textSubmissions.filter(s => s.status === 'STORY_REVIEW').length,
        needsRevision: textSubmissions.filter(s => s.status === 'NEEDS_REVISION').length
      },
      reading: {
        booksRead: readingProgress.filter(r => r.isCompleted).length,
        hoursReading: Math.round(readingProgress.reduce((sum, r) => sum + (r.totalReadingTime || 0), 0) / 60),
        currentlyReading: readingProgress.filter(r => !r.isCompleted).length
      },
      engagement: {
        commentsPosted: comments.length,
        achievementsEarned: userAchievements.filter(ua => ua.isUnlocked).length
      }
    };

    const currentProjects = textSubmissions
      .filter(s => ['DRAFT', 'PENDING', 'STORY_REVIEW', 'NEEDS_REVISION'].includes(s.status))
      .slice(0, 5)
      .map(project => ({
        id: project.id,
        title: project.title,
        status: project.status,
        lastEditedAt: project.lastEditedAt,
        coverImageUrl: project.coverImageUrl,
        thumbnailUrl: project.thumbnailUrl,
        summary: project.summary,
        wordCount: project.wordCount
      }));

    const achievementsData = achievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
      return {
        id: achievement.id,
        key: achievement.key,
        nameKey: achievement.nameKey,
        descKey: achievement.descKey,
        category: achievement.category,
        points: achievement.points,
        iconUrl: achievement.iconUrl,
        isUnlocked: userAchievement?.isUnlocked || false,
        progress: userAchievement?.progress,
        earnedAt: userAchievement?.earnedAt
      };
    });

    const chartData = {
      submissionTrends: generateSubmissionTrends(textSubmissions),
      readingAnalytics: generateReadingAnalytics(readingProgress),
      engagement: generateEngagementData(comments, readingProgress)
    };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: {
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          bio: user.profile?.bio,
          tags: user.profile?.tags || [],
          avatarUrl: user.profile?.avatarUrl
        }
      },
      stats,
      achievements: achievementsData,
      currentProjects,
      chartData
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

function generateSubmissionTrends(submissions: any[]) {
  const monthlyData = new Map<string, any>();

  submissions.forEach(submission => {
    const month = new Date(submission.createdAt).toISOString().slice(0, 7);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, {
        month,
        draft: 0,
        submitted: 0,
        published: 0,
        total: 0
      });
    }
    const data = monthlyData.get(month)!;
    data.total++;
    if (submission.status === 'DRAFT') data.draft++;
    else if (submission.status === 'PUBLISHED') data.published++;
    else data.submitted++;
  });

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function generateReadingAnalytics(readingProgress: any[]) {
  const monthlyData = new Map<string, any>();

  readingProgress.forEach(progress => {
    const month = new Date(progress.lastReadAt).toISOString().slice(0, 7);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, {
        month,
        booksCompleted: 0,
        hoursRead: 0
      });
    }
    const data = monthlyData.get(month)!;
    if (progress.isCompleted) data.booksCompleted++;
    data.hoursRead += Math.round((progress.totalReadingTime || 0) / 60);
  });

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function generateEngagementData(comments: any[], readingProgress: any[]) {
  const monthlyData = new Map<string, any>();

  comments.forEach(comment => {
    const month = new Date(comment.createdAt).toISOString().slice(0, 7);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, {
        month,
        comments: 0,
        activities: 0
      });
    }
    monthlyData.get(month)!.comments++;
    monthlyData.get(month)!.activities++;
  });

  readingProgress.forEach(progress => {
    const month = new Date(progress.lastReadAt).toISOString().slice(0, 7);
    if (monthlyData.has(month)) {
      monthlyData.get(month)!.activities++;
    }
  });

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
}
