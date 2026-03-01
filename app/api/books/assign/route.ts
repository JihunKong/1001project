import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, AssignmentType } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for book assignment
const AssignBookSchema = z.object({
  bookId: z.string()
    .min(1, 'Book ID is required'),
  classId: z.string()
    .min(1, 'Class ID is required'),
  assignmentType: z.enum(['READING', 'WRITING', 'PROJECT', 'QUIZ', 'PRESENTATION', 'GROUP_WORK'])
    .default('READING'),
  title: z.string()
    .min(1, 'Assignment title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  dueDate: z.string()
    .datetime('Invalid due date format'),
  points: z.number()
    .min(0, 'Points must be non-negative')
    .max(1000, 'Points must be less than 1000')
    .default(100),
  requirements: z.object({
    readFullBook: z.boolean().default(true),
    submitReview: z.boolean().default(false),
    writeResponse: z.boolean().default(false),
    minimumWords: z.number().min(0).optional(),
    discussionParticipation: z.boolean().default(false),
  }).optional(),
  // Optional assignment to specific students (otherwise assigned to whole class)
  studentIds: z.array(z.string()).optional(),
});

// POST /api/books/assign - Assign book to class
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = AssignBookSchema.parse(body);
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
        isPremium: true,
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

    if (book.visibility === 'PRIVATE') {
      return NextResponse.json(
        { error: 'Cannot assign private books' },
        { status: 400 }
      );
    }

    // Verify class exists and teacher has access
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId },
      select: {
        id: true,
        name: true,
        teacherId: true,
        isActive: true,
        enrollments: {
          select: {
            studentId: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (!classData.isActive) {
      return NextResponse.json(
        { error: 'Cannot assign to inactive class' },
        { status: 400 }
      );
    }

    // Check if teacher owns the class (unless admin)
    if (session.user.role !== UserRole.ADMIN && classData.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only assign books to your own classes' },
        { status: 403 }
      );
    }

    // Validate student IDs if provided
    if (validatedData.studentIds && validatedData.studentIds.length > 0) {
      const enrolledStudentIds = classData.enrollments.map(e => e.studentId);
      const invalidStudentIds = validatedData.studentIds.filter(id => !enrolledStudentIds.includes(id));

      if (invalidStudentIds.length > 0) {
        return NextResponse.json(
          { error: `Some students are not enrolled in this class: ${invalidStudentIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Parse due date
    const dueDate = new Date(validatedData.dueDate);
    if (dueDate <= new Date()) {
      return NextResponse.json(
        { error: 'Due date must be in the future' },
        { status: 400 }
      );
    }

    // Create assignment with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the assignment
      const assignment = await tx.assignment.create({
        data: {
          classId: validatedData.classId,
          title: validatedData.title,
          description: validatedData.description,
          type: validatedData.assignmentType as AssignmentType,
          dueDate: dueDate,
          points: validatedData.points,
          resources: [validatedData.bookId], // Store book ID in resources
          requirements: validatedData.requirements || {},
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          dueDate: true,
          points: true,
          createdAt: true,
        }
      });

      // Determine which students to assign to
      const targetStudentIds = validatedData.studentIds ||
                              classData.enrollments.map(e => e.studentId);

      // Create individual submissions for each student
      const submissions = await Promise.all(
        targetStudentIds.map(studentId =>
          tx.submission.create({
            data: {
              assignmentId: assignment.id,
              studentId: studentId,
              status: 'DRAFT',
            },
            select: {
              id: true,
              studentId: true,
              status: true,
            }
          })
        )
      );

      // Create notifications for students (simplified)
      await Promise.all(
        targetStudentIds.map(studentId =>
          tx.notification.create({
            data: {
              userId: studentId,
              type: 'ASSIGNMENT',
              title: `New Reading Assignment: ${book.title}`,
              message: `You have been assigned to read "${book.title}" for ${classData.name}. Due: ${dueDate.toLocaleDateString()}`,
              data: {
                assignmentId: assignment.id,
                bookId: book.id,
                classId: classData.id,
                dueDate: dueDate.toISOString(),
              }
            }
          })
        )
      );

      return {
        assignment,
        submissions,
        studentsAssigned: targetStudentIds.length,
      };
    });

    return NextResponse.json({
      message: 'Book assigned successfully',
      assignment: result.assignment,
      book: {
        id: book.id,
        title: book.title,
      },
      class: {
        id: classData.id,
        name: classData.name,
      },
      studentsAssigned: result.studentsAssigned,
      submissions: result.submissions.length,
    }, { status: 201 });

  } catch (error) {
    logger.error('Error assigning book to class', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/books/assign - Get assignment history for teacher
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const bookId = searchParams.get('bookId');

    // Build where clause for assignments
    const where: any = {};

    if (session.user.role === UserRole.TEACHER) {
      // Teachers can only see assignments for their classes
      where.class = { teacherId: session.user.id };
    }

    if (classId) {
      where.classId = classId;
    }

    if (bookId) {
      where.resources = { has: bookId };
    }

    // Get assignments with related data
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        dueDate: true,
        points: true,
        resources: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            grade: true,
            student: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    // Collect all unique book IDs across assignments
    const allBookIds = [...new Set(
      assignments.flatMap(a => a.resources.filter(r => r.length > 0))
    )];

    // Single batch query for all books
    const allBooks = allBookIds.length > 0
      ? await prisma.book.findMany({
          where: { id: { in: allBookIds } },
          select: {
            id: true,
            title: true,
            authorName: true,
            coverImage: true,
          }
        })
      : [];

    const bookMap = new Map(allBooks.map(b => [b.id, b]));

    // Enhance assignments with book information (no more N+1)
    const enhancedAssignments = assignments.map((assignment) => {
      const bookIds = assignment.resources.filter(r => r.length > 0);
      const books = bookIds
        .map(id => bookMap.get(id))
        .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);

      const totalSubmissions = assignment.submissions.length;
      const submittedCount = assignment.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED').length;
      const gradedCount = assignment.submissions.filter(s => s.status === 'GRADED').length;

      return {
        ...assignment,
        books,
        stats: {
          totalStudents: totalSubmissions,
          submitted: submittedCount,
          graded: gradedCount,
          pending: totalSubmissions - submittedCount,
        }
      };
    });

    return NextResponse.json({
      assignments: enhancedAssignments
    });

  } catch (error) {
    logger.error('Error fetching book assignments', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}