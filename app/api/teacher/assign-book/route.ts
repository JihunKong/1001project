import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, AssignmentType } from '@prisma/client';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Validation schema for book assignment
const AssignBookSchema = z.object({
  bookId: z.string()
    .min(1, 'Book ID is required'),
  classId: z.string()
    .min(1, 'Class ID is required'),
  title: z.string()
    .min(1, 'Assignment title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(1, 'Assignment description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  dueDate: z.string()
    .datetime('Invalid due date format'),
  points: z.number()
    .min(0, 'Points must be non-negative')
    .max(1000, 'Points cannot exceed 1000')
    .default(100),
  isRequired: z.boolean()
    .default(true)
});

// POST /api/teacher/assign-book - Create book assignment for class
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.CONTENT_CREATION);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.CONTENT_CREATION.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can assign books
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json({
        error: 'Only teachers can assign books to classes'
      }, { status: 403 });
    }

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
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Verify teacher owns the class
    const teacherClass = await prisma.class.findFirst({
      where: {
        id: validatedData.classId,
        teacherId: session.user.id
      },
      select: {
        id: true,
        name: true,
        subject: true,
        gradeLevel: true
      }
    });

    if (!teacherClass) {
      return NextResponse.json({
        error: 'You can only assign books to your own classes'
      }, { status: 403 });
    }

    // Verify book exists and is suitable for assignment
    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId },
      select: {
        id: true,
        title: true,
        authorName: true,
        visibility: true,
        isPublished: true,
        ageRange: true,
        language: true,
        summary: true,
        readingLevel: true
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.isPublished) {
      return NextResponse.json({
        error: 'Only published books can be assigned to classes'
      }, { status: 400 });
    }

    // Check if book is already assigned to this class
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        classId: validatedData.classId,
        resources: {
          has: `book:${validatedData.bookId}`
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        error: 'This book is already assigned to the class',
        existingAssignment: {
          id: existingAssignment.id,
          title: existingAssignment.title,
          dueDate: existingAssignment.dueDate
        }
      }, { status: 409 });
    }

    // Create assignment with book reference
    const assignment = await prisma.assignment.create({
      data: {
        classId: validatedData.classId,
        title: validatedData.title,
        description: validatedData.description,
        type: AssignmentType.READING,
        dueDate: new Date(validatedData.dueDate),
        points: validatedData.points,
        resources: [`book:${validatedData.bookId}`], // Store book reference
        requirements: {
          bookId: validatedData.bookId,
          bookTitle: book.title,
          isRequired: validatedData.isRequired,
          readingObjectives: [
            'Complete reading of the assigned book',
            'Understanding of key themes and concepts'
          ]
        }
      },
      include: {
        class: {
          select: {
            name: true,
            subject: true,
            gradeLevel: true
          }
        }
      }
    });

    // Update book visibility to CLASSROOM if it's currently PUBLIC
    if (book.visibility === 'PUBLIC') {
      await prisma.book.update({
        where: { id: validatedData.bookId },
        data: { visibility: 'CLASSROOM' }
      });
    }

    // Create response with rate limit headers
    const response = NextResponse.json({
      message: 'Book assigned to class successfully',
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        points: assignment.points,
        book: {
          id: book.id,
          title: book.title,
          authorName: book.authorName,
          ageRange: book.ageRange,
          readingLevel: book.readingLevel
        },
        class: assignment.class
      }
    }, { status: 201 });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.CONTENT_CREATION.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return response;

  } catch (error) {
    console.error('Error assigning book to class:', error);
    return NextResponse.json(
      {
        error: 'Internal server error while assigning book',
        details: 'Please try again later or contact support if the problem persists'
      },
      { status: 500 }
    );
  }
}

// GET /api/teacher/assign-book - List teacher's class assignments
export async function GET(request: NextRequest) {
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

    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Only teachers can view class assignments' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Get teacher's classes and their reading assignments
    const where: any = {
      class: { teacherId: session.user.id },
      type: AssignmentType.READING,
      resources: { not: { equals: [] } } // Has resources (books)
    };

    if (classId) {
      where.classId = classId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            gradeLevel: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              select: { id: true }
            }
          }
        },
        submissions: {
          select: {
            id: true,
            status: true,
            grade: true,
            submittedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich assignments with book details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const bookIds = assignment.resources
          .filter(resource => typeof resource === 'string' && resource.startsWith('book:'))
          .map(resource => resource.replace('book:', ''));

        let books: any[] = [];
        if (bookIds.length > 0) {
          books = await prisma.book.findMany({
            where: { id: { in: bookIds } },
            select: {
              id: true,
              title: true,
              authorName: true,
              coverImage: true,
              ageRange: true,
              readingLevel: true,
              summary: true
            }
          });
        }

        return {
          ...assignment,
          books,
          stats: {
            totalStudents: assignment.class.enrollments.length,
            submittedCount: assignment.submissions.length,
            completionRate: assignment.class.enrollments.length > 0
              ? Math.round((assignment.submissions.length / assignment.class.enrollments.length) * 100)
              : 0
          }
        };
      })
    );

    const response = NextResponse.json({ assignments: enrichedAssignments });
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.GENERAL_API.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;

  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}