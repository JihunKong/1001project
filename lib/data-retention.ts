import { prisma } from '@/lib/prisma';
import { performHardDelete } from '@/lib/gdpr-deletion';

export interface RetentionPolicy {
  table: string;
  recordType: string;
  retentionDays: number;
  action: 'DELETE' | 'ARCHIVE' | 'ANONYMIZE';
  legalBasis: string;
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    table: 'VerificationToken',
    recordType: 'expired_token',
    retentionDays: 0,
    action: 'DELETE',
    legalBasis: 'Security - Expired tokens have no purpose',
  },
  {
    table: 'ActivityLog',
    recordType: 'old_activity',
    retentionDays: 90,
    action: 'DELETE',
    legalBasis: 'Audit purposes - 90 days sufficient for security review',
  },
  {
    table: 'Notification',
    recordType: 'old_notification',
    retentionDays: 180,
    action: 'DELETE',
    legalBasis: 'User experience - Old notifications not needed',
  },
  {
    table: 'Session',
    recordType: 'expired_session',
    retentionDays: 30,
    action: 'DELETE',
    legalBasis: 'Security - NextAuth handles session expiration',
  },
];

export class DataRetentionService {
  async cleanupExpiredVerificationTokens(): Promise<number> {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      await this.logCleanup('VerificationToken', 'expired_token', result.count, 'Token expiration');
    }

    return result.count;
  }

  async cleanupOldActivityLogs(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      await this.logCleanup('ActivityLog', 'old_activity', result.count, `Older than ${daysOld} days`);
    }

    return result.count;
  }

  async cleanupOldNotifications(daysOld: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    });

    if (result.count > 0) {
      await this.logCleanup('Notification', 'old_notification', result.count, `Read notifications older than ${daysOld} days`);
    }

    return result.count;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      await this.logCleanup('Session', 'expired_session', result.count, 'Session expiration');
    }

    return result.count;
  }

  async executeHardDeletesForExpiredRecoveryPeriod(): Promise<number> {
    const expiredRequests = await prisma.userDeletionRequest.findMany({
      where: {
        status: 'SOFT_DELETED',
        recoveryDeadline: { lt: new Date() },
      },
      include: {
        user: true,
      },
    });

    let deletedCount = 0;

    for (const request of expiredRequests) {
      try {
        await performHardDelete(request.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to hard delete user ${request.userId}:`, error);
      }
    }

    if (deletedCount > 0) {
      await this.logCleanup('UserDeletionRequest', 'hard_delete', deletedCount, 'Recovery period expired');
    }

    return deletedCount;
  }

  async cleanupExpiredDataExports(): Promise<number> {
    const expiredExports = await prisma.dataExportRequest.findMany({
      where: {
        status: 'COMPLETED',
        expiresAt: { lt: new Date() },
      },
    });

    let cleanedCount = 0;
    const fs = await import('fs');

    for (const exportRequest of expiredExports) {
      if (exportRequest.filePath && fs.existsSync(exportRequest.filePath)) {
        fs.unlinkSync(exportRequest.filePath);
      }

      await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: { status: 'EXPIRED' },
      });

      cleanedCount++;
    }

    if (cleanedCount > 0) {
      await this.logCleanup('DataExportRequest', 'expired_export', cleanedCount, 'Export expiration (7 days)');
    }

    return cleanedCount;
  }

  async notifyInactiveUsers(daysInactive: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    let notifiedCount = 0;

    for (const user of inactiveUsers) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'Account Inactivity Notice',
          createdAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            title: 'Account Inactivity Notice',
            message: 'Your account has been inactive for over a year. Per our data retention policy, inactive accounts may be deleted after 60 days of this notice. Please log in to keep your account active.',
          },
        });
        notifiedCount++;
      }
    }

    if (notifiedCount > 0) {
      await this.logCleanup('User', 'inactive_notification', notifiedCount, `Inactive for ${daysInactive}+ days`);
    }

    return notifiedCount;
  }

  async runAllCleanupTasks(): Promise<{
    verificationTokens: number;
    activityLogs: number;
    notifications: number;
    sessions: number;
    hardDeletes: number;
    expiredExports: number;
    inactiveNotifications: number;
    total: number;
  }> {
    const verificationTokens = await this.cleanupExpiredVerificationTokens();
    const activityLogs = await this.cleanupOldActivityLogs();
    const notifications = await this.cleanupOldNotifications();
    const sessions = await this.cleanupExpiredSessions();
    const hardDeletes = await this.executeHardDeletesForExpiredRecoveryPeriod();
    const expiredExports = await this.cleanupExpiredDataExports();
    const inactiveNotifications = await this.notifyInactiveUsers();

    const total = verificationTokens + activityLogs + notifications + sessions + hardDeletes + expiredExports + inactiveNotifications;

    return {
      verificationTokens,
      activityLogs,
      notifications,
      sessions,
      hardDeletes,
      expiredExports,
      inactiveNotifications,
      total,
    };
  }

  private async logCleanup(
    tableName: string,
    recordType: string,
    deletedCount: number,
    reason: string
  ): Promise<void> {
    await prisma.cleanupLog.create({
      data: {
        tableName,
        recordType,
        deletedCount,
        reason,
        executedBy: 'SYSTEM',
        metadata: JSON.parse(JSON.stringify({
          timestamp: new Date().toISOString(),
          policy: RETENTION_POLICIES.find((p) => p.table === tableName && p.recordType === recordType) ?? null,
        })),
      },
    });
  }

  async getCleanupHistory(days: number = 30): Promise<Array<{
    id: string;
    tableName: string;
    recordType: string;
    deletedCount: number;
    reason: string;
    executedAt: Date;
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return prisma.cleanupLog.findMany({
      where: {
        executedAt: { gte: cutoffDate },
      },
      orderBy: { executedAt: 'desc' },
      select: {
        id: true,
        tableName: true,
        recordType: true,
        deletedCount: true,
        reason: true,
        executedAt: true,
      },
    });
  }

  getRetentionPolicies(): RetentionPolicy[] {
    return RETENTION_POLICIES;
  }
}
