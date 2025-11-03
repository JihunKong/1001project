import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for progress updates
const UpdateProgressSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  currentChapter: z.number().min(1).optional(),
  currentPage: z.number().min(1).optional(),
  currentPosition: z.string().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
  readingTime: z.number().min(0).optional(), // Minutes for this session
  notes: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
});

// GET /api/learner/reading-progress - Get reading progress for learner
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a learner
    if (session.user.role !== UserRole.LEARNER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const status = searchParams.get('status'); // 'in_progress', 'completed', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build where clause for reading progress
    const where: any = {
      userId: session.user.id,
    };

    if (bookId) {
      where.bookId = bookId;
    }

    if (status === 'completed') {
      where.isCompleted = true;
    } else if (status === 'in_progress') {
      where.isCompleted = false;
      where.percentComplete = { gt: 0 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reading progress with book details
    const [progressRecords, totalCount] = await Promise.all([
      prisma.readingProgress.findMany({
        where,
        orderBy: { lastReadAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          bookId: true,
          currentChapter: true,
          currentPage: true,
          totalPages: true,
          currentPosition: true,
          percentComplete: true,
          totalReadingTime: true,
          lastReadAt: true,
          startedAt: true,
          completedAt: true,
          isCompleted: true,
          notes: true,
          book: {
            select: {
              id: true,
              title: true,
              subtitle: true,
              authorName: true,
              coverImage: true,
              contentType: true,
              language: true,
              ageRange: true,
              readingLevel: true,
              readingTime: true,
              pageCount: true,
              category: true,
              tags: true,
              isPublished: true,
              visibility: true,
            }
          }
        }
      }),
      prisma.readingProgress.count({ where })
    ]);

    // If specific book requested, also get assignment context
    let assignmentContext = null;
    if (bookId && progressRecords.length > 0) {
      // Find if this book is part of any class assignments
      const assignments = await prisma.assignment.findMany({
        where: {
          resources: { has: bookId },
          submissions: {
            some: { studentId: session.user.id }
          }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          points: true,
          class: {
            select: {
              id: true,
              name: true,
              teacher: {
                select: {
                  name: true,
                }
              }
            }
          },
          submissions: {
            where: { studentId: session.user.id },
            select: {
              id: true,
              status: true,
              grade: true,
              feedback: true,
              submittedAt: true,
            }
          }
        }
      });

      assignmentContext = assignments.map(assignment => ({
        assignment: {
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          points: assignment.points,
          class: assignment.class,
        },
        submission: assignment.submissions[0] || null,
      }));
    }

    // Calculate summary statistics
    const summaryStats = {
      totalBooks: totalCount,
      completedBooks: progressRecords.filter(p => p.isCompleted).length,
      inProgressBooks: progressRecords.filter(p => !p.isCompleted && p.percentComplete > 0).length,
      totalReadingTime: progressRecords.reduce((sum, p) => sum + p.totalReadingTime, 0),
      averageProgress: totalCount > 0 ?
        progressRecords.reduce((sum, p) => sum + p.percentComplete, 0) / totalCount : 0,
    };

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Enhance progress records with calculated fields
    const enhancedRecords = progressRecords.map(progress => {
      const estimatedFinishTime = progress.book.readingTime && progress.percentComplete > 0 ?
        Math.round((progress.book.readingTime * (100 - progress.percentComplete)) / 100) : null;

      const readingStreakDays = calculateReadingStreak(progress.lastReadAt);

      return {
        ...progress,
        calculated: {
          estimatedFinishTime,
          readingStreakDays,
          pagesRemaining: progress.totalPages && progress.currentPage ?
            progress.totalPages - progress.currentPage : null,
          averageReadingSpeed: progress.totalReadingTime > 0 && progress.currentPage ?
            Math.round(progress.currentPage / (progress.totalReadingTime / 60)) : null, // pages per hour
        }
      };
    });

    const response: any = {
      progress: enhancedRecords,
      summary: summaryStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };

    if (assignmentContext) {
      response.assignmentContext = assignmentContext;
    }

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error fetching reading progress', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/learner/reading-progress - Update reading progress
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a learner
    if (session.user.role !== UserRole.LEARNER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = UpdateProgressSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify book exists and is accessible
    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        visibility: true,
        pageCount: true,
        readingTime: true,
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.isPublished || book.visibility === 'PRIVATE') {
      return NextResponse.json(
        { error: 'Book is not accessible' },
        { status: 403 }
      );
    }

    // Get or create reading progress record
    const existingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: validatedData.bookId,
        }
      }
    });

    const now = new Date();

    if (existingProgress) {
      // Update existing progress
      const updateData: any = {
        lastReadAt: now,
      };

      if (validatedData.currentChapter !== undefined) {
        updateData.currentChapter = validatedData.currentChapter;
      }

      if (validatedData.currentPage !== undefined) {
        updateData.currentPage = validatedData.currentPage;
        updateData.totalPages = book.pageCount || validatedData.currentPage;

        // Auto-calculate percentage if page info is available
        if (book.pageCount) {
          updateData.percentComplete = Math.min(
            Math.round((validatedData.currentPage / book.pageCount) * 100),
            100
          );
        }
      }

      if (validatedData.currentPosition !== undefined) {
        updateData.currentPosition = validatedData.currentPosition;
      }

      if (validatedData.percentComplete !== undefined) {
        updateData.percentComplete = validatedData.percentComplete;
      }

      if (validatedData.readingTime !== undefined) {
        updateData.totalReadingTime = existingProgress.totalReadingTime + validatedData.readingTime;
      }

      if (validatedData.notes !== undefined) {
        updateData.notes = validatedData.notes;
      }

      if (validatedData.isCompleted !== undefined) {
        updateData.isCompleted = validatedData.isCompleted;
        if (validatedData.isCompleted && !existingProgress.completedAt) {
          updateData.completedAt = now;
          updateData.percentComplete = 100;
        }
      }

      const updatedProgress = await prisma.readingProgress.update({
        where: { id: existingProgress.id },
        data: updateData,
        select: {
          id: true,
          currentChapter: true,
          currentPage: true,
          percentComplete: true,
          totalReadingTime: true,
          isCompleted: true,
          lastReadAt: true,
          completedAt: true,
        }
      });

      return NextResponse.json({
        message: 'Reading progress updated successfully',
        progress: updatedProgress
      });

    } else {
      // Create new progress record
      const newProgress = await prisma.readingProgress.create({
        data: {
          userId: session.user.id,
          bookId: validatedData.bookId,
          currentChapter: validatedData.currentChapter || 1,
          currentPage: validatedData.currentPage || null,
          totalPages: book.pageCount || validatedData.currentPage || null,
          currentPosition: validatedData.currentPosition || null,
          percentComplete: validatedData.percentComplete || 0,
          totalReadingTime: validatedData.readingTime || 0,
          notes: validatedData.notes || [],
          isCompleted: validatedData.isCompleted || false,
          startedAt: now,
          lastReadAt: now,
          ...(validatedData.isCompleted && { completedAt: now }),
        },
        select: {
          id: true,
          currentChapter: true,
          currentPage: true,
          percentComplete: true,
          totalReadingTime: true,
          isCompleted: true,
          startedAt: true,
          lastReadAt: true,
          completedAt: true,
        }
      });

      return NextResponse.json({
        message: 'Reading progress created successfully',
        progress: newProgress
      }, { status: 201 });
    }

  } catch (error) {
    logger.error('Error updating reading progress', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate reading streak
function calculateReadingStreak(lastReadAt: Date): number {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastReadAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Simple implementation - in a real app, you'd track daily reading activity
  if (diffDays <= 1) return diffDays;
  return 0;
}