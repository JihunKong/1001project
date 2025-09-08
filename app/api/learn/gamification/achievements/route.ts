import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, Achievement } from '@/types/learning';

// GET /api/learn/gamification/achievements - Get user achievements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const achievements = await prisma.achievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: 'desc' },
    });

    // Define all possible achievements
    const allAchievements = [
      {
        id: 'first_book',
        name: 'Bookworm Begins',
        description: 'Complete your first book',
        icon: '📖',
        xpReward: 50,
      },
      {
        id: 'vocabulary_10',
        name: 'Word Collector',
        description: 'Learn 10 new words',
        icon: '📚',
        xpReward: 25,
      },
      {
        id: 'vocabulary_50',
        name: 'Vocabulary Master',
        description: 'Learn 50 new words',
        icon: '🎆',
        xpReward: 100,
      },
      {
        id: 'vocabulary_100',
        name: 'Word Wizard',
        description: 'Learn 100 new words',
        icon: '🧿',
        xpReward: 250,
      },
      {
        id: 'perfect_quiz',
        name: 'Perfect Score',
        description: 'Score 100% on a quiz',
        icon: '🎯',
        xpReward: 30,
      },
      {
        id: 'quiz_master_10',
        name: 'Quiz Enthusiast',
        description: 'Complete 10 quizzes',
        icon: '📝',
        xpReward: 50,
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        xpReward: 75,
      },
      {
        id: 'streak_30',
        name: 'Consistency Champion',
        description: 'Maintain a 30-day streak',
        icon: '🏆',
        xpReward: 200,
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        xpReward: 100,
      },
      {
        id: 'level_10',
        name: 'Advanced Learner',
        description: 'Reach level 10',
        icon: '🌟',
        xpReward: 250,
      },
      {
        id: 'discussion_starter',
        name: 'Conversation Starter',
        description: 'Start your first discussion',
        icon: '💬',
        xpReward: 25,
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Participate in 10 discussions',
        icon: '🦋',
        xpReward: 50,
      },
      {
        id: 'speed_reader',
        name: 'Speed Reader',
        description: 'Complete a book in one day',
        icon: '⚡',
        xpReward: 40,
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Read after midnight',
        icon: '🦉',
        xpReward: 20,
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Read before 6 AM',
        icon: '🐦',
        xpReward: 20,
      },
    ];

    // Merge unlocked achievements with all achievements
    const achievementsMap = new Map(achievements.map(a => [a.id, a]));
    const mergedAchievements = allAchievements.map(achievement => {
      const unlocked = achievementsMap.get(achievement.id);
      return {
        ...achievement,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt || null,
      };
    });

    // Calculate progress for locked achievements
    const userStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    if (userStats) {
      // Add progress information
      mergedAchievements.forEach(achievement => {
        if (!achievement.unlocked) {
          switch (achievement.id) {
            case 'vocabulary_10':
              achievement.progress = Math.min(100, (userStats.wordsLearned / 10) * 100);
              break;
            case 'vocabulary_50':
              achievement.progress = Math.min(100, (userStats.wordsLearned / 50) * 100);
              break;
            case 'vocabulary_100':
              achievement.progress = Math.min(100, (userStats.wordsLearned / 100) * 100);
              break;
            case 'quiz_master_10':
              achievement.progress = Math.min(100, (userStats.quizzesTaken / 10) * 100);
              break;
            case 'streak_7':
              achievement.progress = Math.min(100, (userStats.streak / 7) * 100);
              break;
            case 'streak_30':
              achievement.progress = Math.min(100, (userStats.streak / 30) * 100);
              break;
            case 'level_5':
              achievement.progress = Math.min(100, (userStats.level / 5) * 100);
              break;
            case 'level_10':
              achievement.progress = Math.min(100, (userStats.level / 10) * 100);
              break;
            default:
              achievement.progress = 0;
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        achievements: mergedAchievements,
        totalUnlocked: achievements.length,
        totalAchievements: allAchievements.length,
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/learn/gamification/achievements - Check and unlock achievements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    if (!userStats) {
      return NextResponse.json(
        { success: false, error: 'User stats not found' },
        { status: 404 }
      );
    }

    const newAchievements: Achievement[] = [];

    // Check for vocabulary achievements
    if (userStats.wordsLearned >= 10) {
      await checkAndUnlockAchievement(
        session.user.id,
        'vocabulary_10',
        'Word Collector',
        'Learn 10 new words',
        '📚',
        newAchievements
      );
    }
    if (userStats.wordsLearned >= 50) {
      await checkAndUnlockAchievement(
        session.user.id,
        'vocabulary_50',
        'Vocabulary Master',
        'Learn 50 new words',
        '🎆',
        newAchievements
      );
    }
    if (userStats.wordsLearned >= 100) {
      await checkAndUnlockAchievement(
        session.user.id,
        'vocabulary_100',
        'Word Wizard',
        'Learn 100 new words',
        '🧿',
        newAchievements
      );
    }

    // Check for quiz achievements
    if (userStats.quizzesTaken >= 10) {
      await checkAndUnlockAchievement(
        session.user.id,
        'quiz_master_10',
        'Quiz Enthusiast',
        'Complete 10 quizzes',
        '📝',
        newAchievements
      );
    }

    // Check for streak achievements
    if (userStats.streak >= 7) {
      await checkAndUnlockAchievement(
        session.user.id,
        'streak_7',
        'Week Warrior',
        'Maintain a 7-day streak',
        '🔥',
        newAchievements
      );
    }
    if (userStats.streak >= 30) {
      await checkAndUnlockAchievement(
        session.user.id,
        'streak_30',
        'Consistency Champion',
        'Maintain a 30-day streak',
        '🏆',
        newAchievements
      );
    }

    // Check for level achievements
    if (userStats.level >= 5) {
      await checkAndUnlockAchievement(
        session.user.id,
        'level_5',
        'Rising Star',
        'Reach level 5',
        '⭐',
        newAchievements
      );
    }
    if (userStats.level >= 10) {
      await checkAndUnlockAchievement(
        session.user.id,
        'level_10',
        'Advanced Learner',
        'Reach level 10',
        '🌟',
        newAchievements
      );
    }

    // Check for book completion
    if (userStats.booksCompleted >= 1) {
      await checkAndUnlockAchievement(
        session.user.id,
        'first_book',
        'Bookworm Begins',
        'Complete your first book',
        '📖',
        newAchievements
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newAchievements,
        totalNew: newAchievements.length,
      },
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}

async function checkAndUnlockAchievement(
  userId: string,
  achievementId: string,
  name: string,
  description: string,
  icon: string,
  newAchievements: Achievement[]
) {
  const existing = await prisma.achievement.findFirst({
    where: {
      userId,
      id: achievementId,
    },
  });

  if (!existing) {
    const achievement = await prisma.achievement.create({
      data: {
        id: achievementId,
        userId,
        name,
        description,
        icon,
        unlockedAt: new Date(),
      },
    });
    newAchievements.push(achievement);

    // Award XP for achievement
    const xpRewards: Record<string, number> = {
      first_book: 50,
      vocabulary_10: 25,
      vocabulary_50: 100,
      vocabulary_100: 250,
      perfect_quiz: 30,
      quiz_master_10: 50,
      streak_7: 75,
      streak_30: 200,
      level_5: 100,
      level_10: 250,
    };

    const xpReward = xpRewards[achievementId] || 0;
    if (xpReward > 0) {
      await prisma.userStats.update({
        where: { userId },
        data: {
          totalXp: { increment: xpReward },
        },
      });
    }
  }
}