import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAssignmentAccess } from '@/lib/assignment-access';
import type { ApiResponse, LearningProgress } from '@/types/learning';

// GET /api/learn/progress/[bookId] - Get progress for a specific book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
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
    const userRole = session.user.role || 'LEARNER';
    const { bookId } = await params;

    // Check assignment-based access for students
    const accessValidation = await validateAssignmentAccess(userId, bookId, userRole);
    
    if (!accessValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied', 
          message: accessValidation.message || 'You do not have access to this book'
        },
        { status: 403 }
      );
    }

    const progress = await prisma.learningProgress.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: bookId,
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Progress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// PUT /api/learn/progress/[bookId] - Update progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
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
    const userRole = session.user.role || 'LEARNER';
    const { bookId } = await params;

    // Check assignment-based access for students
    const accessValidation = await validateAssignmentAccess(userId, bookId, userRole);
    
    if (!accessValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied', 
          message: accessValidation.message || 'You do not have access to this book'
        },
        { status: 403 }
      );
    }

    const updates = await request.json();
    
    const progress = await prisma.learningProgress.update({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: bookId,
        },
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}