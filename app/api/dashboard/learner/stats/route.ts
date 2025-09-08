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

    // Get reading progress stats
    const readingProgress = await prisma.readingProgress.findMany({
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
    const storiesRead = readingProgress.filter(p => p.percentComplete === 100).length;
    const currentlyReading = readingProgress.filter(p => p.percentComplete > 0 && p.percentComplete < 100).length;
    const totalReadingTime = readingProgress.reduce((sum, p) => sum + (p.totalReadingTime || 0), 0);

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
      where: { userId }
    });
    const points = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.count({
      where: { userId }
    });

    // Determine user level based on progress
    let level = 'Beginner';
    if (storiesRead > 10) level = 'Intermediate';
    if (storiesRead > 25) level = 'Advanced';
    if (storiesRead > 50) level = 'Expert';

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user?.name || 'Learner',
          email: user?.email,
          level
        },
        stats: {
          storiesRead,
          currentlyReading,
          wordsLearned: vocabularyCount,
          timeSpent: Math.round(totalReadingTime / 60), // Convert to minutes
          currentStreak,
          points,
          quizzesCompleted: quizAttempts,
          achievementsUnlocked: achievements.length
        },
        recentActivity: readingProgress.slice(0, 5).map(p => ({
          bookId: p.book.id,
          bookTitle: p.book.title,
          progress: p.percentComplete,
          lastReadAt: p.lastReadAt
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