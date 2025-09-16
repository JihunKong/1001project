import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkflowManager } from '@/lib/publishing/workflow-manager';
import { StatusTransitions } from '@/lib/publishing/status-transitions';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const transitionSchema = z.object({
  targetStatus: z.string(),
  reason: z.string().optional(),
  templateId: z.string().optional(),
  deadline: z.string().optional(),
  idempotencyKey: z.string().optional(),
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
    const validatedData = transitionSchema.parse(body);

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        bookSubmission: true
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const currentStatus = book.bookSubmission?.status || 'DRAFT';
    const workflowMode = book.publishingMode || process.env.PUBLISHING_MODE || 'STANDARD';

    const canTransition = StatusTransitions.canTransition(
      user.role as UserRole,
      currentStatus,
      validatedData.targetStatus,
      workflowMode
    );

    if (!canTransition) {
      return NextResponse.json({
        error: 'Invalid status transition',
        details: {
          currentStatus,
          targetStatus: validatedData.targetStatus,
          role: user.role,
          mode: workflowMode
        }
      }, { status: 400 });
    }

    const invariantErrors = StatusTransitions.validateInvariants(
      validatedData.targetStatus,
      book
    );

    if (invariantErrors.length > 0) {
      return NextResponse.json({
        error: 'Invariant validation failed',
        details: invariantErrors
      }, { status: 400 });
    }

    if (validatedData.idempotencyKey) {
      const recentTransition = await prisma.auditEvent.findFirst({
        where: {
          bookId: params.id,
          actorId: user.id,
          metadata: {
            path: ['idempotencyKey'],
            equals: validatedData.idempotencyKey
          },
          createdAt: {
            gte: new Date(Date.now() - 5000) 
          }
        }
      });

      if (recentTransition) {
        return NextResponse.json({
          ok: true,
          book: { id: params.id, status: validatedData.targetStatus },
          auditId: recentTransition.id,
          message: 'Duplicate transition prevented'
        });
      }
    }

    const result = await WorkflowManager.transition({
      bookId: params.id,
      targetStatus: validatedData.targetStatus,
      actorId: user.id,
      actorRole: user.role as UserRole,
      reason: validatedData.reason,
      templateId: validatedData.templateId,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
      idempotencyKey: validatedData.idempotencyKey
    });

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        details: result.details
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      book: result.book,
      auditId: result.auditId,
      message: `Successfully transitioned to ${validatedData.targetStatus}`
    });

  } catch (error) {
    console.error('Status transition error:', error);
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
        bookSubmission: true
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const currentStatus = book.bookSubmission?.status || 'DRAFT';
    const workflowMode = book.publishingMode || process.env.PUBLISHING_MODE || 'STANDARD';

    const nextStatuses = StatusTransitions.getNextStatuses(
      user.role as UserRole,
      currentStatus,
      workflowMode
    );

    const recentTransitions = await prisma.auditEvent.findMany({
      where: {
        bookId: params.id,
        eventType: 'STATUS_CHANGE'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      currentStatus,
      workflowMode,
      availableTransitions: nextStatuses,
      recentTransitions,
      userRole: user.role
    });

  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}