/**
 * Workflow Manager - Central orchestration for publishing workflow transitions
 * Handles idempotency, optimistic locking, audit events, and SLA monitoring
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { 
  PublishingStatus, 
  TransitionAction, 
  WorkflowMode, 
  validateTransition, 
  checkInvariants,
  TransitionContext 
} from './status-transitions';
import { createAuditEvent, AuditEventType } from './audit-events';
import { NotificationService } from './notification-service';
import { prisma } from '@/lib/prisma';

export interface TransitionRequest {
  bookId: string;
  action: TransitionAction;
  actorId: string;
  actorRole: UserRole;
  reason?: string;
  templateId?: string;
  idempotencyKey?: string;
  expectedVersion?: number;
  metadata?: Record<string, any>;
}

export interface TransitionResult {
  success: boolean;
  newStatus: PublishingStatus;
  version: number;
  errors: string[];
  warnings: string[];
  auditEventId?: string;
  slaAlertTriggered?: boolean;
}

export interface SLAConfiguration {
  reviewDeadlineHours: number; // 48h default
  revisionDeadlineDays: number; // 7d default
  escalationRoles: UserRole[];
  reminderIntervalHours: number;
}

export class WorkflowManager {
  private notificationService: NotificationService;
  private slaConfig: SLAConfiguration;
  private idempotencyCache: Map<string, TransitionResult> = new Map();
  private readonly IDEMPOTENCY_WINDOW_MS = 5000; // 5 seconds

  constructor(
    notificationService: NotificationService,
    slaConfig: SLAConfiguration = {
      reviewDeadlineHours: 48,
      revisionDeadlineDays: 7,
      escalationRoles: [UserRole.CONTENT_ADMIN, UserRole.ADMIN],
      reminderIntervalHours: 24
    }
  ) {
    this.notificationService = notificationService;
    this.slaConfig = slaConfig;
  }

  /**
   * Execute a status transition with full validation and auditing
   */
  async executeTransition(request: TransitionRequest): Promise<TransitionResult> {
    const startTime = Date.now();
    
    try {
      // Check idempotency
      if (request.idempotencyKey) {
        const cached = await this.checkIdempotency(request.idempotencyKey);
        if (cached) {
          return cached;
        }
      }

      // Get current book state with lock
      const book = await this.getBookWithLock(request.bookId);
      if (!book) {
        return {
          success: false,
          newStatus: PublishingStatus.DRAFT,
          version: 0,
          errors: [`Book with ID ${request.bookId} not found`],
          warnings: []
        };
      }

      // Get workflow settings
      const workflowSettings = await this.getWorkflowSettings();
      const mode = workflowSettings?.mode || WorkflowMode.STANDARD;

      // Build transition context
      const context: TransitionContext = {
        actorRole: request.actorRole,
        bookData: book,
        mode,
        metadata: {
          ...request.metadata,
          expectedVersion: request.expectedVersion,
          rejectionTemplateId: request.templateId
        }
      };

      // Determine target status
      const targetStatus = this.determineTargetStatus(
        book.status as PublishingStatus,
        request.action,
        mode
      );

      if (!targetStatus) {
        return {
          success: false,
          newStatus: book.status as PublishingStatus,
          version: book.version || 0,
          errors: [`Invalid action ${request.action} for status ${book.status}`],
          warnings: []
        };
      }

      // Validate transition
      const validationResult = validateTransition(
        book.status as PublishingStatus,
        targetStatus,
        request.action,
        context
      );

      if (!validationResult.valid) {
        return {
          success: false,
          newStatus: book.status as PublishingStatus,
          version: book.version || 0,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        };
      }

      // Check invariants
      const invariantResult = checkInvariants({
        ...context,
        bookData: { ...book, status: targetStatus }
      });

      // Execute transition in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Optimistic locking check
        if (request.expectedVersion && book.version !== request.expectedVersion) {
          throw new Error(`Version mismatch. Expected ${request.expectedVersion}, got ${book.version}`);
        }

        const newVersion = (book.version || 0) + 1;

        // Update book status and version
        const updatedBook = await tx.book.update({
          where: { id: request.bookId },
          data: {
            status: targetStatus,
            version: newVersion,
            updatedAt: new Date(),
            // Set additional fields based on status
            ...(targetStatus === PublishingStatus.PUBLISHED && {
              publishedAt: new Date(),
              isPublished: true
            }),
            ...(request.reason && {
              lastReviewComment: request.reason
            })
          }
        });

        // Create audit event
        const auditEvent = await createAuditEvent(tx, {
          bookId: request.bookId,
          actorId: request.actorId,
          action: request.action,
          fromStatus: book.status as PublishingStatus,
          toStatus: targetStatus,
          reason: request.reason,
          templateId: request.templateId,
          metadata: request.metadata
        });

        // Schedule SLA monitoring
        await this.scheduleSLAMonitoring(tx, updatedBook, targetStatus);

        return {
          success: true,
          newStatus: targetStatus,
          version: newVersion,
          errors: [],
          warnings: [...validationResult.warnings, ...invariantResult.warnings],
          auditEventId: auditEvent.id
        };
      });

      // Cache result for idempotency
      if (request.idempotencyKey) {
        this.cacheResult(request.idempotencyKey, result);
      }

      // Send notifications asynchronously
      this.notificationService.sendTransitionNotification({
        bookId: request.bookId,
        fromStatus: book.status as PublishingStatus,
        toStatus: targetStatus,
        actorId: request.actorId,
        reason: request.reason
      }).catch(error => {
        console.error('Failed to send notification:', error);
      });

      return result;

    } catch (error) {
      console.error('Workflow transition failed:', error);
      
      return {
        success: false,
        newStatus: PublishingStatus.DRAFT,
        version: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: []
      };
    }
  }

  /**
   * Bulk operations with dry-run support
   */
  async executeBulkTransitions(
    requests: TransitionRequest[],
    dryRun: boolean = false
  ): Promise<{
    results: TransitionResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      errors: string[];
    };
  }> {
    const results: TransitionResult[] = [];
    const errors: string[] = [];

    for (const request of requests) {
      try {
        if (dryRun) {
          // Validate without executing
          const book = await prisma.book.findUnique({
            where: { id: request.bookId }
          });

          if (!book) {
            results.push({
              success: false,
              newStatus: PublishingStatus.DRAFT,
              version: 0,
              errors: [`Book ${request.bookId} not found`],
              warnings: []
            });
            continue;
          }

          const workflowSettings = await this.getWorkflowSettings();
          const mode = workflowSettings?.mode || WorkflowMode.STANDARD;
          const targetStatus = this.determineTargetStatus(
            book.status as PublishingStatus,
            request.action,
            mode
          );

          if (targetStatus) {
            const context: TransitionContext = {
              actorRole: request.actorRole,
              bookData: book,
              mode,
              metadata: request.metadata
            };

            const validation = validateTransition(
              book.status as PublishingStatus,
              targetStatus,
              request.action,
              context
            );

            results.push({
              success: validation.valid,
              newStatus: validation.valid ? targetStatus : book.status as PublishingStatus,
              version: book.version || 0,
              errors: validation.errors,
              warnings: validation.warnings
            });
          } else {
            results.push({
              success: false,
              newStatus: book.status as PublishingStatus,
              version: book.version || 0,
              errors: [`Invalid transition for book ${request.bookId}`],
              warnings: []
            });
          }
        } else {
          const result = await this.executeTransition(request);
          results.push(result);
        }
      } catch (error) {
        errors.push(`Book ${request.bookId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.push({
          success: false,
          newStatus: PublishingStatus.DRAFT,
          version: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        errors
      }
    };
  }

  /**
   * Get books that are overdue for review or revision
   */
  async getOverdueBooks(): Promise<{
    reviewOverdue: any[];
    revisionOverdue: any[];
  }> {
    const now = new Date();
    const reviewDeadline = new Date(now.getTime() - (this.slaConfig.reviewDeadlineHours * 60 * 60 * 1000));
    const revisionDeadline = new Date(now.getTime() - (this.slaConfig.revisionDeadlineDays * 24 * 60 * 60 * 1000));

    const [reviewOverdue, revisionOverdue] = await Promise.all([
      prisma.book.findMany({
        where: {
          status: PublishingStatus.PENDING,
          updatedAt: { lt: reviewDeadline }
        },
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.book.findMany({
        where: {
          status: PublishingStatus.NEEDS_REVISION,
          updatedAt: { lt: revisionDeadline }
        },
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    return { reviewOverdue, revisionOverdue };
  }

  /**
   * Send SLA reminder notifications
   */
  async sendSLAReminders(): Promise<void> {
    const overdueBooks = await this.getOverdueBooks();
    
    // Send review overdue notifications
    for (const book of overdueBooks.reviewOverdue) {
      await this.notificationService.sendSLAReminder({
        bookId: book.id,
        type: 'REVIEW_OVERDUE',
        deadlineHours: this.slaConfig.reviewDeadlineHours,
        recipients: this.slaConfig.escalationRoles
      });
    }

    // Send revision overdue notifications
    for (const book of overdueBooks.revisionOverdue) {
      await this.notificationService.sendSLAReminder({
        bookId: book.id,
        type: 'REVISION_OVERDUE',
        deadlineDays: this.slaConfig.revisionDeadlineDays,
        authorEmail: book.author?.email
      });
    }
  }

  private async checkIdempotency(key: string): Promise<TransitionResult | null> {
    const cached = this.idempotencyCache.get(key);
    if (cached) {
      // Check if within time window
      const now = Date.now();
      // For simplicity, we'll assume the cached result is still valid
      return cached;
    }
    return null;
  }

  private cacheResult(key: string, result: TransitionResult): void {
    this.idempotencyCache.set(key, result);
    
    // Clean up after window expires
    setTimeout(() => {
      this.idempotencyCache.delete(key);
    }, this.IDEMPOTENCY_WINDOW_MS);
  }

  private async getBookWithLock(bookId: string): Promise<any> {
    return await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    });
  }

  private async getWorkflowSettings(): Promise<{ mode: WorkflowMode } | null> {
    // This would fetch from WorkflowSettings model once implemented
    // For now, return default
    return { mode: WorkflowMode.STANDARD };
  }

  private determineTargetStatus(
    currentStatus: PublishingStatus,
    action: TransitionAction,
    mode: WorkflowMode
  ): PublishingStatus | null {
    switch (action) {
      case 'SUBMIT':
      case 'RESUBMIT':
        return PublishingStatus.PENDING;
      
      case 'APPROVE':
        if (mode === WorkflowMode.SIMPLE) {
          return PublishingStatus.PUBLISHED;
        } else {
          return currentStatus === PublishingStatus.PENDING ? 
            PublishingStatus.APPROVED : 
            PublishingStatus.PUBLISHED;
        }
      
      case 'PUBLISH':
        return PublishingStatus.PUBLISHED;
      
      case 'REQUEST_REVISION':
      case 'REJECT':
        return PublishingStatus.NEEDS_REVISION;
      
      case 'ARCHIVE':
        return PublishingStatus.ARCHIVED;
      
      case 'RESTORE':
        return PublishingStatus.DRAFT;
      
      default:
        return null;
    }
  }

  private async scheduleSLAMonitoring(tx: any, book: any, status: PublishingStatus): Promise<void> {
    // Create SLA monitoring records based on status
    const now = new Date();
    
    switch (status) {
      case PublishingStatus.PENDING:
        // Schedule review deadline reminder
        const reviewDeadline = new Date(now.getTime() + (this.slaConfig.reviewDeadlineHours * 60 * 60 * 1000));
        // In a real implementation, this would create a job/reminder in the database
        break;
      
      case PublishingStatus.NEEDS_REVISION:
        // Schedule revision deadline reminder
        const revisionDeadline = new Date(now.getTime() + (this.slaConfig.revisionDeadlineDays * 24 * 60 * 60 * 1000));
        // In a real implementation, this would create a job/reminder in the database
        break;
    }
  }
}