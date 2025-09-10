import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Input validation schema
const updateProgressSchema = z.object({
  storyId: z.string(),
  percentComplete: z.number().min(0).max(100),
  currentPage: z.number().optional(),
  totalPages: z.number().optional(),
  currentPosition: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);
    
    const userId = session.user.id;
    const { storyId, percentComplete, currentPage, totalPages, currentPosition } = validatedData;

    // Verify that the user has access to this story (is assigned to them)
    const assignment = await prisma.bookAssignment.findFirst({
      where: {
        bookId: storyId,
        OR: [
          { studentId: userId },
          { 
            class: { 
              enrollments: { 
                some: { 
                  studentId: userId,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ]
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You do not have access to this story' },
        { status: 403 }
      );
    }

    // Calculate reading time increment (assume 5 minutes since last update for simplicity)
    const readingTimeIncrement = Math.max(1, Math.floor(percentComplete * 0.1));

    // Upsert reading progress
    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      },
      update: {
        percentComplete,
        currentPage: currentPage || 0,
        totalPages: totalPages || 1,
        currentPosition,
        totalReadingTime: {
          increment: readingTimeIncrement
        },
        lastReadAt: new Date()
      },
      create: {
        userId,
        storyId,
        percentComplete,
        currentPage: currentPage || 0,
        totalPages: totalPages || 1,
        currentPosition,
        totalReadingTime: readingTimeIncrement,
        lastReadAt: new Date()
      }
    });

    // Update user's overall reading statistics
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalReadingTime: {
          increment: readingTimeIncrement
        },
        lastActiveDate: new Date(),
      },
      create: {
        userId,
        totalReadingTime: readingTimeIncrement,
        xp: 0,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date(),
        booksCompleted: 0,
        wordsLearned: 0,
      }
    });

    // If story is completed (>= 95%), mark assignment as completed
    if (percentComplete >= 95) {
      await prisma.bookAssignment.updateMany({
        where: {
          bookId: storyId,
          OR: [
            { studentId: userId },
            { 
              class: { 
                enrollments: { 
                  some: { 
                    studentId: userId,
                    status: 'ACTIVE'
                  }
                }
              }
            }
          ]
        },
        data: {
          // completedAt: new Date() // Field doesn't exist on BookAssignment model
        }
      });

      // Create achievement for completing the book
      try {
        // Achievement system needs proper implementation
        // Achievement model doesn't have userId field - this should use UserAchievement
        // await prisma.achievement.create({
        //   data: {
        //     userId,
        //     type: 'BOOK_COMPLETED',
        //     title: 'Book Completed!',
        //     description: `Completed reading a book`,
        //     metadata: {
        //       bookId: storyId,
        //       completedAt: new Date().toISOString(),
        //       readingTime: progress.totalReadingTime
        //     }
        //   }
        // });
      } catch (achievementError) {
        // Ignore if achievement already exists
        console.log('Achievement may already exist:', achievementError);
      }
    }

    return NextResponse.json({
      success: true,
      progress: {
        id: progress.id,
        percentComplete: progress.percentComplete,
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        totalReadingTime: progress.totalReadingTime,
        lastReadAt: progress.lastReadAt,
        isCompleted: percentComplete >= 95
      }
    });

  } catch (error) {
    console.error('Error updating reading progress:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update reading progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get reading progress for the specific story
    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

    if (!progress) {
      return NextResponse.json({
        success: true,
        progress: {
          percentComplete: 0,
          currentPage: 0,
          totalPages: 0,
          totalReadingTime: 0,
          lastReadAt: null,
          isCompleted: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress: {
        id: progress.id,
        percentComplete: progress.percentComplete,
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        totalReadingTime: progress.totalReadingTime,
        lastReadAt: progress.lastReadAt,
        isCompleted: progress.percentComplete >= 95
      }
    });

  } catch (error) {
    console.error('Error fetching reading progress:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reading progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}