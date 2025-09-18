import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, PublishingWorkflowStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const saveDraftSchema = z.object({
  id: z.string().optional(), // If provided, update existing draft; otherwise create new
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  contentMd: z.string().min(1, 'Content is required').max(100000, 'Content too long'),
  chaptersJson: z.string().optional(),
  source: z.enum(['individual', 'classroom']).optional(),
  classId: z.string().optional(),
  language: z.string().min(2, 'Language is required').max(5, 'Invalid language code').default('en'),
  ageRange: z.string().max(20).optional(),
  category: z.array(z.string().max(50)).default([]),
  tags: z.array(z.string().max(30)).default([]),
  summary: z.string().max(1000).optional(),
  autoSave: z.boolean().default(false), // Flag to indicate this is an auto-save operation
});

const getDraftsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  source: z.enum(['individual', 'classroom']).optional(),
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

    // Check if user can create/save drafts
    const allowedRoles = [UserRole.LEARNER, UserRole.TEACHER, UserRole.VOLUNTEER];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to save text drafts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = saveDraftSchema.parse(body);

    // Validate classroom submissions
    if (validatedData.source === 'classroom') {
      if (session.user.role !== UserRole.TEACHER) {
        return NextResponse.json(
          { error: 'Only teachers can create classroom drafts' },
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
          { error: 'Class not found or you do not have permission to create drafts for this class' },
          { status: 403 }
        );
      }
    }

    let textSubmission;

    if (validatedData.id) {
      // Update existing draft
      // First check if the user can edit this draft
      const existingDraft = await prisma.textSubmission.findFirst({
        where: {
          id: validatedData.id,
          status: PublishingWorkflowStatus.DRAFT,
          OR: [
            { authorId: session.user.id },
            // Teachers can edit drafts from their classroom
            ...(session.user.role === UserRole.TEACHER ? [{
              source: 'classroom',
              class: {
                teacherId: session.user.id
              }
            }] : [])
          ]
        }
      });

      if (!existingDraft) {
        return NextResponse.json(
          { error: 'Draft not found or you do not have permission to edit it' },
          { status: 404 }
        );
      }

      textSubmission = await prisma.textSubmission.update({
        where: { id: validatedData.id },
        data: {
          title: validatedData.title,
          contentMd: validatedData.contentMd,
          chaptersJson: validatedData.chaptersJson,
          language: validatedData.language,
          ageRange: validatedData.ageRange,
          category: validatedData.category,
          tags: validatedData.tags,
          summary: validatedData.summary,
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

      // Create workflow transition for significant updates (not auto-saves)
      if (!validatedData.autoSave) {
        await prisma.workflowTransition.create({
          data: {
            submissionId: textSubmission.id,
            submissionType: 'TextSubmission',
            fromStatus: 'DRAFT',
            toStatus: 'DRAFT',
            performedById: session.user.id,
            reason: 'Draft updated'
          }
        });
      }

    } else {
      // Create new draft
      textSubmission = await prisma.textSubmission.create({
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
          reason: 'Draft created'
        }
      });
    }

    return NextResponse.json({
      success: true,
      draft: {
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
      },
      message: validatedData.id ? 'Draft updated successfully' : 'Draft saved successfully'
    }, { status: validatedData.id ? 200 : 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving text draft:', error);
    return NextResponse.json(
      { error: 'Failed to save text draft' },
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
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      source: searchParams.get('source'),
    };

    const validatedParams = getDraftsSchema.parse(params);
    const offset = (validatedParams.page - 1) * validatedParams.limit;

    // Build where clause based on user role
    let where: any = {
      status: PublishingWorkflowStatus.DRAFT
    };

    switch (session.user.role) {
      case UserRole.LEARNER:
      case UserRole.VOLUNTEER:
        // Students and volunteers can only see their own drafts
        where.authorId = session.user.id;
        break;

      case UserRole.TEACHER:
        // Teachers can see their own drafts and classroom drafts from their classes
        const teacherClasses = await prisma.class.findMany({
          where: { teacherId: session.user.id, isActive: true },
          select: { id: true }
        });
        const classIds = teacherClasses.map(c => c.id);

        where = {
          ...where,
          OR: [
            { authorId: session.user.id },
            { 
              source: 'classroom',
              classId: { in: classIds }
            }
          ]
        };
        break;

      case UserRole.STORY_MANAGER:
      case UserRole.BOOK_MANAGER:
      case UserRole.CONTENT_ADMIN:
      case UserRole.ADMIN:
        // Managers and admins can see all drafts (but this is less common use case)
        // We might want to restrict this in production
        break;

      default:
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
    }

    // Apply source filter if provided
    if (validatedParams.source) {
      where.source = validatedParams.source;
    }

    // Fetch drafts with pagination
    const [drafts, total] = await Promise.all([
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
          }
        }
      }),
      prisma.textSubmission.count({ where })
    ]);

    // Transform drafts for response
    const transformedDrafts = drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      source: draft.source,
      language: draft.language,
      ageRange: draft.ageRange,
      category: draft.category,
      tags: draft.tags,
      summary: draft.summary,
      wordCount: draft.contentMd.split(/\s+/).length,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
      author: draft.author,
      class: draft.class
    }));

    return NextResponse.json({
      success: true,
      drafts: transformedDrafts,
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

    console.error('Error fetching text drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch text drafts' },
      { status: 500 }
    );
  }
}