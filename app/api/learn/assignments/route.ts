import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/learn/assignments
 * 
 * Returns book assignments for the student with assignment details and progress
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role || 'LEARNER';
    
    // Only allow learners/students to get assignments
    if (userRole === 'TEACHER' || userRole === 'ADMIN') {
      return NextResponse.json(
        { error: 'This endpoint is for students only' },
        { status: 403 }
      );
    }

    // Fetch actual book assignments from database
    const bookAssignments = await prisma.bookAssignment.findMany({
      where: {
        OR: [
          // Direct assignment to student
          { studentId: userId },
          // Assignment to classes where student is enrolled
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
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authorName: true,
            coverImage: true,
            summary: true,
            pageCount: true,
            language: true,
            category: true,
            isPremium: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            subject: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    // Get reading progress for assigned books
    const bookIds = bookAssignments.map(assignment => assignment.bookId);
    const readingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: userId,
        storyId: { in: bookIds }
      },
      select: {
        storyId: true,
        currentPage: true,
        totalPages: true,
        percentComplete: true,
        lastReadAt: true,
        totalReadingTime: true
      }
    });

    // Create progress lookup map
    const progressMap = readingProgress.reduce((map, progress) => {
      map[progress.storyId] = progress;
      return map;
    }, {} as Record<string, any>);

    // Transform assignments with progress data
    const assignments = bookAssignments.map(assignment => {
      const progress = progressMap[assignment.bookId];
      const now = new Date();
      const isOverdue = assignment.dueDate ? now > assignment.dueDate : false;
      
      // Determine status based on progress and due date
      let status = 'pending';
      if (progress && progress.percentComplete >= 100) {
        status = 'completed';
      } else if (isOverdue) {
        status = 'overdue';
      } else if (progress && progress.percentComplete > 0) {
        status = 'in_progress';
      }

      return {
        id: assignment.id,
        type: 'book_reading',
        title: `Read: ${assignment.book.title}`,
        description: assignment.instructions || `Read "${assignment.book.title}" by ${assignment.book.authorName}`,
        book: assignment.book,
        teacher: assignment.teacher,
        class: assignment.class,
        assignedAt: assignment.assignedAt.toISOString(),
        dueDate: assignment.dueDate?.toISOString(),
        isRequired: assignment.isRequired,
        allowDiscussion: assignment.allowDiscussion,
        status,
        isOverdue,
        progress: progress ? {
          currentPage: progress.currentPage,
          totalPages: progress.totalPages,
          percentComplete: progress.percentComplete,
          lastReadAt: progress.lastReadAt?.toISOString(),
          totalReadingTime: progress.totalReadingTime
        } : {
          currentPage: 0,
          totalPages: assignment.book.pageCount || 0,
          percentComplete: 0,
          lastReadAt: null,
          totalReadingTime: 0
        }
      };
    });
    
    // Calculate stats
    const stats = {
      total: assignments.length,
      pending: assignments.filter(a => a.status === 'pending').length,
      in_progress: assignments.filter(a => a.status === 'in_progress').length,
      completed: assignments.filter(a => a.status === 'completed').length,
      overdue: assignments.filter(a => a.status === 'overdue').length
    };

    // Get class enrollments
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: userId,
        status: 'ACTIVE'
      },
      include: {
        class: {
          select: {
            id: true,
            code: true,
            name: true,
            subject: true,
            gradeLevel: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    const transformedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      classId: enrollment.classId,
      class: enrollment.class,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      status: enrollment.status,
      grade: enrollment.grade,
      attendance: enrollment.attendance,
      progress: enrollment.progress
    }));

    return NextResponse.json({
      success: true,
      assignments,
      stats,
      enrollments: transformedEnrollments,
      message: assignments.length === 0 ? 'No assignments yet. Your teacher will assign books for you to read.' : undefined
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return a placeholder response for now
    return NextResponse.json({
      success: false,
      message: 'Assignment submission is not yet implemented'
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}