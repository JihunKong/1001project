import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Validation schema for book assignment creation
const CreateBookAssignmentSchema = z.object({
  bookId: z.string()
    .min(1, 'Book ID is required'),
  classId: z.string()
    .min(1, 'Class ID is required'),
  dueDate: z.string()
    .datetime('Invalid due date format')
    .optional(),
  instructions: z.string()
    .max(1000, 'Instructions must be less than 1000 characters')
    .optional(),
  isRequired: z.boolean()
    .default(false),
  points: z.number()
    .min(0, 'Points must be non-negative')
    .max(1000, 'Points cannot exceed 1000')
    .optional()
});

// GET /api/book-assignments - List book assignments
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.GENERAL_API);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Build query based on user role
    const where: any = {};

    switch (session.user.role) {
      case UserRole.TEACHER:
        // Teachers can see assignments for their classes
        const teacherClasses = await prisma.class.findMany({
          where: { teacherId: session.user.id },
          select: { id: true }
        });
        const teacherClassIds = teacherClasses.map(c => c.id);

        where.classId = { in: teacherClassIds };
        if (classId) {
          where.classId = classId;
        }
        break;

      case UserRole.LEARNER:
        // Students can only see assignments for classes they're enrolled in
        const studentEnrollments = await prisma.classEnrollment.findMany({
          where: {
            studentId: session.user.id,
            status: 'ACTIVE'
          },
          select: { classId: true }
        });
        const enrolledClassIds = studentEnrollments.map(e => e.classId);

        where.classId = { in: enrolledClassIds };
        break;

      case UserRole.ADMIN:
      case UserRole.CONTENT_ADMIN:
        // Admins can see all assignments
        if (classId) {
          where.classId = classId;
        }
        break;

      default:
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the list of allowed class IDs
    let allowedClassIds: string[] = [];
    if (where.classId?.in) {
      allowedClassIds = where.classId.in;
    } else if (typeof where.classId === 'string') {
      allowedClassIds = [where.classId];
    }

    // If no classes allowed (e.g., student not enrolled anywhere), return empty
    if (allowedClassIds.length === 0 && session.user.role === UserRole.LEARNER) {
      return NextResponse.json({ assignments: [] });
    }

    // Use Prisma ORM for type-safe querying
    const bookAssignments = await prisma.bookAssignment.findMany({
      where: allowedClassIds.length > 0 ? {
        classId: { in: allowedClassIds }
      } : {},
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authorName: true,
            coverImage: true,
            summary: true,
            ageRange: true,
            language: true,
            contentType: true,
            pdfKey: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            gradeLevel: true,
            _count: {
              select: {
                enrollments: {
                  where: { status: 'ACTIVE' }
                }
              }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Transform data for frontend
    const assignments = bookAssignments.map(ba => ({
      id: ba.id,
      bookId: ba.bookId,
      classId: ba.classId,
      assignedAt: ba.assignedAt,
      dueDate: ba.dueDate,
      instructions: ba.instructions,
      isRequired: ba.isRequired,
      points: ba.points,
      bookTitle: ba.book.title,
      authorName: ba.book.authorName,
      coverImage: ba.book.coverImage,
      summary: ba.book.summary,
      ageRange: ba.book.ageRange,
      language: ba.book.language,
      contentType: ba.book.contentType,
      pdfKey: ba.book.pdfKey,
      className: ba.class.name,
      subject: ba.class.subject,
      gradeLevel: ba.class.gradeLevel,
      totalStudents: ba.class._count.enrollments
    }));

    const response = NextResponse.json({ assignments });
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.GENERAL_API.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;

  } catch (error) {
    logger.error('Error fetching book assignments', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/book-assignments - Create book assignment
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.CONTENT_CREATION);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can create book assignments
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Only teachers can assign books' }, { status: 403 });
    }

    const body = await request.json();
    let validatedData;

    try {
      validatedData = CreateBookAssignmentSchema.parse(body);
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
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Verify teacher owns the class
    if (session.user.role === UserRole.TEACHER) {
      const classOwnership = await prisma.class.findFirst({
        where: {
          id: validatedData.classId,
          teacherId: session.user.id
        }
      });

      if (!classOwnership) {
        return NextResponse.json({ error: 'You can only assign books to your own classes' }, { status: 403 });
      }
    }

    // Verify book exists and is suitable for classroom use
    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId },
      select: {
        id: true,
        title: true,
        visibility: true,
        isPublished: true,
        ageRange: true,
        language: true
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.isPublished) {
      return NextResponse.json({ error: 'Only published books can be assigned' }, { status: 400 });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.$queryRaw`
      SELECT id FROM "BookAssignment"
      WHERE "bookId" = ${validatedData.bookId} AND "classId" = ${validatedData.classId}
      LIMIT 1
    `;

    if (Array.isArray(existingAssignment) && existingAssignment.length > 0) {
      return NextResponse.json({ error: 'Book is already assigned to this class' }, { status: 409 });
    }

    // Create book assignment
    const assignment = await prisma.$queryRaw`
      INSERT INTO "BookAssignment" ("id", "bookId", "classId", "assignedAt", "dueDate", "instructions", "isRequired", "points")
      VALUES (gen_random_uuid(), ${validatedData.bookId}, ${validatedData.classId}, NOW(),
              ${validatedData.dueDate || null}, ${validatedData.instructions || null},
              ${validatedData.isRequired}, ${validatedData.points || null})
      RETURNING *
    `;

    return NextResponse.json({
      message: 'Book assigned successfully',
      assignment: Array.isArray(assignment) ? assignment[0] : assignment
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating book assignment', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/book-assignments/[id] - Remove book assignment
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.GENERAL_API);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: rateLimitResult.error }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers and admins can remove assignments
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // For teachers, verify they own the class
    if (session.user.role === UserRole.TEACHER) {
      const assignment = await prisma.$queryRaw`
        SELECT ba.id
        FROM "BookAssignment" ba
        JOIN "Class" c ON ba."classId" = c.id
        WHERE ba.id = ${assignmentId} AND c."teacherId" = ${session.user.id}
        LIMIT 1
      `;

      if (!Array.isArray(assignment) || assignment.length === 0) {
        return NextResponse.json({ error: 'Assignment not found or no permission' }, { status: 404 });
      }
    }

    // Remove assignment
    await prisma.$queryRaw`
      DELETE FROM "BookAssignment"
      WHERE id = ${assignmentId}
    `;

    return NextResponse.json({ message: 'Assignment removed successfully' });

  } catch (error) {
    logger.error('Error removing book assignment', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}