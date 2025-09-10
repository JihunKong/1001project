import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Input validation schema
const assignBookSchema = z.object({
  bookId: z.string(),
  classId: z.string().optional(),
  studentId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  instructions: z.string().optional(),
  isRequired: z.boolean().default(true),
  allowDiscussion: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission
    if (!userHasPermission(session, PERMISSIONS.BOOK_ASSIGN)) {
      return NextResponse.json(
        { error: 'You do not have permission to assign books' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = assignBookSchema.parse(body);

    // Validate that either classId or studentId is provided
    if (!validatedData.classId && !validatedData.studentId) {
      return NextResponse.json(
        { error: 'Either classId or studentId must be provided' },
        { status: 400 }
      );
    }

    const teacherId = session.user.id;
    const userRole = session.user.role as UserRole;

    // Verify teacher owns the class (if classId provided)
    if (validatedData.classId) {
      const classRecord = await prisma.class.findFirst({
        where: {
          id: validatedData.classId,
          ...(userRole !== UserRole.ADMIN && userRole !== UserRole.INSTITUTION 
            ? { teacherId } 
            : {}),
        },
        include: {
          _count: {
            select: {
              enrollments: true,
            }
          }
        }
      });

      if (!classRecord) {
        return NextResponse.json(
          { error: 'Class not found or you do not have permission to assign books to this class' },
          { status: 403 }
        );
      }

      // Check if class is active
      if (!classRecord.isActive) {
        return NextResponse.json(
          { error: 'Cannot assign books to an inactive class' },
          { status: 400 }
        );
      }
    }

    // Verify the student is in teacher's class (if studentId provided)
    if (validatedData.studentId && userRole === UserRole.TEACHER) {
      const studentInClass = await prisma.classEnrollment.findFirst({
        where: {
          studentId: validatedData.studentId,
          class: {
            teacherId,
          },
          status: 'ACTIVE',
        }
      });

      if (!studentInClass) {
        return NextResponse.json(
          { error: 'Student is not in any of your classes' },
          { status: 403 }
        );
      }
    }

    // Verify the book exists and is published
    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        authorName: true,
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.isPublished) {
      return NextResponse.json(
        { error: 'Cannot assign unpublished books' },
        { status: 400 }
      );
    }

    // Check for existing assignment
    const existingAssignment = await prisma.bookAssignment.findFirst({
      where: {
        bookId: validatedData.bookId,
        ...(validatedData.classId 
          ? { classId: validatedData.classId }
          : { studentId: validatedData.studentId }
        ),
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This book is already assigned to the selected target' },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await prisma.bookAssignment.create({
      data: {
        bookId: validatedData.bookId,
        classId: validatedData.classId,
        studentId: validatedData.studentId,
        teacherId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        instructions: validatedData.instructions,
        isRequired: validatedData.isRequired,
        allowDiscussion: validatedData.allowDiscussion,
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
            readingLevel: true,
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                enrollments: true,
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Create notifications for students
    if (validatedData.classId) {
      // Get all students in the class
      const enrollments = await prisma.classEnrollment.findMany({
        where: {
          classId: validatedData.classId,
          status: 'ACTIVE',
        },
        select: {
          studentId: true,
        }
      });

      // Create notifications for all students
      const notifications = enrollments.map(enrollment => ({
        userId: enrollment.studentId,
        type: 'SYSTEM' as const,
        title: 'New Book Assignment',
        message: `Your teacher has assigned "${book.title}" to your class`,
        data: {
          bookId: book.id,
          bookTitle: book.title,
          assignmentId: assignment.id,
          dueDate: validatedData.dueDate,
        },
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    } else if (validatedData.studentId) {
      // Create notification for individual student
      await prisma.notification.create({
        data: {
          userId: validatedData.studentId,
          type: 'SYSTEM' as const,
          title: 'New Book Assignment',
          message: `Your teacher has assigned "${book.title}" to you`,
          data: {
            bookId: book.id,
            bookTitle: book.title,
            assignmentId: assignment.id,
            dueDate: validatedData.dueDate,
          },
        }
      });
    }

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: teacherId,
        action: 'BOOK_ASSIGNED',
        entity: 'BOOK_ASSIGNMENT',
        entityId: assignment.id,
        metadata: {
          bookId: book.id,
          bookTitle: book.title,
          targetType: validatedData.classId ? 'class' : 'student',
          targetId: validatedData.classId || validatedData.studentId,
        },
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned "${book.title}"`,
      assignment,
    });

  } catch (error) {
    console.error('Error assigning book:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to assign book' },
      { status: 500 }
    );
  }
}

// GET endpoint to list assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;
    
    let assignments: any[] = [];

    if (userRole === UserRole.TEACHER) {
      // Teachers see assignments they created
      assignments = await prisma.bookAssignment.findMany({
        where: {
          teacherId: userId,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authorName: true,
              coverImage: true,
              pageCount: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (userRole === UserRole.LEARNER) {
      // Students see their assignments
      assignments = await prisma.bookAssignment.findMany({
        where: {
          OR: [
            {
              studentId: userId,
            },
            {
              class: {
                enrollments: {
                  some: {
                    studentId: userId,
                    status: 'ACTIVE',
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
              readingLevel: true,
            }
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          assignedAt: 'desc'
        }
      });
    } else {
      assignments = [];
    }

    return NextResponse.json({
      success: true,
      assignments,
      count: assignments.length,
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}