import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, ReadingSession } from '@/types/learning';
import { XP_REWARDS } from '@/types/learning';

// POST /api/learn/sessions/[sessionId]/end - End reading session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get existing session
    const existingSession = await prisma.learningSession.findFirst({
      where: {
        id: params.sessionId,
        userId: session.user.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - existingSession.startTime.getTime()) / 1000
    );

    // Update session
    const readingSession = await prisma.learningSession.update({
      where: { id: params.sessionId },
      data: {
        endTime,
        duration,
      },
    });

    // Update learning progress with reading time
    await prisma.learningProgress.updateMany({
      where: {
        userId: session.user.id,
        bookId: existingSession.bookId,
      },
      data: {
        readingTime: { increment: duration },
        updatedAt: new Date(),
      },
    });

    // Update user stats with total reading time
    const minutesRead = Math.floor(duration / 60);
    await prisma.userStats.update({
      where: { userId: session.user.id },
      data: {
        totalReadingTime: { increment: minutesRead },
        lastActiveDate: new Date(),
      },
    });

    // Check for daily streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdaySession = await prisma.learningSession.findFirst({
      where: {
        userId: session.user.id,
        startTime: {
          gte: yesterday,
          lt: todayStart,
        },
      },
    });

    if (yesterdaySession) {
      // User read yesterday too, update streak
      await prisma.userStats.update({
        where: { userId: session.user.id },
        data: {
          currentStreak: { increment: 1 },
          xp: { increment: XP_REWARDS.DAILY_STREAK },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        session: readingSession,
        duration,
        minutesRead,
      },
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    );
  }
}