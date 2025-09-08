import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, ReadingSession } from '@/types/learning';

// POST /api/learn/sessions - Create new reading session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookId } = await request.json();
    
    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Create new session
    const readingSession = await prisma.learningSession.create({
      data: {
        userId: session.user.id,
        bookId,
        startTime: new Date(),
        pagesRead: 0,
        wordsClicked: [],
        highlights: [],
        notes: [],
      },
    });

    // Update user's last active time
    await prisma.userStats.upsert({
      where: { userId: session.user.id },
      update: { lastActive: new Date() },
      create: {
        userId: session.user.id,
        totalXP: 0,
        level: 1,
        streak: 0,
        lastActive: new Date(),
        booksRead: 0,
        wordsLearned: 0,
        quizzesPassed: 0,
        totalReadingTime: 0,
        postsCreated: 0,
        likesReceived: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: readingSession,
    } as ApiResponse<ReadingSession>);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// GET /api/learn/sessions - Get recent sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const bookId = url.searchParams.get('bookId');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const where = {
      userId: session.user.id,
      ...(bookId && { bookId }),
    };

    const sessions = await prisma.learningSession.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        book: {
          select: {
            title: true,
            authorName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}