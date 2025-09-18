import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        role: true,
      }
    });

    // Get learning progress stats  
    const learningProgress = await prisma.learningProgress.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    // Calculate statistics  
    const booksRead = learningProgress.filter(p => p.isCompleted === true).length;
    const currentlyReading = learningProgress.filter(p => p.pagesRead > 0 && !p.isCompleted).length;
    const totalReadingTime = learningProgress.reduce((sum, p) => sum + (p.readingTime || 0), 0);

    // Get vocabulary stats
    const vocabularyCount = await prisma.vocabulary.count({
      where: { userId }
    });

    // Get learning sessions for streak calculation
    const sessions = await prisma.learningSession.findMany({
      where: { 
        userId,
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const hasSession = sessions.some(s => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });
      
      if (hasSession) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Get achievements/points
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            xpReward: true,
          }
        }
      }
    });
    const points = achievements.reduce((sum, a) => sum + (a.achievement.xpReward || 0), 0);

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.count({
      where: { userId }
    });

    // Determine user level based on progress
    let level = 'Beginner';
    if (booksRead > 10) level = 'Intermediate';
    if (booksRead > 25) level = 'Advanced';
    if (booksRead > 50) level = 'Expert';

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user?.name || 'Learner',
          email: user?.email,
          level
        },
        stats: {
          booksRead,
          currentlyReading,
          wordsLearned: vocabularyCount,
          timeSpent: Math.round(totalReadingTime), // Already in minutes
          currentStreak,
          points,
          quizzesCompleted: quizAttempts,
          achievementsUnlocked: achievements.length
        },
        recentActivity: learningProgress.slice(0, 5).map(p => ({
          bookId: p.book.id,
          bookTitle: p.book.title,
          progress: p.totalPages > 0 ? Math.round((p.pagesRead / p.totalPages) * 100) : 0,
          lastReadAt: p.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching learner stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}