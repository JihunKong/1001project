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

    const assignments = await prisma.$queryRaw`
      SELECT
        ba.id,
        ba."bookId",
        ba."classId",
        ba."assignedAt",
        ba."dueDate",
        ba.instructions,
        ba."isRequired",
        ba.points,
        b.title as "bookTitle",
        b."authorName",
        b."coverImage",
        b.summary,
        b."ageRange",
        b.language,
        c.name as "className",
        c.subject,
        c."gradeLevel",
        COUNT(CASE WHEN rp."isCompleted" = true THEN 1 END) as "completedCount",
        COUNT(ce.id) as "totalStudents"
      FROM "BookAssignment" ba
      JOIN "Book" b ON ba."bookId" = b.id
      JOIN "Class" c ON ba."classId" = c.id
      LEFT JOIN "ClassEnrollment" ce ON c.id = ce."classId" AND ce.status = 'ACTIVE'
      LEFT JOIN "ReadingProgress" rp ON b.id = rp."bookId" AND rp."userId" = ce."studentId"
      WHERE (${classId ? `ba."classId" = '${classId}'` : '1=1'})
        AND ba."classId" = ANY(${where.classId?.in || [where.classId] || ['']})
      GROUP BY ba.id, b.id, c.id
      ORDER BY ba."assignedAt" DESC
    `;

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