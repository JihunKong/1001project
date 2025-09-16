import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkflowManager } from '@/lib/publishing/workflow-manager';
import { StatusTransitions } from '@/lib/publishing/status-transitions';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const bulkOperationSchema = z.object({
  bookIds: z.array(z.string()).min(1).max(100),
  operation: z.enum(['transition', 'assign', 'archive', 'delete']),
  targetStatus: z.string().optional(),
  assigneeId: z.string().optional(),
  reason: z.string().optional(),
  dryRun: z.boolean().default(false),
  skipInvalid: z.boolean().default(true)
});

interface BulkOperationResult {
  bookId: string;
  success: boolean;
  error?: string;
  details?: any;
}

export async function POST(request: NextRequest) {
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
    const validatedData = bulkOperationSchema.parse(body);

    const books = await prisma.book.findMany({
      where: {
        id: { in: validatedData.bookIds }
      },
      include: {
        bookSubmission: true
      }
    });

    if (books.length === 0) {
      return NextResponse.json({ error: 'No books found' }, { status: 404 });
    }

    const results: BulkOperationResult[] = [];
    const workflowMode = process.env.PUBLISHING_MODE || 'STANDARD';

    if (validatedData.operation === 'transition' && validatedData.targetStatus) {
      for (const book of books) {
        const bookId = book.id;
        const currentStatus = book.bookSubmission?.status || 'DRAFT';
        
        const canTransition = StatusTransitions.canTransition(
          user.role as UserRole,
          currentStatus,
          validatedData.targetStatus,
          book.publishingMode || workflowMode
        );

        if (!canTransition) {
          if (validatedData.skipInvalid) {
            results.push({
              bookId,
              success: false,
              error: 'Invalid transition',
              details: { currentStatus, targetStatus: validatedData.targetStatus }
            });
            continue;
          } else {
            return NextResponse.json({
              error: `Invalid transition for book ${bookId}`,
              details: { currentStatus, targetStatus: validatedData.targetStatus }
            }, { status: 400 });
          }
        }

        const invariantErrors = StatusTransitions.validateInvariants(
          validatedData.targetStatus,
          book
        );

        if (invariantErrors.length > 0) {
          if (validatedData.skipInvalid) {
            results.push({
              bookId,
              success: false,
              error: 'Invariant validation failed',
              details: invariantErrors
            });
            continue;
          } else {
            return NextResponse.json({
              error: `Invariant validation failed for book ${bookId}`,
              details: invariantErrors
            }, { status: 400 });
          }
        }

        if (validatedData.dryRun) {
          results.push({
            bookId,
            success: true,
            details: {
              wouldTransition: true,
              from: currentStatus,
              to: validatedData.targetStatus
            }
          });
        } else {
          const transitionResult = await WorkflowManager.transition({
            bookId,
            targetStatus: validatedData.targetStatus,
            actorId: user.id,
            actorRole: user.role as UserRole,
            reason: validatedData.reason || `Bulk operation: ${validatedData.operation}`
          });

          results.push({
            bookId,
            success: transitionResult.success,
            error: transitionResult.error,
            details: transitionResult.details
          });
        }
      }
    } else if (validatedData.operation === 'assign' && validatedData.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assigneeId }
      });

      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
      }

      const allowedAssigneeRoles: UserRole[] = [
        'STORY_MANAGER',
        'BOOK_MANAGER',
        'CONTENT_ADMIN',
        'ADMIN'
      ];

      if (!allowedAssigneeRoles.includes(assignee.role as UserRole)) {
        return NextResponse.json({
          error: 'Invalid assignee role',
          details: `User with role ${assignee.role} cannot be assigned as reviewer`
        }, { status: 400 });
      }

      for (const book of books) {
        if (validatedData.dryRun) {
          results.push({
            bookId: book.id,
            success: true,
            details: {
              wouldAssign: true,
              assigneeId: validatedData.assigneeId,
              assigneeName: assignee.name || assignee.email
            }
          });
        } else {
          try {
            await prisma.bookSubmission.update({
              where: { id: book.bookSubmission?.id },
              data: {
                reviewerId: validatedData.assigneeId,
                assignedAt: new Date()
              }
            });

            await prisma.auditEvent.create({
              data: {
                eventType: 'REVIEWER_ASSIGNED',
                bookId: book.id,
                actorId: user.id,
                action: 'ASSIGN_REVIEWER',
                metadata: {
                  assigneeId: validatedData.assigneeId,
                  assigneeName: assignee.name || assignee.email,
                  bulkOperation: true
                }
              }
            });

            results.push({
              bookId: book.id,
              success: true,
              details: {
                assigneeId: validatedData.assigneeId,
                assigneeName: assignee.name || assignee.email
              }
            });
          } catch (error) {
            results.push({
              bookId: book.id,
              success: false,
              error: 'Assignment failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    } else if (validatedData.operation === 'archive') {
      for (const book of books) {
        if (validatedData.dryRun) {
          results.push({
            bookId: book.id,
            success: true,
            details: { wouldArchive: true }
          });
        } else {
          const transitionResult = await WorkflowManager.transition({
            bookId: book.id,
            targetStatus: 'ARCHIVED',
            actorId: user.id,
            actorRole: user.role as UserRole,
            reason: validatedData.reason || 'Bulk archive operation'
          });

          results.push({
            bookId: book.id,
            success: transitionResult.success,
            error: transitionResult.error,
            details: transitionResult.details
          });
        }
      }
    } else if (validatedData.operation === 'delete') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({
          error: 'Only admins can perform bulk delete operations'
        }, { status: 403 });
      }

      for (const book of books) {
        if (validatedData.dryRun) {
          results.push({
            bookId: book.id,
            success: true,
            details: { wouldDelete: true }
          });
        } else {
          try {
            await prisma.book.delete({
              where: { id: book.id }
            });

            await prisma.auditEvent.create({
              data: {
                eventType: 'BOOK_DELETED',
                bookId: book.id,
                actorId: user.id,
                action: 'DELETE',
                reason: validatedData.reason || 'Bulk delete operation',
                metadata: {
                  bulkOperation: true,
                  bookTitle: book.title
                }
              }
            });

            results.push({
              bookId: book.id,
              success: true,
              details: { deleted: true }
            });
          } catch (error) {
            results.push({
              bookId: book.id,
              success: false,
              error: 'Deletion failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    } else {
      return NextResponse.json({
        error: 'Invalid operation or missing required parameters'
      }, { status: 400 });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    await prisma.auditEvent.create({
      data: {
        eventType: 'BULK_OPERATION',
        actorId: user.id,
        action: validatedData.operation.toUpperCase(),
        metadata: {
          operation: validatedData.operation,
          targetStatus: validatedData.targetStatus,
          assigneeId: validatedData.assigneeId,
          dryRun: validatedData.dryRun,
          totalBooks: results.length,
          successCount,
          failureCount,
          bookIds: validatedData.bookIds
        }
      }
    });

    return NextResponse.json({
      ok: true,
      dryRun: validatedData.dryRun,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount
      },
      results,
      message: validatedData.dryRun 
        ? `Dry run completed: ${successCount} would succeed, ${failureCount} would fail`
        : `Bulk operation completed: ${successCount} succeeded, ${failureCount} failed`
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
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