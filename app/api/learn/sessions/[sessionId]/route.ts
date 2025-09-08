import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, ReadingSession } from '@/types/learning';
import { XP_REWARDS } from '@/types/learning';

// PUT /api/learn/sessions/[sessionId] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Verify session belongs to user
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

    // Update session
    const readingSession = await prisma.learningSession.update({
      where: { id: params.sessionId },
      data: updates,
    });

    // If pages were read, update progress and award XP
    if (updates.pagesRead && updates.pagesRead > existingSession.pagesRead) {
      const pagesRead = updates.pagesRead - existingSession.pagesRead;
      const xpEarned = pagesRead * XP_REWARDS.PAGE_READ;

      // Update learning progress
      await prisma.learningProgress.updateMany({
        where: {
          userId: session.user.id,
          bookId: existingSession.bookId,
        },
        data: {
          pagesRead: updates.pagesRead,
          lastPageRead: updates.pagesRead,
          updatedAt: new Date(),
        },
      });

      // Update user stats
      await prisma.userStats.update({
        where: { userId: session.user.id },
        data: {
          totalXP: { increment: xpEarned },
          lastActive: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: readingSession,
    } as ApiResponse<ReadingSession>);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}