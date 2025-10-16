import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, SubmissionStatus, AssignmentType } from '@prisma/client';
import { z } from 'zod';

// Validation schema for assignment submission
const SubmitAssignmentSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  content: z.string()
    .min(10, 'Submission content must be at least 10 characters')
    .max(10000, 'Submission content must be less than 10,000 characters')
    .optional(),
  attachments: z.array(z.string()).optional(),
  submitForGrading: z.boolean().default(false),
});

// GET /api/learner/assignments - Get assignments for learner
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
    const classId = searchParams.get('classId');
    const status = searchParams.get('status'); // 'pending', 'submitted', 'graded', 'overdue'
    const type = searchParams.get('type') as AssignmentType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Get student's active class enrollments
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: session.user.id,
        status: 'ACTIVE',
        ...(classId && { classId }),
      },
      select: {
        classId: true,
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            subject: true,
            teacher: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        assignments: [],
        summary: {
          total: 0,
          pending: 0,
          submitted: 0,
          graded: 0,
          overdue: 0,
        },
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

    const classIds = enrollments.map(e => e.classId);

    // Build where clause for assignments
    const where: any = {
      classId: { in: classIds },
    };

    if (type) {
      where.type = type;
    }

    // Get assignments with student submissions
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        dueDate: true,
        points: true,
        resources: true,
        requirements: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            subject: true,
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
            submittedAt: true,
            content: true,
            attachments: true,
            grade: true,
            feedback: true,
            status: true,
          }
        }
      }
    });

    // Get books associated with assignments
    const bookIds = assignments.flatMap(a => a.resources.filter(r => r.length > 0));
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: {
        id: true,
        title: true,
        authorName: true,
        coverImage: true,
        readingTime: true,
      }
    });

    const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

    // Get reading progress for book assignments
    const readingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: session.user.id,
        bookId: { in: bookIds },
      },
      select: {
        bookId: true,
        percentComplete: true,
        isCompleted: true,
        lastReadAt: true,
      }
    });

    const progressMap = Object.fromEntries(readingProgress.map(p => [p.bookId, p]));

    // Enhance assignments with additional data
    const enhancedAssignments = assignments.map(assignment => {
      const submission = assignment.submissions[0] || null;
      const now = new Date();
      const isOverdue = assignment.dueDate < now && (!submission || submission.status === 'DRAFT');
      const daysUntilDue = Math.ceil((assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get associated books and their progress
      const assignmentBooks = assignment.resources
        .map(id => bookMap[id])
        .filter((book): book is NonNullable<typeof book> => Boolean(book))
        .map(book => ({
          ...book,
          progress: progressMap[book.id] || null,
        }));

      // Determine assignment status
      let assignmentStatus: string;
      if (submission) {
        switch (submission.status) {
          case 'GRADED':
            assignmentStatus = 'graded';
            break;
          case 'SUBMITTED':
            assignmentStatus = 'submitted';
            break;
          default:
            assignmentStatus = isOverdue ? 'overdue' : 'draft';
        }
      } else {
        assignmentStatus = isOverdue ? 'overdue' : 'pending';
      }

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        dueDate: assignment.dueDate,
        points: assignment.points,
        requirements: assignment.requirements,
        createdAt: assignment.createdAt,
        class: assignment.class,
        books: assignmentBooks,
        submission,
        status: assignmentStatus,
        isOverdue,
        daysUntilDue,
        urgency: daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low',
      };
    });

    // Apply status filter
    let filteredAssignments = enhancedAssignments;
    if (status) {
      filteredAssignments = enhancedAssignments.filter(a => a.status === status);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedAssignments = filteredAssignments.slice(skip, skip + limit);

    // Calculate summary statistics
    const summaryStats = {
      total: enhancedAssignments.length,
      pending: enhancedAssignments.filter(a => a.status === 'pending').length,
      submitted: enhancedAssignments.filter(a => a.status === 'submitted').length,
      graded: enhancedAssignments.filter(a => a.status === 'graded').length,
      overdue: enhancedAssignments.filter(a => a.status === 'overdue').length,
      draft: enhancedAssignments.filter(a => a.status === 'draft').length,
    };

    // Calculate pagination info
    const totalCount = filteredAssignments.length;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      assignments: paginatedAssignments,
      classes: enrollments.map(e => e.class),
      summary: summaryStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching learner assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/learner/assignments - Submit or update assignment
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
      validatedData = SubmitAssignmentSchema.parse(body);
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

    // Verify assignment exists and student has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: validatedData.assignmentId },
      select: {
        id: true,
        title: true,
        type: true,
        dueDate: true,
        points: true,
        classId: true,
        class: {
          select: {
            name: true,
            enrollments: {
              where: {
                studentId: session.user.id,
                status: 'ACTIVE',
              },
              select: { id: true }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.class.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'You are not enrolled in this class' },
        { status: 403 }
      );
    }

    // Check if assignment is overdue (allow late submissions but mark them)
    const isLate = assignment.dueDate < new Date();

    // Get or create submission
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: validatedData.assignmentId,
          studentId: session.user.id,
        }
      }
    });

    if (existingSubmission && existingSubmission.status === 'GRADED') {
      return NextResponse.json(
        { error: 'Cannot modify a graded submission' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newStatus: SubmissionStatus = validatedData.submitForGrading
      ? (isLate ? 'LATE' : 'SUBMITTED')
      : 'DRAFT';

    let result;

    if (existingSubmission) {
      // Update existing submission
      result = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content: validatedData.content || null,
          attachments: validatedData.attachments || [],
          status: newStatus,
          ...(validatedData.submitForGrading && { submittedAt: now }),
        },
        select: {
          id: true,
          content: true,
          attachments: true,
          status: true,
          submittedAt: true,
          assignment: {
            select: {
              id: true,
              title: true,
              type: true,
              dueDate: true,
              class: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      });
    } else {
      // Create new submission
      result = await prisma.submission.create({
        data: {
          assignmentId: validatedData.assignmentId,
          studentId: session.user.id,
          content: validatedData.content || null,
          attachments: validatedData.attachments || [],
          status: newStatus,
          ...(validatedData.submitForGrading && { submittedAt: now }),
        },
        select: {
          id: true,
          content: true,
          attachments: true,
          status: true,
          submittedAt: true,
          assignment: {
            select: {
              id: true,
              title: true,
              type: true,
              dueDate: true,
              class: {
                select: {
                  name: true,
                  teacher: {
                    select: {
                      id: true,
                      name: true,
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Create notification for teacher if submitted
      if (validatedData.submitForGrading) {
        await prisma.notification.create({
          data: {
            userId: result.assignment.class.teacher.id,
            type: 'ASSIGNMENT',
            title: isLate ? 'Late Assignment Submitted' : 'Assignment Submitted',
            message: `${session.user.name || session.user.email} has submitted "${result.assignment.title}" for ${result.assignment.class.name}${isLate ? ' (late submission)' : ''}`,
            data: {
              assignmentId: result.assignment.id,
              submissionId: result.id,
              studentId: session.user.id,
              isLate,
            }
          }
        });
      }
    }

    const message = validatedData.submitForGrading
      ? (isLate ? 'Assignment submitted successfully (marked as late)' : 'Assignment submitted successfully')
      : 'Assignment draft saved successfully';

    return NextResponse.json({
      message,
      submission: result,
      isLate: validatedData.submitForGrading ? isLate : undefined,
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}