/**
 * Audit Event System - Immutable logging for publishing workflow state changes
 * Provides compliance reporting, analytics, and complete audit trail
 */

import { PrismaClient } from '@prisma/client';
import { PublishingStatus, TransitionAction } from './status-transitions';

export enum AuditEventType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  FEEDBACK_PROVIDED = 'FEEDBACK_PROVIDED',
  SLA_VIOLATION = 'SLA_VIOLATION',
  BULK_OPERATION = 'BULK_OPERATION',
  SYSTEM_ACTION = 'SYSTEM_ACTION',
  USER_ACTION = 'USER_ACTION'
}

export interface AuditEventData {
  bookId: string;
  actorId: string;
  action: TransitionAction;
  fromStatus: PublishingStatus;
  toStatus: PublishingStatus;
  reason?: string;
  templateId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEventFilter {
  bookId?: string;
  actorId?: string;
  action?: TransitionAction;
  fromStatus?: PublishingStatus;
  toStatus?: PublishingStatus;
  eventType?: AuditEventType;
  fromDate?: Date;
  toDate?: Date;
  templateId?: string;
}

export interface ComplianceReport {
  periodStart: Date;
  periodEnd: Date;
  totalEvents: number;
  statusDistribution: Record<PublishingStatus, number>;
  actionDistribution: Record<TransitionAction, number>;
  averageProcessingTime: Record<string, number>;
  slaViolations: number;
  topReviewers: Array<{ actorId: string; count: number }>;
  rejectionReasons: Array<{ templateId: string; count: number }>;
}

export interface AnalyticsMetrics {
  workflowEfficiency: {
    averageTimeToPublication: number;
    bottleneckStages: string[];
    rejectionRate: number;
  };
  reviewerPerformance: Array<{
    reviewerId: string;
    reviewCount: number;
    averageReviewTime: number;
    rejectionRate: number;
  }>;
  contentQuality: {
    firstPassApprovalRate: number;
    averageRevisionCycles: number;
    commonIssues: string[];
  };
}

/**
 * Create an immutable audit event
 */
export async function createAuditEvent(
  tx: any, // Prisma transaction client
  data: AuditEventData
): Promise<any> {
  const auditEvent = await tx.auditEvent.create({
    data: {
      id: generateAuditId(),
      eventType: AuditEventType.STATUS_CHANGE,
      bookId: data.bookId,
      actorId: data.actorId,
      action: data.action,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      reason: data.reason,
      templateId: data.templateId,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
      checksum: generateChecksum(data)
    }
  });

  return auditEvent;
}

/**
 * Create a bulk operation audit event
 */
export async function createBulkAuditEvent(
  tx: any,
  actorId: string,
  operation: string,
  bookIds: string[],
  results: any[]
): Promise<any> {
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  return await tx.auditEvent.create({
    data: {
      id: generateAuditId(),
      eventType: AuditEventType.BULK_OPERATION,
      actorId,
      action: 'BULK_OPERATION' as TransitionAction,
      metadata: {
        operation,
        bookIds,
        totalBooks: bookIds.length,
        successful,
        failed,
        results: results.map(r => ({
          bookId: r.bookId,
          success: r.success,
          errors: r.errors
        }))
      },
      timestamp: new Date(),
      checksum: generateChecksum({
        actorId,
        operation,
        bookIds,
        timestamp: new Date().toISOString()
      })
    }
  });
}

/**
 * Create SLA violation audit event
 */
export async function createSLAViolationEvent(
  tx: any,
  bookId: string,
  violationType: 'REVIEW_OVERDUE' | 'REVISION_OVERDUE',
  deadlineHours: number
): Promise<any> {
  return await tx.auditEvent.create({
    data: {
      id: generateAuditId(),
      eventType: AuditEventType.SLA_VIOLATION,
      bookId,
      action: 'SLA_VIOLATION' as TransitionAction,
      metadata: {
        violationType,
        deadlineHours,
        detectedAt: new Date()
      },
      timestamp: new Date(),
      checksum: generateChecksum({
        bookId,
        violationType,
        deadlineHours,
        timestamp: new Date().toISOString()
      })
    }
  });
}

/**
 * Query audit events with filtering and pagination
 */
export async function queryAuditEvents(
  prisma: PrismaClient,
  filter: AuditEventFilter,
  limit: number = 100,
  offset: number = 0
): Promise<{
  events: any[];
  total: number;
  hasMore: boolean;
}> {
  const whereClause: any = {};

  // Build where clause from filter
  if (filter.bookId) whereClause.bookId = filter.bookId;
  if (filter.actorId) whereClause.actorId = filter.actorId;
  if (filter.action) whereClause.action = filter.action;
  if (filter.fromStatus) whereClause.fromStatus = filter.fromStatus;
  if (filter.toStatus) whereClause.toStatus = filter.toStatus;
  if (filter.eventType) whereClause.eventType = filter.eventType;
  if (filter.templateId) whereClause.templateId = filter.templateId;

  if (filter.fromDate || filter.toDate) {
    whereClause.timestamp = {};
    if (filter.fromDate) whereClause.timestamp.gte = filter.fromDate;
    if (filter.toDate) whereClause.timestamp.lte = filter.toDate;
  }

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        book: {
          select: { title: true, authorName: true }
        },
        actor: {
          select: { name: true, email: true, role: true }
        }
      }
    }),
    prisma.auditEvent.count({ where: whereClause })
  ]);

  return {
    events,
    total,
    hasMore: offset + events.length < total
  };
}

