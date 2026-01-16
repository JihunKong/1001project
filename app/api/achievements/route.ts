import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getUserAchievements,
  checkAndAwardAchievements,
  getUserStats,
} from '@/lib/achievements/AchievementService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const checkNew = searchParams.get('check') === 'true';

    if (checkNew) {
      const newAchievements = await checkAndAwardAchievements(userId);
      if (newAchievements.length > 0) {
        const newlyUnlocked = await prisma.achievement.findMany({
          where: {
            key: { in: newAchievements },
          },
        });
        return NextResponse.json({
          newAchievements: newlyUnlocked,
          message: `Congratulations! You earned ${newAchievements.length} new badge(s)!`,
        });
      }
    }

    const [achievements, stats] = await Promise.all([
      getUserAchievements(userId),
      getUserStats(userId),
    ]);

    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    const achievementsWithProgress = allAchievements.map((achievement) => {
      const userAchievement = achievements.find(
        (ua) => ua.achievementId === achievement.id
      );

      return {
        ...achievement,
        isUnlocked: userAchievement?.isUnlocked || false,
        earnedAt: userAchievement?.earnedAt || null,
        progress: userAchievement?.progress || null,
      };
    });

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

    return NextResponse.json({
      achievements: achievementsWithProgress,
      stats,
      summary: {
        total: allAchievements.length,
        unlocked: unlockedCount,
        locked: allAchievements.length - unlockedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const newAchievements = await checkAndAwardAchievements(userId);

    if (newAchievements.length > 0) {
      const unlockedAchievements = await prisma.achievement.findMany({
        where: {
          key: { in: newAchievements },
        },
      });

      return NextResponse.json({
        success: true,
        newAchievements: unlockedAchievements,
        count: newAchievements.length,
      });
    }

    return NextResponse.json({
      success: true,
      newAchievements: [],
      count: 0,
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}
