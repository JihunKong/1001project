import { prisma } from '@/lib/prisma';
import { EmailService } from './EmailService';
import { logger } from '@/lib/logger';
import { NotificationType } from '@prisma/client';

interface DigestNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  data: any;
}

interface DigestUser {
  id: string;
  name: string;
  email: string;
  notifications: DigestNotification[];
}

export class DigestService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async sendDailyDigests(): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usersWithNotifications = await this.getUsersWithUnreadNotifications(
        yesterday,
        today,
        'daily'
      );

      logger.info(`Sending daily digests to ${usersWithNotifications.length} users`);

      for (const user of usersWithNotifications) {
        try {
          await this.sendDigestEmail(user, 'daily');
          sent++;
        } catch (error) {
          logger.error(`Failed to send daily digest to ${user.email}`, error);
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      logger.error('Error sending daily digests', error);
      throw error;
    }
  }

  async sendWeeklyDigests(): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usersWithNotifications = await this.getUsersWithUnreadNotifications(
        lastWeek,
        today,
        'weekly'
      );

      logger.info(`Sending weekly digests to ${usersWithNotifications.length} users`);

      for (const user of usersWithNotifications) {
        try {
          await this.sendDigestEmail(user, 'weekly');
          sent++;
        } catch (error) {
          logger.error(`Failed to send weekly digest to ${user.email}`, error);
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      logger.error('Error sending weekly digests', error);
      throw error;
    }
  }

  private async getUsersWithUnreadNotifications(
    startDate: Date,
    endDate: Date,
    frequency: 'daily' | 'weekly'
  ): Promise<DigestUser[]> {
    try {
      const prefsQuery = await prisma.$queryRaw<any[]>`
        SELECT user_id, preferences
        FROM notification_preferences
        WHERE preferences->>'digestFrequency' = ${frequency}
      `;

      const userIdsWithPreference = prefsQuery.map((p: any) => p.user_id);

      const users = await prisma.user.findMany({
        where: {
          id: { in: userIdsWithPreference.length > 0 ? userIdsWithPreference : [] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              emailNotifications: true,
            },
          },
          notifications: {
            where: {
              read: false,
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
        },
      });

      return users
        .filter((user) => user.profile?.emailNotifications && user.notifications.length > 0)
        .map((user) => ({
          id: user.id,
          name: user.name || 'User',
          email: user.email,
          notifications: user.notifications,
        }));
    } catch (error) {
      logger.error('Error fetching users for digest', error);
      return [];
    }
  }

  private async sendDigestEmail(
    user: DigestUser,
    frequency: 'daily' | 'weekly'
  ): Promise<void> {
    const subject = `Your ${frequency === 'daily' ? 'Daily' : 'Weekly'} Notification Summary from 1001 Stories`;

    const html = this.createDigestEmailHTML(user, frequency);
    const text = this.createDigestEmailText(user, frequency);

    await this.emailService.sendNotificationEmail(
      user.email,
      user.name,
      subject,
      html,
      text
    );
  }

  private createDigestEmailHTML(user: DigestUser, frequency: 'daily' | 'weekly'): string {
    const notificationCount = user.notifications.length;
    const period = frequency === 'daily' ? 'the last 24 hours' : 'the last 7 days';

    let notificationsHTML = '';
    for (const notification of user.notifications) {
      const icon = this.getNotificationIcon(notification.type);
      const date = new Date(notification.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      notificationsHTML += `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: start;">
              <div style="font-size: 24px; margin-right: 12px;">${icon}</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  ${notification.title}
                </h3>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                  ${notification.message}
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  ${date}
                </p>
              </div>
            </div>
          </td>
        </tr>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #9fcc40 0%, #7ba832 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                1001 Stories
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                ${frequency === 'daily' ? 'Daily' : 'Weekly'} Notification Summary
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; color: #111827; margin: 0 0 16px 0;">
                Hi ${user.name},
              </p>
              <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px 0;">
                You have <strong>${notificationCount}</strong> unread notification${notificationCount !== 1 ? 's' : ''} from ${period}.
              </p>

              <!-- Notifications List -->
              <table style="width: 100%; border-collapse: collapse;">
                ${notificationsHTML}
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'https://1001stories.seedsofempowerment.org'}/profile/notifications"
                   style="display: inline-block; background-color: #9fcc40; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View All Notifications
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                To change your notification preferences, visit
                <a href="${process.env.NEXTAUTH_URL || 'https://1001stories.seedsofempowerment.org'}/profile/notifications/preferences"
                   style="color: #9fcc40; text-decoration: none;">
                  Notification Settings
                </a>.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                © 2025 1001 Stories. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Empowering children through storytelling.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private createDigestEmailText(user: DigestUser, frequency: 'daily' | 'weekly'): string {
    const notificationCount = user.notifications.length;
    const period = frequency === 'daily' ? 'the last 24 hours' : 'the last 7 days';

    let notificationsText = '';
    for (const notification of user.notifications) {
      const date = new Date(notification.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      notificationsText += `\n\n${notification.title}\n${notification.message}\n${date}`;
    }

    return `
1001 Stories - ${frequency === 'daily' ? 'Daily' : 'Weekly'} Notification Summary

Hi ${user.name},

You have ${notificationCount} unread notification${notificationCount !== 1 ? 's' : ''} from ${period}.
${notificationsText}

View all notifications: ${process.env.NEXTAUTH_URL || 'https://1001stories.seedsofempowerment.org'}/profile/notifications

To change your notification preferences, visit: ${process.env.NEXTAUTH_URL || 'https://1001stories.seedsofempowerment.org'}/profile/notifications/preferences

---
© 2025 1001 Stories. All rights reserved.
Empowering children through storytelling.
    `;
  }

  private getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'SYSTEM':
        return '⚙️';
      case 'ORDER':
        return '🛒';
      case 'ASSIGNMENT':
        return '📚';
      case 'CLASS':
        return '👥';
      case 'DONATION':
        return '💝';
      case 'WRITER':
        return '✍️';
      case 'ACHIEVEMENT':
        return '🏆';
      default:
        return '📬';
    }
  }
}
