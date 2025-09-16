import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, PublishingWorkflowStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const createTextSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  contentMd: z.string().min(10, 'Content must be at least 10 characters').max(100000, 'Content too long'),
  chaptersJson: z.string().optional(),
  source: z.enum(['individual', 'classroom']).optional(),
  classId: z.string().optional(),
  language: z.string().min(2, 'Language is required').max(5, 'Invalid language code').default('en'),
  ageRange: z.string().max(20).optional(),
  category: z.array(z.string().max(50)).default([]),
  tags: z.array(z.string().max(30)).default([]),
  summary: z.string().max(1000).optional(),
});

const listSubmissionsSchema = z.object({
  status: z.nativeEnum(PublishingWorkflowStatus).optional(),
  source: z.enum(['individual', 'classroom']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  authorId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can create text submissions
    const allowedRoles = [UserRole.LEARNER, UserRole.TEACHER, UserRole.VOLUNTEER];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create text submissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTextSubmissionSchema.parse(body);

    // Validate classroom submissions
    if (validatedData.source === 'classroom') {
      if (session.user.role !== UserRole.TEACHER) {
        return NextResponse.json(
          { error: 'Only teachers can create classroom submissions' },
          { status: 403 }
        );
      }
      
      if (!validatedData.classId) {
        return NextResponse.json(
          { error: 'Class ID required for classroom submissions' },
          { status: 400 }
        );
      }

      // Verify teacher owns the class
      const classOwnership = await prisma.class.findFirst({
        where: {
          id: validatedData.classId,
          teacherId: session.user.id,
          isActive: true
        }
      });

      if (!classOwnership) {
        return NextResponse.json(
          { error: 'Class not found or you do not have permission to submit for this class' },
          { status: 403 }
        );
      }
    }

    // Create the text submission
    const textSubmission = await prisma.textSubmission.create({
      data: {
        authorId: session.user.id,
        authorRole: session.user.role as UserRole,
        title: validatedData.title,
        contentMd: validatedData.contentMd,
        chaptersJson: validatedData.chaptersJson,
        source: validatedData.source || 'individual',
        classId: validatedData.classId,
        language: validatedData.language,
        ageRange: validatedData.ageRange,
        category: validatedData.category,
        tags: validatedData.tags,
        summary: validatedData.summary,
        status: PublishingWorkflowStatus.DRAFT,
        revisionNo: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create initial workflow transition
    await prisma.workflowTransition.create({
      data: {
        submissionId: textSubmission.id,
        submissionType: 'TextSubmission',
        fromStatus: 'DRAFT',
        toStatus: 'DRAFT',
        performedById: session.user.id,
        reason: 'Initial submission created'
      }
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: textSubmission.id,
        title: textSubmission.title,
        status: textSubmission.status,
        source: textSubmission.source,
        language: textSubmission.language,
        ageRange: textSubmission.ageRange,
        category: textSubmission.category,
        tags: textSubmission.tags,
        summary: textSubmission.summary,
        revisionNo: textSubmission.revisionNo,
        createdAt: textSubmission.createdAt.toISOString(),
        updatedAt: textSubmission.updatedAt.toISOString(),
        author: textSubmission.author,
        class: textSubmission.class
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating text submission:', error);
    return NextResponse.json(
      { error: 'Failed to create text submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = {
      status: searchParams.get('status'),
      source: searchParams.get('source'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      authorId: searchParams.get('authorId'),
    };

    const validatedParams = listSubmissionsSchema.parse(params);
    const offset = (validatedParams.page - 1) * validatedParams.limit;

    // Build where clause based on user role and permissions
    let where: any = {};

    // Role-based filtering
    switch (session.user.role) {
      case UserRole.LEARNER:
        // Students can only see their own submissions
        where.authorId = session.user.id;
        break;

      case UserRole.TEACHER:
        // Teachers can see their own submissions and classroom submissions from their classes
        const teacherClasses = await prisma.class.findMany({
          where: { teacherId: session.user.id, isActive: true },
          select: { id: true }
        });
        const classIds = teacherClasses.map(c => c.id);

        where = {
          OR: [
            { authorId: session.user.id },
            { 
              source: 'classroom',
              classId: { in: classIds }
            }
          ]
        };
        break;

      case UserRole.VOLUNTEER:
        // Volunteers can only see their own submissions
        where.authorId = session.user.id;
        break;

      case UserRole.STORY_MANAGER:
      case UserRole.BOOK_MANAGER:
      case UserRole.CONTENT_ADMIN:
      case UserRole.ADMIN:
        // Managers and admins can see all submissions
        if (validatedParams.authorId) {
          where.authorId = validatedParams.authorId;
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
    }

    // Apply additional filters
    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.source) {
      where.source = validatedParams.source;
    }

    // Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.textSubmission.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: validatedParams.limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          },
          transitions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              performedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          },
          _count: {
            select: {
              transitions: true
            }
          }
        }
      }),
      prisma.textSubmission.count({ where })
    ]);

    // Transform submissions for response
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      title: submission.title,
      status: submission.status,
      source: submission.source,
      language: submission.language,
      ageRange: submission.ageRange,
      category: submission.category,
      tags: submission.tags,
      summary: submission.summary,
      revisionNo: submission.revisionNo,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      author: submission.author,
      class: submission.class,
      lastTransition: submission.transitions[0] || null,
      transitionCount: submission._count.transitions
    }));

    return NextResponse.json({
      success: true,
      submissions: transformedSubmissions,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        totalPages: Math.ceil(total / validatedParams.limit)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching text submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch text submissions' },
      { status: 500 }
    );
  }
}