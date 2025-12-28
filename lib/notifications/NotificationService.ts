import { prisma } from '@/lib/prisma';
import { NotificationType, TextSubmissionStatus, UserRole } from '@prisma/client';
import { EmailService } from './EmailService';
import { broadcastNotification, broadcastStatusChange } from '@/lib/notifications/sse-broadcast';
import { logger } from '@/lib/logger';
import { queueEmailNotification } from '@/lib/queue/emailQueue';

export interface NotificationData {
  submissionId?: string;
  submissionTitle?: string;
  feedback?: string;
  reviewerName?: string;
  dueDate?: string;
  estimatedTime?: string;
  nextSteps?: string[];
  [key: string]: any;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  statusChanges: boolean;
  feedback: boolean;
  deadlines: boolean;
  achievements: boolean;
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Create and send notification
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data ? JSON.parse(JSON.stringify(data)) : null
        }
      });

      // Get user preferences
      const userPreferences = await this.getUserNotificationPreferences(userId);

      // Send real-time notification
      broadcastNotification(userId, notification);

      // Send email if enabled
      if (userPreferences.emailEnabled && this.shouldSendEmailForType(type, userPreferences)) {
        await this.sendEmailNotification(userId, notification, data);
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification', error);
      throw error;
    }
  }

  // Handle story submission status changes
  async handleStatusChange(
    submissionId: string,
    oldStatus: TextSubmissionStatus,
    newStatus: TextSubmissionStatus,
    performedById?: string,
    feedback?: string,
    additionalData?: any
  ) {
    try {
      const submission = await prisma.textSubmission.findUnique({
        where: { id: submissionId },
        include: {
          author: { select: { id: true, name: true, email: true } },
          storyManager: { select: { id: true, name: true, email: true } },
          bookManager: { select: { id: true, name: true, email: true } },
          contentAdmin: { select: { id: true, name: true, email: true } }
        }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      const performedBy = performedById ? await prisma.user.findUnique({
        where: { id: performedById },
        select: { name: true, role: true }
      }) : null;

      // Send notification to author about status change
      await this.sendStatusChangeNotification(
        submission,
        oldStatus,
        newStatus,
        performedBy,
        feedback,
        additionalData
      );

      // Broadcast real-time status change
      broadcastStatusChange(
        submission.authorId,
        submissionId,
        oldStatus,
        newStatus,
        {
          title: submission.title,
          performedBy: performedBy?.name,
          feedback,
          ...additionalData
        }
      );

      // Send notifications to relevant reviewers if needed
      await this.notifyReviewers(submission, newStatus, performedBy, additionalData);

    } catch (error) {
      logger.error('Error handling status change', error);
      throw error;
    }
  }

  // Send status change notification to author
  private async sendStatusChangeNotification(
    submission: any,
    oldStatus: TextSubmissionStatus,
    newStatus: TextSubmissionStatus,
    performedBy: any,
    feedback?: string,
    additionalData?: any
  ) {
    const statusMessages = this.getStatusMessages(oldStatus, newStatus, performedBy?.name);

    const notificationData: NotificationData = {
      submissionId: submission.id,
      submissionTitle: submission.title,
      feedback,
      reviewerName: performedBy?.name,
      ...additionalData
    };

    // Add next steps based on new status
    const nextSteps = this.getNextSteps(newStatus);
    if (nextSteps.length > 0) {
      notificationData.nextSteps = nextSteps;
    }

    await this.createNotification(
      submission.authorId,
      NotificationType.WRITER,
      statusMessages.title,
      statusMessages.message,
      notificationData
    );
  }

  // Notify relevant reviewers about status changes
  private async notifyReviewers(submission: any, newStatus: TextSubmissionStatus, performedBy: any, additionalData?: any) {
    const reviewerNotifications: Array<{ userId: string; title: string; message: string; }> = [];
    const isResubmit = additionalData?.action === 'resubmit';

    switch (newStatus) {
      case TextSubmissionStatus.PENDING:
        // Notify admins/content admins about new or resubmitted story
        const admins = await this.getAdminsAndContentAdmins();
        reviewerNotifications.push(...admins.map(admin => ({
          userId: admin.id,
          title: isResubmit ? 'Story Resubmitted' : 'New Story Submission',
          message: isResubmit
            ? `"${submission.title}" by ${submission.author.name} has been revised and resubmitted for review.`
            : `"${submission.title}" by ${submission.author.name} is awaiting story manager assignment.`
        })));
        break;

      case TextSubmissionStatus.STORY_REVIEW:
        if (isResubmit) {
          // For resubmissions, notify assigned Story Manager with resubmit message
          if (submission.storyManagerId) {
            reviewerNotifications.push({
              userId: submission.storyManagerId,
              title: 'Story Revised and Resubmitted',
              message: `"${submission.title}" has been revised by ${submission.author.name} and is ready for your review.`
            });
          } else {
            // If no Story Manager assigned, notify all Story Managers
            const storyManagers = await this.getStoryManagers();
            reviewerNotifications.push(...storyManagers.map(sm => ({
              userId: sm.id,
              title: 'Story Revised and Resubmitted',
              message: `"${submission.title}" has been revised by ${submission.author.name} and needs review.`
            })));
          }
        } else {
          // Regular assignment notification
          if (submission.storyManagerId) {
            reviewerNotifications.push({
              userId: submission.storyManagerId,
              title: 'Story Review Assigned',
              message: `You've been assigned to review "${submission.title}" by ${submission.author.name}.`
            });
          }
        }
        break;

      case TextSubmissionStatus.FORMAT_REVIEW:
        if (submission.bookManagerId) {
          reviewerNotifications.push({
            userId: submission.bookManagerId,
            title: isResubmit ? 'Story Revised and Resubmitted' : 'Format Review Required',
            message: isResubmit
              ? `"${submission.title}" has been revised by ${submission.author.name} and is ready for format review.`
              : `"${submission.title}" needs format decision after story approval.`
          });
        }
        break;

      case TextSubmissionStatus.CONTENT_REVIEW:
        // Notify content admins for final review
        const contentAdmins = await this.getContentAdmins();
        reviewerNotifications.push(...contentAdmins.map(admin => ({
          userId: admin.id,
          title: isResubmit ? 'Story Revised and Resubmitted' : 'Final Review Required',
          message: isResubmit
            ? `"${submission.title}" has been revised by ${submission.author.name} and is ready for final review.`
            : `"${submission.title}" is ready for final approval and publishing.`
        })));
        break;
    }

    // Send all reviewer notifications
    for (const notification of reviewerNotifications) {
      await this.createNotification(
        notification.userId,
        NotificationType.ASSIGNMENT,
        notification.title,
        notification.message,
        {
          submissionId: submission.id,
          submissionTitle: submission.title,
          authorName: submission.author.name
        }
      );
    }
  }

  // Get user notification preferences
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        pushNotifications: true
      }
    });

    // Default preferences if profile not found
    return {
      emailEnabled: profile?.emailNotifications ?? true,
      pushEnabled: profile?.pushNotifications ?? true,
      statusChanges: true,
      feedback: true,
      deadlines: true,
      achievements: true
    };
  }

  // Send email notification via background queue
  private async sendEmailNotification(userId: string, notification: any, data?: NotificationData) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user?.email) return;

      const emailTemplate = this.getEmailTemplate(notification.type, notification.title, notification.message, data);

      // Queue email instead of sending synchronously
      await queueEmailNotification({
        to: user.email,
        name: user.name || 'Writer',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });

      logger.info(`[NotificationService] Email queued for ${user.email}`);
    } catch (error) {
      logger.error('Error queueing email notification', error);
    }
  }

  // Get status change messages
  private getStatusMessages(
    oldStatus: TextSubmissionStatus,
    newStatus: TextSubmissionStatus,
    reviewerName?: string
  ): { title: string; message: string } {
    const reviewer = reviewerName ? ` by ${reviewerName}` : '';

    switch (newStatus) {
      case TextSubmissionStatus.PENDING:
        return {
          title: 'Story Submitted Successfully',
          message: 'Your story has been submitted and is awaiting review assignment. We\'ll notify you once a reviewer is assigned.'
        };

      case TextSubmissionStatus.STORY_REVIEW:
        return {
          title: 'Story Review Started',
          message: `Your story is now under review${reviewer}. The review typically takes 2-3 business days.`
        };

      case TextSubmissionStatus.NEEDS_REVISION:
        return {
          title: 'Revision Requested',
          message: `Your story needs some revisions${reviewer}. Please check the feedback and resubmit when ready.`
        };

      case TextSubmissionStatus.STORY_APPROVED:
        return {
          title: 'Story Approved!',
          message: `Great news! Your story has been approved${reviewer} and is moving to format review.`
        };

      case TextSubmissionStatus.FORMAT_REVIEW:
        return {
          title: 'Format Review in Progress',
          message: `Your story is being reviewed for publication format${reviewer}. We're deciding the best way to present your story.`
        };

      case TextSubmissionStatus.CONTENT_REVIEW:
        return {
          title: 'Final Review Stage',
          message: `Your story is in final review${reviewer}! We're preparing it for publication.`
        };

      case TextSubmissionStatus.APPROVED:
        return {
          title: 'Story Ready for Publication',
          message: `Congratulations! Your story has been approved${reviewer} and is being prepared for publication.`
        };

      case TextSubmissionStatus.PUBLISHED:
        return {
          title: 'Story Published! 🎉',
          message: `Amazing! Your story is now live and available to readers worldwide. Thank you for your contribution!`
        };

      case TextSubmissionStatus.REJECTED:
        return {
          title: 'Story Status Update',
          message: `Your story submission has been declined${reviewer}. Please check the feedback for details on how to improve and resubmit.`
        };

      default:
        return {
          title: 'Story Status Updated',
          message: `Your story status has been updated to ${newStatus.toLowerCase().replace('_', ' ')}.`
        };
    }
  }

  // Get next steps for each status
  private getNextSteps(status: TextSubmissionStatus): string[] {
    switch (status) {
      case TextSubmissionStatus.PENDING:
        return ['Wait for reviewer assignment', 'Check your dashboard for updates'];

      case TextSubmissionStatus.STORY_REVIEW:
        return ['Your story is being reviewed', 'Estimated review time: 2-3 business days'];

      case TextSubmissionStatus.NEEDS_REVISION:
        return ['Review the feedback carefully', 'Make the suggested changes', 'Resubmit your story'];

      case TextSubmissionStatus.STORY_APPROVED:
        return ['Your story is moving to format review', 'No action needed from you'];

      case TextSubmissionStatus.FORMAT_REVIEW:
        return ['Format decision in progress', 'Images and layout being determined'];

      case TextSubmissionStatus.CONTENT_REVIEW:
        return ['Final review in progress', 'Publication preparation underway'];

      case TextSubmissionStatus.PUBLISHED:
        return ['Share your published story!', 'Start writing your next story'];

      case TextSubmissionStatus.REJECTED:
        return ['Review the feedback', 'Consider the suggestions', 'You can submit a new improved version'];

      default:
        return [];
    }
  }

  // Check if email should be sent for this notification type
  private shouldSendEmailForType(type: NotificationType, preferences: NotificationPreferences): boolean {
    switch (type) {
      case NotificationType.WRITER:
        return preferences.statusChanges;
      case NotificationType.ASSIGNMENT:
        return preferences.statusChanges;
      case NotificationType.ACHIEVEMENT:
        return preferences.achievements;
      default:
        return true;
    }
  }

  // Get email template for notification
  private getEmailTemplate(
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ): { subject: string; html: string; text: string } {
    const subject = `1001 Stories - ${title}`;

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; font-size: 24px; margin: 0;">1001 Stories</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Empowering Young Voices</p>
          </div>

          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">${title}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${message}</p>
    `;

    if (data?.feedback) {
      html += `
        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #0c4a6e; font-size: 16px; margin: 0 0 8px 0;">Feedback</h3>
          <p style="color: #0c4a6e; margin: 0; font-style: italic;">"${data.feedback}"</p>
        </div>
      `;
    }

    if (data?.nextSteps && data.nextSteps.length > 0) {
      html += `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #15803d; font-size: 16px; margin: 0 0 12px 0;">Next Steps</h3>
          <ul style="color: #15803d; margin: 0; padding-left: 20px;">
      `;

      data.nextSteps.forEach(step => {
        html += `<li style="margin-bottom: 4px;">${step}</li>`;
      });

      html += `
          </ul>
        </div>
      `;
    }

    html += `
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/writer" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">View Dashboard</a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              You're receiving this because you're a writer at 1001 Stories.<br>
              <a href="${process.env.NEXTAUTH_URL}/profile/notifications" style="color: #6b7280;">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `${title}\n\n${message}${data?.feedback ? `\n\nFeedback: "${data.feedback}"` : ''}${data?.nextSteps ? `\n\nNext Steps:\n${data.nextSteps.map(step => `• ${step}`).join('\n')}` : ''}\n\nView your dashboard: ${process.env.NEXTAUTH_URL}/dashboard/writer`;

    return { subject, html, text };
  }

  // Helper methods to get user roles
  private async getAdminsAndContentAdmins() {
    return await prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.CONTENT_ADMIN] }
      },
      select: { id: true, name: true, email: true }
    });
  }

  private async getContentAdmins() {
    return await prisma.user.findMany({
      where: { role: UserRole.CONTENT_ADMIN },
      select: { id: true, name: true, email: true }
    });
  }

  private async getStoryManagers() {
    return await prisma.user.findMany({
      where: { role: UserRole.STORY_MANAGER },
      select: { id: true, name: true, email: true }
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId // Ensure user can only mark their own notifications as read
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read', error);
      throw error;
    }
  }

  // Get notifications for user
  async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, read: false }
      });

      return { notifications, unreadCount };
    } catch (error) {
      logger.error('Error getting notifications', error);
      throw error;
    }
  }
}