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

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    // Get teacher's classes and students
    const classes = await prisma.class.findMany({
      where: {
        teacherId: session.user.id
      },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    // Get all unique students from classes
    const studentMap = new Map();
    
    for (const classItem of classes) {
      for (const enrollment of classItem.enrollments) {
        if (!studentMap.has(enrollment.student.id)) {
          // Get student's reading progress
          const readingProgress = await prisma.readingProgress.findMany({
            where: {
              userId: enrollment.student.id
            },
            orderBy: {
              lastReadAt: 'desc'
            },
            take: 5
          });

          const completedBooks = readingProgress.filter(p => p.percentComplete === 100).length;
          const currentBook = readingProgress.find(p => p.percentComplete > 0 && p.percentComplete < 100);
          
          // Get current book title if exists
          let currentBookTitle = null;
          if (currentBook) {
            const book = await prisma.book.findUnique({
              where: { id: currentBook.bookId },
              select: { title: true }
            });
            currentBookTitle = book?.title || null;
          }

          // Calculate average completion rate
          const totalProgress = readingProgress.reduce((sum, p) => sum + p.percentComplete, 0);
          const avgCompletionRate = readingProgress.length > 0 
            ? Math.round(totalProgress / readingProgress.length)
            : 0;

          // Calculate last active time
          const lastActive = readingProgress[0]?.lastReadAt;
          let lastActiveText = 'Never';
          if (lastActive) {
            const hoursAgo = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60));
            if (hoursAgo < 1) {
              lastActiveText = 'Just now';
            } else if (hoursAgo < 24) {
              lastActiveText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
            } else {
              const daysAgo = Math.floor(hoursAgo / 24);
              lastActiveText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
            }
          }

          studentMap.set(enrollment.student.id, {
            id: enrollment.student.id,
            name: enrollment.student.name || 'Student',
            email: enrollment.student.email,
            enrolledAt: enrollment.student.createdAt.toISOString(),
            status: 'ACTIVE' as const,
            lastActive: lastActive?.toISOString(),
            progress: {
              booksRead: completedBooks,
              currentBooks: currentBook ? 1 : 0,
              avgProgress: avgCompletionRate,
              readingStreak: 0, // TODO: Calculate actual streak
              sessionLength: 30, // TODO: Calculate actual session length
              difficultyLevel: 'INTERMEDIATE' as const
            },
            assignments: {
              total: 0, // TODO: Calculate actual assignments
              completed: 0,
              pending: 0,
              overdue: 0
            },
            classId: classItem.id,
            className: classItem.name
          });
        }
      }
    }

    // Convert map to array
    const students = Array.from(studentMap.values());

    return NextResponse.json({
      success: true,
      data: {
        students,
        totalClasses: classes.length
      }
    });

  } catch (error) {
    console.error('Error fetching teacher students:', error);
    
    // If no classes exist yet, return empty array
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          totalClasses: 0
        }
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch students',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}