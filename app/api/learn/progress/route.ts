import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, LearningProgress } from '@/types/learning';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get all learning progress for the user
    const learningProgress = await prisma.learningProgress.findMany({
      where: {
        userId,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authorName: true,
            coverImage: true,
            category: true,
            readingLevel: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Get stats
    const stats = await prisma.userStats.findUnique({
      where: { userId }
    });

    // Get vocabulary count
    const vocabularyCount = await prisma.vocabulary.count({
      where: { userId }
    });

    // Calculate current streak
    const readingSessions = await prisma.learningSession.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { startTime: 'desc' }
    });

    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (readingSessions.some(s => s.startTime.toDateString() === today)) {
      currentStreak = 1;
      if (readingSessions.some(s => s.startTime.toDateString() === yesterday)) {
        // Calculate full streak
        const dates = new Set(readingSessions.map(s => s.startTime.toDateString()));
        let checkDate = new Date();
        while (dates.has(checkDate.toDateString())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        progress: learningProgress,
        stats: stats || {
          xp: 0,
          level: 1,
          currentStreak: currentStreak,
          booksCompleted: learningProgress.filter(p => p.isCompleted).length,
          wordsLearned: vocabularyCount,
          totalReadingTime: learningProgress.reduce((sum, p) => sum + p.readingTime, 0),
          longestStreak: 0,
          lastActiveDate: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { bookId } = await request.json();

    // Validate input
    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Check if progress already exists
    const existingProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });

    if (existingProgress) {
      return NextResponse.json({
        success: true,
        data: existingProgress
      });
    }

    // Get book details for total pages
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { pageCount: true }
    });

    // Create new progress
    const progress = await prisma.learningProgress.create({
      data: {
        userId,
        bookId,
        pagesRead: 0,
        totalPages: book?.pageCount || 100, // Default to 100 if not specified
        readingTime: 0,
        lastPageRead: 0,
        isCompleted: false,
        metrics: {
          wordsLearned: 0,
          quizScore: 0,
          comprehension: 0
        }
      }
    });

    // Initialize user stats if not exists
    await prisma.userStats.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        lastActiveDate: new Date(),
        booksCompleted: 0,
        wordsLearned: 0,
        totalReadingTime: 0
      }
    });

    return NextResponse.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error creating progress:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}