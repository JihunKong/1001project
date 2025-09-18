import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkflowManager } from '@/lib/publishing/workflow-manager';
import { NotificationService } from '@/lib/publishing/notification-service';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const reviewSchema = z.object({
  visibility: z.enum(['public', 'internal']),
  templateId: z.string().optional(),
  customMessage: z.string().optional(),
  requiresRevision: z.boolean().default(false),
  deadline: z.string().optional(),
  categories: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
  metadata: z.record(z.any()).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowedRoles: UserRole[] = [
      'STORY_MANAGER',
      'BOOK_MANAGER',
      'CONTENT_ADMIN',
      'ADMIN'
    ];

    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    if (validatedData.requiresRevision && !validatedData.customMessage && !validatedData.templateId) {
      return NextResponse.json({
        error: 'Validation error',
        details: 'Either customMessage or templateId is required when requiresRevision is true'
      }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        bookSubmission: {
          include: {
            submittedBy: true
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    let feedbackMessage = validatedData.customMessage || '';

    if (validatedData.templateId) {
      const template = await prisma.rejectionTemplate.findUnique({
        where: { id: validatedData.templateId }
      });

      if (template) {
        feedbackMessage = template.message;
        
        await prisma.rejectionTemplate.update({
          where: { id: validatedData.templateId },
          data: { usageCount: { increment: 1 } }
        });
      }
    }

    const feedback = await prisma.submissionFeedback.create({
      data: {
        bookSubmissionId: book.bookSubmission?.id || '',
        reviewerId: user.id,
        visibility: validatedData.visibility,
        templateId: validatedData.templateId,
        customMessage: validatedData.customMessage,
        feedbackType: validatedData.requiresRevision ? 'REVISION_REQUEST' : 'COMMENT',
        rating: validatedData.rating,
        categories: validatedData.categories || [],
        metadata: validatedData.metadata || {},
        requiresRevision: validatedData.requiresRevision,
        revisionDeadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined
      }
    });

    await prisma.auditEvent.create({
      data: {
        eventType: 'REVIEW_FEEDBACK',
        bookId: params.id,
        actorId: user.id,
        action: validatedData.requiresRevision ? 'REQUEST_REVISION' : 'ADD_FEEDBACK',
        reason: feedbackMessage,
        templateId: validatedData.templateId,
        metadata: {
          feedbackId: feedback.id,
          visibility: validatedData.visibility,
          rating: validatedData.rating,
          categories: validatedData.categories
        }
      }
    });

    if (validatedData.requiresRevision) {
      const transitionResult = await WorkflowManager.transition({
        bookId: params.id,
        targetStatus: 'NEEDS_REVISION',
        actorId: user.id,
        actorRole: user.role as UserRole,
        reason: feedbackMessage,
        templateId: validatedData.templateId,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined
      });

      if (!transitionResult.success) {
        return NextResponse.json({
          error: 'Failed to transition to NEEDS_REVISION',
          details: transitionResult.error
        }, { status: 400 });
      }
    }

    if (book.bookSubmission?.submittedBy) {
      await NotificationService.sendReviewNotification({
        recipientId: book.bookSubmission.submittedBy.id,
        bookId: params.id,
        bookTitle: book.title,
        reviewerName: user.name || user.email,
        requiresRevision: validatedData.requiresRevision,
        feedback: feedbackMessage,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined
      });
    }

    return NextResponse.json({
      ok: true,
      feedback: {
        id: feedback.id,
        message: feedbackMessage,
        requiresRevision: validatedData.requiresRevision
      },
      message: validatedData.requiresRevision 
        ? 'Revision requested successfully' 
        : 'Feedback added successfully'
    });

  } catch (error) {
    console.error('Review feedback error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        bookSubmission: {
          include: {
            feedback: {
              include: {
                reviewer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                },
                template: true
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const canViewInternal = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN']
      .includes(user.role as UserRole);

    const feedback = book.bookSubmission?.feedback?.filter(f => 
      f.visibility === 'public' || 
      (f.visibility === 'internal' && canViewInternal) ||
      f.reviewerId === user.id
    ) || [];

    const templates = await prisma.rejectionTemplate.findMany({
      where: {
        isActive: true,
        applicableRoles: {
          has: user.role
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      feedback,
      templates,
      stats: {
        totalFeedback: feedback.length,
        revisionRequests: feedback.filter(f => f.requiresRevision).length,
        averageRating: feedback.length > 0 
          ? feedback.reduce((acc, f) => acc + (f.rating || 0), 0) / feedback.filter(f => f.rating).length
          : null
      }
    });

  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}