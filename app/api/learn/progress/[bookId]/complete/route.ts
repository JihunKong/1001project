import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, LearningProgress } from '@/types/learning';
import { XP_REWARDS } from '@/types/learning';

// POST /api/learn/progress/[bookId]/complete - Mark book as completed
export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const bookId = params.bookId;

    // Update progress to completed
    const progress = await prisma.learningProgress.update({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        pagesRead: prisma.learningProgress.fields.totalPages, // Set pages read to total
      },
    });

    // Update user stats
    const userStats = await prisma.userStats.upsert({
      where: { userId },
      update: {
        booksRead: { increment: 1 },
        totalXP: { increment: XP_REWARDS.BOOK_COMPLETED },
        lastActive: new Date(),
      },
      create: {
        userId,
        totalXP: XP_REWARDS.BOOK_COMPLETED,
        level: 1,
        streak: 1,
        lastActive: new Date(),
        booksRead: 1,
        wordsLearned: 0,
        quizzesPassed: 0,
        totalReadingTime: 0,
        postsCreated: 0,
        likesReceived: 0,
      },
    });

    // Check for achievements
    const achievements = [];
    
    // First book achievement
    if (userStats.booksRead === 1) {
      const firstBookAchievement = await prisma.achievement.findFirst({
        where: { name: 'First Book' },
      });
      
      if (firstBookAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: firstBookAchievement.id,
            progress: 100,
          },
        });
        achievements.push(firstBookAchievement);
      }
    }
    
    // Book milestone achievements (5, 10, 25, 50, 100 books)
    const milestones = [5, 10, 25, 50, 100];
    if (milestones.includes(userStats.booksRead)) {
      const milestoneAchievement = await prisma.achievement.findFirst({
        where: { name: `${userStats.booksRead} Books Read` },
      });
      
      if (milestoneAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: milestoneAchievement.id,
            progress: 100,
          },
        });
        achievements.push(milestoneAchievement);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        progress,
        xpEarned: XP_REWARDS.BOOK_COMPLETED,
        newStats: userStats,
        achievements,
      },
    });
  } catch (error) {
    console.error('Error marking book as completed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark book as completed' },
      { status: 500 }
    );
  }
}