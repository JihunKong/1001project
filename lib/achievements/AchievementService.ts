'use server';

import { prisma } from '@/lib/prisma';
import { AchievementCategory } from '@prisma/client';

interface AchievementCriteria {
  type: string;
  count?: number;
  status?: string;
  streakDays?: number;
  masteryLevel?: number;
  score?: number;
}

interface CheckResult {
  achieved: boolean;
  progress?: {
    current: number;
    target: number;
  };
}

export async function checkAchievement(
  userId: string,
  achievementKey: string
): Promise<CheckResult> {
  const achievement = await prisma.achievement.findUnique({
    where: { key: achievementKey },
  });

  if (!achievement || !achievement.isActive) {
    return { achieved: false };
  }

  const criteria = achievement.criteria as unknown as AchievementCriteria;

  switch (criteria.type) {
    case 'books_read':
      return checkBooksRead(userId, criteria.count || 1);

    case 'reading_streak':
      return checkReadingStreak(userId, criteria.streakDays || 7);

    case 'vocabulary_count':
      return checkVocabularyCount(userId, criteria.count || 10);

    case 'vocabulary_mastery':
      return checkVocabularyMastery(userId, criteria.count || 5, criteria.masteryLevel || 4);

    case 'quiz_passed':
      return checkQuizzesPassed(userId, criteria.count || 1);

    case 'quiz_perfect':
      return checkPerfectQuizzes(userId, criteria.count || 1);

    case 'first_book':
      return checkFirstBook(userId);

    case 'first_quiz':
      return checkFirstQuiz(userId);

    case 'first_vocabulary':
      return checkFirstVocabulary(userId);

    default:
      return { achieved: false };
  }
}

async function checkBooksRead(userId: string, target: number): Promise<CheckResult> {
  const count = await prisma.readingProgress.count({
    where: {
      userId,
      isCompleted: true,
    },
  });

  return {
    achieved: count >= target,
    progress: { current: count, target },
  };
}

async function checkReadingStreak(userId: string, target: number): Promise<CheckResult> {
  const streak = await prisma.readingStreak.findUnique({
    where: { userId },
  });

  const current = streak?.currentStreak || 0;
  return {
    achieved: current >= target,
    progress: { current, target },
  };
}

async function checkVocabularyCount(userId: string, target: number): Promise<CheckResult> {
  const count = await prisma.vocabularyWord.count({
    where: { userId },
  });

  return {
    achieved: count >= target,
    progress: { current: count, target },
  };
}

async function checkVocabularyMastery(
  userId: string,
  target: number,
  masteryLevel: number
): Promise<CheckResult> {
  const count = await prisma.vocabularyWord.count({
    where: {
      userId,
      masteryLevel: { gte: masteryLevel },
    },
  });

  return {
    achieved: count >= target,
    progress: { current: count, target },
  };
}

async function checkQuizzesPassed(userId: string, target: number): Promise<CheckResult> {
  const count = await prisma.quizAttempt.count({
    where: {
      userId,
      passed: true,
    },
  });

  return {
    achieved: count >= target,
    progress: { current: count, target },
  };
}

async function checkPerfectQuizzes(userId: string, target: number): Promise<CheckResult> {
  const count = await prisma.quizAttempt.count({
    where: {
      userId,
      score: 100,
    },
  });

  return {
    achieved: count >= target,
    progress: { current: count, target },
  };
}

async function checkFirstBook(userId: string): Promise<CheckResult> {
  const count = await prisma.readingProgress.count({
    where: {
      userId,
      isCompleted: true,
    },
  });

  return {
    achieved: count >= 1,
    progress: { current: Math.min(count, 1), target: 1 },
  };
}

async function checkFirstQuiz(userId: string): Promise<CheckResult> {
  const count = await prisma.quizAttempt.count({
    where: {
      userId,
      passed: true,
    },
  });

  return {
    achieved: count >= 1,
    progress: { current: Math.min(count, 1), target: 1 },
  };
}

async function checkFirstVocabulary(userId: string): Promise<CheckResult> {
  const count = await prisma.vocabularyWord.count({
    where: { userId },
  });

  return {
    achieved: count >= 1,
    progress: { current: Math.min(count, 1), target: 1 },
  };
}

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const achievements = await prisma.achievement.findMany({
    where: { isActive: true },
  });

  const awarded: string[] = [];

  for (const achievement of achievements) {
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing?.isUnlocked) {
      continue;
    }

    const result = await checkAchievement(userId, achievement.key);

    if (result.achieved) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {
          isUnlocked: true,
          earnedAt: new Date(),
          progress: result.progress,
        },
        create: {
          userId,
          achievementId: achievement.id,
          isUnlocked: true,
          earnedAt: new Date(),
          progress: result.progress,
        },
      });
      awarded.push(achievement.key);
    } else if (result.progress) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {
          progress: result.progress,
        },
        create: {
          userId,
          achievementId: achievement.id,
          isUnlocked: false,
          progress: result.progress,
        },
      });
    }
  }

  return awarded;
}

export async function getUserAchievements(userId: string) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: [
      { isUnlocked: 'desc' },
      { earnedAt: 'desc' },
    ],
  });

  return userAchievements;
}

export async function getAchievementsByCategory(category: AchievementCategory) {
  return prisma.achievement.findMany({
    where: {
      category,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getUserStats(userId: string) {
  const [
    booksRead,
    vocabularyCount,
    quizzesPassed,
    streak,
    totalPoints,
  ] = await Promise.all([
    prisma.readingProgress.count({
      where: { userId, isCompleted: true },
    }),
    prisma.vocabularyWord.count({
      where: { userId },
    }),
    prisma.quizAttempt.count({
      where: { userId, passed: true },
    }),
    prisma.readingStreak.findUnique({
      where: { userId },
    }),
    prisma.userAchievement.findMany({
      where: { userId, isUnlocked: true },
      include: { achievement: true },
    }).then(achievements =>
      achievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0)
    ),
  ]);

  return {
    booksRead,
    vocabularyCount,
    quizzesPassed,
    currentStreak: streak?.currentStreak || 0,
    longestStreak: streak?.longestStreak || 0,
    totalPoints,
  };
}