/**
 * Generate compliance report for a given period
 */
export async function generateComplianceReport(
  prisma: PrismaClient,
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  const events = await prisma.auditEvent.findMany({
    where: {
      timestamp: { gte: startDate, lte: endDate },
      eventType: AuditEventType.STATUS_CHANGE
    },
    include: {
      book: { select: { title: true } }
    }
  });

  // Calculate status distribution
  const statusDistribution = events.reduce((acc, event) => {
    acc[event.toStatus as PublishingStatus] = (acc[event.toStatus as PublishingStatus] || 0) + 1;
    return acc;
  }, {} as Record<PublishingStatus, number>);

  // Calculate action distribution
  const actionDistribution = events.reduce((acc, event) => {
    acc[event.action as TransitionAction] = (acc[event.action as TransitionAction] || 0) + 1;
    return acc;
  }, {} as Record<TransitionAction, number>);

  // Calculate processing times by book
  const processingTimes = await calculateProcessingTimes(prisma, startDate, endDate);

  // Count SLA violations
  const slaViolations = await prisma.auditEvent.count({
    where: {
      timestamp: { gte: startDate, lte: endDate },
      eventType: AuditEventType.SLA_VIOLATION
    }
  });

  // Get top reviewers
  const reviewerCounts = events.reduce((acc, event) => {
    if (event.actorId) {
      acc[event.actorId] = (acc[event.actorId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topReviewers = Object.entries(reviewerCounts)
    .map(([actorId, count]) => ({ actorId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get rejection reasons
  const rejectionReasons = events
    .filter(event => event.templateId)
    .reduce((acc, event) => {
      const templateId = event.templateId!;
      const existing = acc.find(r => r.templateId === templateId);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ templateId, count: 1 });
      }
      return acc;
    }, [] as Array<{ templateId: string; count: number }>)
    .sort((a, b) => b.count - a.count);

  return {
    periodStart: startDate,
    periodEnd: endDate,
    totalEvents: events.length,
    statusDistribution,
    actionDistribution,
    averageProcessingTime: processingTimes,
    slaViolations,
    topReviewers,
    rejectionReasons
  };
}

/**
 * Generate analytics metrics for workflow optimization
 */
export async function generateAnalyticsMetrics(
  prisma: PrismaClient,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsMetrics> {
  // Get all published books in period
  const publishedBooks = await prisma.book.findMany({
    where: {
      status: PublishingStatus.PUBLISHED,
      publishedAt: { gte: startDate, lte: endDate }
    }
  });

  // Get audit events for these books
  const bookIds = publishedBooks.map(b => b.id);
  const auditEvents = await prisma.auditEvent.findMany({
    where: {
      bookId: { in: bookIds },
      eventType: AuditEventType.STATUS_CHANGE
    },
    orderBy: { timestamp: 'asc' }
  });

  // Calculate workflow efficiency
  const workflowEfficiency = calculateWorkflowEfficiency(auditEvents, publishedBooks);

  // Calculate reviewer performance
  const reviewerPerformance = await calculateReviewerPerformance(prisma, auditEvents, startDate, endDate);

  // Calculate content quality metrics
  const contentQuality = calculateContentQuality(auditEvents);

  return {
    workflowEfficiency,
    reviewerPerformance,
    contentQuality
  };
}

/**
 * Verify audit trail integrity
 */
export async function verifyAuditIntegrity(
  prisma: PrismaClient,
  bookId: string
): Promise<{
  valid: boolean;
  issues: string[];
  events: any[];
}> {
  const events = await prisma.auditEvent.findMany({
    where: { bookId },
    orderBy: { timestamp: 'asc' }
  });

  const issues: string[] = [];

  // Verify chronological order
  for (let i = 1; i < events.length; i++) {
    if (events[i].timestamp < events[i-1].timestamp) {
      issues.push(`Timestamp out of order between events ${events[i-1].id} and ${events[i].id}`);
    }
  }

  // Verify status transitions are valid
  for (let i = 1; i < events.length; i++) {
    const prevEvent = events[i-1];
    const currentEvent = events[i];
    
    if (prevEvent.toStatus !== currentEvent.fromStatus) {
      issues.push(`Status gap between events: ${prevEvent.toStatus} -> ${currentEvent.fromStatus}`);
    }
  }

  // Verify checksums
  for (const event of events) {
    const expectedChecksum = generateChecksum({
      bookId: event.bookId,
      actorId: event.actorId,
      action: event.action,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      timestamp: event.timestamp.toISOString()
    });
    
    if (event.checksum !== expectedChecksum) {
      issues.push(`Checksum mismatch for event ${event.id}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    events
  };
}

// Helper functions

function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateChecksum(data: any): string {
  // Simple checksum implementation
  // In production, use crypto.createHash('sha256')
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

async function calculateProcessingTimes(
  prisma: PrismaClient,
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  // Implementation would calculate average time spent in each status
  // This is a simplified version
  return {
    'DRAFT_to_PENDING': 2.5, // days
    'PENDING_to_APPROVED': 1.8,
    'APPROVED_to_PUBLISHED': 0.5
  };
}

function calculateWorkflowEfficiency(auditEvents: any[], publishedBooks: any[]): any {
  const totalBooks = publishedBooks.length;
  if (totalBooks === 0) return { averageTimeToPublication: 0, bottleneckStages: [], rejectionRate: 0 };

  // Calculate average time to publication
  const publicationTimes = publishedBooks.map(book => {
    const firstEvent = auditEvents.find(e => e.bookId === book.id && e.fromStatus === PublishingStatus.DRAFT);
    const lastEvent = auditEvents.find(e => e.bookId === book.id && e.toStatus === PublishingStatus.PUBLISHED);
    
    if (firstEvent && lastEvent) {
      return (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24); // days
    }
    return 0;
  }).filter(time => time > 0);

  const averageTimeToPublication = publicationTimes.reduce((sum, time) => sum + time, 0) / publicationTimes.length;

  // Identify bottleneck stages (simplified)
  const bottleneckStages = ['PENDING']; // Placeholder

  // Calculate rejection rate
  const rejectionEvents = auditEvents.filter(e => e.toStatus === PublishingStatus.NEEDS_REVISION);
  const rejectionRate = rejectionEvents.length / totalBooks;

  return {
    averageTimeToPublication,
    bottleneckStages,
    rejectionRate
  };
}

async function calculateReviewerPerformance(
  prisma: PrismaClient,
  auditEvents: any[],
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // Group events by reviewer
  const reviewerGroups = auditEvents.reduce((acc, event) => {
    if (event.actorId) {
      if (!acc[event.actorId]) {
        acc[event.actorId] = [];
      }
      acc[event.actorId].push(event);
    }
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(reviewerGroups).map(([reviewerId, events]) => ({
    reviewerId,
    reviewCount: events.length,
    averageReviewTime: 1.5, // Placeholder - would calculate actual times
    rejectionRate: events.filter(e => e.toStatus === PublishingStatus.NEEDS_REVISION).length / events.length
  }));
}

function calculateContentQuality(auditEvents: any[]): any {
  const totalSubmissions = auditEvents.filter(e => e.action === 'SUBMIT').length;
  const firstPassApprovals = auditEvents.filter(e => 
    e.action === 'APPROVE' && 
    e.fromStatus === PublishingStatus.PENDING
  ).length;

  const firstPassApprovalRate = totalSubmissions > 0 ? firstPassApprovals / totalSubmissions : 0;

  return {
    firstPassApprovalRate,
    averageRevisionCycles: 1.2, // Placeholder
    commonIssues: ['Grammar', 'Content structure', 'Image quality'] // Placeholder
  };
}