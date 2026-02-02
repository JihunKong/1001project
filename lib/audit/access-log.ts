import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export type AccessAction = 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SHARE';

export type EducationalEntityType =
  | 'ReadingProgress'
  | 'QuizAttempt'
  | 'VocabularyWord'
  | 'Profile'
  | 'ClassEnrollment'
  | 'Submission'
  | 'LessonProgress'
  | 'BookAssignment'
  | 'User';

export interface AccessLogEntry {
  userId: string;
  entityType: EducationalEntityType;
  entityId: string;
  action: AccessAction;
  accessedBy: string;
  accessedByRole: string;
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessLogQuery {
  userId?: string;
  entityType?: EducationalEntityType;
  entityId?: string;
  accessedBy?: string;
  action?: AccessAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AccessLogSummary {
  totalAccesses: number;
  uniqueAccessors: number;
  accessByType: Record<string, number>;
  accessByAction: Record<string, number>;
  recentAccesses: Array<{
    accessedBy: string;
    accessedByRole: string;
    action: string;
    timestamp: Date;
    purpose?: string;
  }>;
}

export class AccessAuditService {
  async logAccess(entry: AccessLogEntry): Promise<string> {
    try {
      const log = await prisma.accessAuditLog.create({
        data: {
          userId: entry.userId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          accessedBy: entry.accessedBy,
          accessedByRole: entry.accessedByRole,
          purpose: entry.purpose,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: (entry.metadata as Prisma.InputJsonValue) || undefined,
        },
      });

      return log.id;
    } catch (error) {
      logger.error('Failed to log access', error);
      throw new Error('Failed to log access');
    }
  }

  async logReadingProgressAccess(
    studentUserId: string,
    progressId: string,
    accessedBy: string,
    accessedByRole: string,
    purpose: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAccess({
      userId: studentUserId,
      entityType: 'ReadingProgress',
      entityId: progressId,
      action: 'READ',
      accessedBy,
      accessedByRole,
      purpose,
      ipAddress,
    });
  }

  async logQuizAttemptAccess(
    studentUserId: string,
    attemptId: string,
    accessedBy: string,
    accessedByRole: string,
    purpose: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAccess({
      userId: studentUserId,
      entityType: 'QuizAttempt',
      entityId: attemptId,
      action: 'READ',
      accessedBy,
      accessedByRole,
      purpose,
      ipAddress,
    });
  }

  async logProfileAccess(
    targetUserId: string,
    accessedBy: string,
    accessedByRole: string,
    action: AccessAction,
    purpose: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAccess({
      userId: targetUserId,
      entityType: 'Profile',
      entityId: targetUserId,
      action,
      accessedBy,
      accessedByRole,
      purpose,
      ipAddress,
    });
  }

  async logDataExport(
    userId: string,
    exportedBy: string,
    exportedByRole: string,
    exportFormat: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAccess({
      userId,
      entityType: 'User',
      entityId: userId,
      action: 'EXPORT',
      accessedBy: exportedBy,
      accessedByRole: exportedByRole,
      purpose: `Data export in ${exportFormat} format`,
      ipAddress,
      metadata: { exportFormat },
    });
  }

  async getAccessHistory(query: AccessLogQuery): Promise<{
    logs: Array<{
      id: string;
      userId: string;
      entityType: string;
      entityId: string;
      action: string;
      accessedBy: string;
      accessedByRole: string;
      purpose: string | null;
      timestamp: Date;
    }>;
    total: number;
  }> {
    const where: Record<string, unknown> = {};

    if (query.userId) where.userId = query.userId;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.accessedBy) where.accessedBy = query.accessedBy;
    if (query.action) where.action = query.action;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        (where.timestamp as Record<string, Date>).gte = query.startDate;
      }
      if (query.endDate) {
        (where.timestamp as Record<string, Date>).lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.accessAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
        select: {
          id: true,
          userId: true,
          entityType: true,
          entityId: true,
          action: true,
          accessedBy: true,
          accessedByRole: true,
          purpose: true,
          timestamp: true,
        },
      }),
      prisma.accessAuditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getAccessSummaryForUser(userId: string): Promise<AccessLogSummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.accessAuditLog.findMany({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    const uniqueAccessors = new Set(logs.map((l) => l.accessedBy)).size;

    const accessByType: Record<string, number> = {};
    const accessByAction: Record<string, number> = {};

    for (const log of logs) {
      accessByType[log.entityType] = (accessByType[log.entityType] || 0) + 1;
      accessByAction[log.action] = (accessByAction[log.action] || 0) + 1;
    }

    const recentAccesses = logs.slice(0, 10).map((log) => ({
      accessedBy: log.accessedBy,
      accessedByRole: log.accessedByRole,
      action: log.action,
      timestamp: log.timestamp,
      purpose: log.purpose || undefined,
    }));

    return {
      totalAccesses: logs.length,
      uniqueAccessors,
      accessByType,
      accessByAction,
      recentAccesses,
    };
  }

  async getTeacherAccessReport(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalStudentRecordsAccessed: number;
    studentsAccessed: string[];
    accessByEntityType: Record<string, number>;
    accessTimeline: Array<{ date: string; count: number }>;
  }> {
    const logs = await prisma.accessAuditLog.findMany({
      where: {
        accessedBy: teacherId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const studentsAccessed = [...new Set(logs.map((l) => l.userId))];

    const accessByEntityType: Record<string, number> = {};
    for (const log of logs) {
      accessByEntityType[log.entityType] =
        (accessByEntityType[log.entityType] || 0) + 1;
    }

    const timelineMap = new Map<string, number>();
    for (const log of logs) {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
    }

    const accessTimeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalStudentRecordsAccessed: logs.length,
      studentsAccessed,
      accessByEntityType,
      accessTimeline,
    };
  }

  async checkUnauthorizedAccessPatterns(
    userId: string
  ): Promise<{
    hasAnomalies: boolean;
    anomalies: Array<{
      type: string;
      description: string;
      timestamp: Date;
    }>;
  }> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentAccesses = await prisma.accessAuditLog.findMany({
      where: {
        userId,
        timestamp: { gte: twentyFourHoursAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    const anomalies: Array<{
      type: string;
      description: string;
      timestamp: Date;
    }> = [];

    if (recentAccesses.length > 100) {
      anomalies.push({
        type: 'HIGH_ACCESS_VOLUME',
        description: `${recentAccesses.length} accesses in 24 hours`,
        timestamp: new Date(),
      });
    }

    const uniqueAccessors = new Set(recentAccesses.map((a) => a.accessedBy));
    if (uniqueAccessors.size > 10) {
      anomalies.push({
        type: 'MULTIPLE_ACCESSORS',
        description: `${uniqueAccessors.size} different users accessed records`,
        timestamp: new Date(),
      });
    }

    const exportCount = recentAccesses.filter(
      (a) => a.action === 'EXPORT'
    ).length;
    if (exportCount > 5) {
      anomalies.push({
        type: 'FREQUENT_EXPORTS',
        description: `${exportCount} data exports in 24 hours`,
        timestamp: new Date(),
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
    };
  }

  async generateFERPAComplianceReport(
    institutionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    period: { start: Date; end: Date };
    totalAccessLogs: number;
    accessByRole: Record<string, number>;
    accessByPurpose: Record<string, number>;
    potentialViolations: Array<{
      type: string;
      count: number;
      details: string;
    }>;
  }> {
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

    const start = startDate || defaultStartDate;
    const end = endDate || defaultEndDate;

    const logs = await prisma.accessAuditLog.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: end,
        },
      },
    });

    const accessByRole: Record<string, number> = {};
    const accessByPurpose: Record<string, number> = {};

    for (const log of logs) {
      accessByRole[log.accessedByRole] =
        (accessByRole[log.accessedByRole] || 0) + 1;

      const purpose = log.purpose || 'Unspecified';
      accessByPurpose[purpose] = (accessByPurpose[purpose] || 0) + 1;
    }

    const potentialViolations: Array<{
      type: string;
      count: number;
      details: string;
    }> = [];

    const unspecifiedPurpose = accessByPurpose['Unspecified'] || 0;
    if (unspecifiedPurpose > 0) {
      potentialViolations.push({
        type: 'ACCESS_WITHOUT_PURPOSE',
        count: unspecifiedPurpose,
        details:
          'Accesses without documented educational purpose may violate FERPA',
      });
    }

    return {
      period: { start, end },
      totalAccessLogs: logs.length,
      accessByRole,
      accessByPurpose,
      potentialViolations,
    };
  }
}

export const accessAuditService = new AccessAuditService();
