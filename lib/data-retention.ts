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
    retentionDays: 365,
    action: 'DELETE',
    legalBasis: 'FERPA/PIPA compliance - Activity logs retained for 12 months',
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
  {
    table: 'ReadingProgress',
    recordType: 'old_reading_progress',
    retentionDays: 730,
    action: 'ANONYMIZE',
    legalBasis: 'Educational purpose - Reading progress retained for 24 months then anonymized',
  },
  {
    table: 'QuizAttempt',
    recordType: 'old_quiz_attempt',
    retentionDays: 730,
    action: 'ANONYMIZE',
    legalBasis: 'Educational purpose - Quiz records retained for 24 months then anonymized',
  },
  {
    table: 'ParentalConsentRecord',
    recordType: 'consent_record',
    retentionDays: 1095,
    action: 'ARCHIVE',
    legalBasis: 'COPPA legal requirement - Consent records must be retained for 3 years',
  },
  {
    table: 'AccessAuditLog',
    recordType: 'access_log',
    retentionDays: 1095,
    action: 'ARCHIVE',
    legalBasis: 'FERPA compliance - Access logs retained for 3 years',
  },
  {
    table: 'VocabularyWord',
    recordType: 'vocabulary',
    retentionDays: 730,
    action: 'DELETE',
    legalBasis: 'Educational purpose - Vocabulary data retained for 24 months',
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

  async cleanupOldReadingProgress(daysOld: number = 730): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldProgress = await prisma.readingProgress.findMany({
      where: {
        lastReadAt: { lt: cutoffDate },
      },
      select: { id: true, userId: true, bookId: true },
    });

    let anonymizedCount = 0;

    for (const progress of oldProgress) {
      await prisma.readingProgress.update({
        where: { id: progress.id },
        data: {
          notes: [],
        },
      });
      anonymizedCount++;
    }

    if (anonymizedCount > 0) {
      await this.logCleanup('ReadingProgress', 'old_reading_progress', anonymizedCount, `Anonymized notes older than ${daysOld} days`);
    }

    return anonymizedCount;
  }

  async cleanupOldQuizAttempts(daysOld: number = 730): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.quizAttempt.updateMany({
      where: {
        completedAt: { lt: cutoffDate },
      },
      data: {
        answers: {},
      },
    });

    if (result.count > 0) {
      await this.logCleanup('QuizAttempt', 'old_quiz_attempt', result.count, `Anonymized answers older than ${daysOld} days`);
    }

    return result.count;
  }

  async cleanupOldVocabulary(daysOld: number = 730): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.vocabularyWord.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      await this.logCleanup('VocabularyWord', 'vocabulary', result.count, `Deleted vocabulary older than ${daysOld} days`);
    }

    return result.count;
  }

  async cleanupExpiredParentalConsent(): Promise<number> {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const result = await prisma.parentalConsentRecord.deleteMany({
      where: {
        OR: [
          {
            consentGranted: false,
            createdAt: { lt: threeYearsAgo },
          },
          {
            AND: [
              { revokedAt: { not: null } },
              { revokedAt: { lt: threeYearsAgo } },
            ],
          },
        ],
      },
    });

    if (result.count > 0) {
      await this.logCleanup('ParentalConsentRecord', 'consent_record', result.count, 'Deleted consent records older than 3 years (COPPA)');
    }

    return result.count;
  }

  async processScheduledDeletions(): Promise<number> {
    const now = new Date();

    const scheduledDeletions = await prisma.dataRetentionSchedule.findMany({
      where: {
        deleteAfter: { lte: now },
        deletedAt: null,
      },
      take: 100,
    });

    let deletedCount = 0;

    for (const schedule of scheduledDeletions) {
      try {
        switch (schedule.tableName) {
          case 'ReadingProgress':
            await prisma.readingProgress.delete({
              where: { id: schedule.recordId },
            });
            break;
          case 'QuizAttempt':
            await prisma.quizAttempt.delete({
              where: { id: schedule.recordId },
            });
            break;
          case 'ActivityLog':
            await prisma.activityLog.delete({
              where: { id: schedule.recordId },
            });
            break;
          case 'VocabularyWord':
            await prisma.vocabularyWord.delete({
              where: { id: schedule.recordId },
            });
            break;
        }

        await prisma.dataRetentionSchedule.update({
          where: { id: schedule.id },
          data: {
            deletedAt: now,
            deletionVerified: true,
          },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete scheduled record ${schedule.id}:`, error);
      }
    }

    if (deletedCount > 0) {
      await this.logCleanup('DataRetentionSchedule', 'scheduled_deletion', deletedCount, 'Processed scheduled deletions');
    }

    return deletedCount;
  }

  async runAllCleanupTasksExtended(): Promise<{
    verificationTokens: number;
    activityLogs: number;
    notifications: number;
    sessions: number;
    hardDeletes: number;
    expiredExports: number;
    inactiveNotifications: number;
    readingProgress: number;
    quizAttempts: number;
    vocabulary: number;
    parentalConsent: number;
    scheduledDeletions: number;
    total: number;
  }> {
    const verificationTokens = await this.cleanupExpiredVerificationTokens();
    const activityLogs = await this.cleanupOldActivityLogs(365);
    const notifications = await this.cleanupOldNotifications();
    const sessions = await this.cleanupExpiredSessions();
    const hardDeletes = await this.executeHardDeletesForExpiredRecoveryPeriod();
    const expiredExports = await this.cleanupExpiredDataExports();
    const inactiveNotifications = await this.notifyInactiveUsers();
    const readingProgress = await this.cleanupOldReadingProgress();
    const quizAttempts = await this.cleanupOldQuizAttempts();
    const vocabulary = await this.cleanupOldVocabulary();
    const parentalConsent = await this.cleanupExpiredParentalConsent();
    const scheduledDeletions = await this.processScheduledDeletions();

    const total = verificationTokens + activityLogs + notifications + sessions +
      hardDeletes + expiredExports + inactiveNotifications + readingProgress +
      quizAttempts + vocabulary + parentalConsent + scheduledDeletions;

    return {
      verificationTokens,
      activityLogs,
      notifications,
      sessions,
      hardDeletes,
      expiredExports,
      inactiveNotifications,
      readingProgress,
      quizAttempts,
      vocabulary,
      parentalConsent,
      scheduledDeletions,
      total,
    };
  }
}
