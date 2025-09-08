import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/learning';

// GET /api/learn/gamification/leaderboard - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, monthly, weekly
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date filter
    let dateFilter = {};
    const now = new Date();
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { gte: monthAgo } };
    }

    // Get top users
    const topUsers = await prisma.userStats.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { totalXp: 'desc' },
        { level: 'desc' },
      ],
      take: limit,
    });

    // Get current user's rank
    const currentUserStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    let currentUserRank = null;
    if (currentUserStats) {
      const higherRankedCount = await prisma.userStats.count({
        where: {
          ...dateFilter,
          OR: [
            { totalXp: { gt: currentUserStats.totalXp } },
            {
              totalXp: currentUserStats.totalXp,
              level: { gt: currentUserStats.level },
            },
          ],
        },
      });
      currentUserRank = higherRankedCount + 1;
    }

    // Format leaderboard entries
    const leaderboard = topUsers.map((stats, index) => ({
      rank: index + 1,
      userId: stats.userId,
      user: stats.user,
      totalXp: stats.totalXp,
      level: stats.level,
      streak: stats.streak,
      badges: stats.badges || [],
      booksCompleted: stats.booksCompleted,
      wordsLearned: stats.wordsLearned,
      quizzesTaken: stats.quizzesTaken,
      averageQuizScore: stats.averageQuizScore,
    }));

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        period,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}