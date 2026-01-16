import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'LEARNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId, readingTime, currentPosition, currentPage, totalPages, percentComplete } = body;

    if (!bookId || typeof bookId !== 'string') {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Upsert progress - create if not exists, update if exists
    const existingProgress = await prisma.readingProgress.findFirst({
      where: {
        userId: session.user.id,
        bookId
      }
    });

    const updateData: Record<string, unknown> = {
      lastReadAt: new Date(),
    };

    if (currentPosition !== undefined) {
      updateData.currentPosition = currentPosition?.toString();
    }
    if (currentPage !== undefined) {
      updateData.currentPage = currentPage;
    }
    if (totalPages !== undefined) {
      updateData.totalPages = totalPages;
    }
    if (percentComplete !== undefined) {
      updateData.percentComplete = percentComplete;
    }

    let updatedProgress;
    if (existingProgress) {
      if (readingTime) {
        updateData.totalReadingTime = existingProgress.totalReadingTime + readingTime;
      }
      updatedProgress = await prisma.readingProgress.update({
        where: { id: existingProgress.id },
        data: updateData
      });
    } else {
      updatedProgress = await prisma.readingProgress.create({
        data: {
          userId: session.user.id,
          bookId,
          currentPosition: currentPosition?.toString() || '0',
          currentPage: currentPage || 1,
          totalPages: totalPages || null,
          percentComplete: percentComplete || 0,
          totalReadingTime: readingTime || 0,
          lastReadAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress: updatedProgress
    });
  } catch (error) {
    console.error('Error saving reading progress:', error);
    return NextResponse.json(
      { error: 'Failed to save reading progress' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'LEARNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const progress = await prisma.readingProgress.findFirst({
      where: {
        userId: session.user.id,
        bookId
      }
    });

    if (!progress) {
      return NextResponse.json(
        { error: 'Reading progress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return NextResponse.json(
      { error: 'Failed to get reading progress' },
      { status: 500 }
    );
  }
}
