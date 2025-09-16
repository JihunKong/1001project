/**
 * Notification Service for Publishing Workflow
 * Handles email notifications, SLA reminders, and webhook integrations
 */

import { UserRole } from '@prisma/client';
import { PublishingStatus } from './status-transitions';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export interface TransitionNotificationData {
  bookId: string;
  fromStatus: PublishingStatus;
  toStatus: PublishingStatus;
  actorId: string;
  reason?: string;
}

export interface SLAReminderData {
  bookId: string;
  type: 'REVIEW_OVERDUE' | 'REVISION_OVERDUE';
  deadlineHours?: number;
  deadlineDays?: number;
  recipients?: UserRole[];
  authorEmail?: string;
}

export interface NotificationQueue {
  id: string;
  type: 'TRANSITION' | 'SLA_REMINDER' | 'WEBHOOK';
  data: any;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface WebhookPayload {
  event: string;
  bookId: string;
  timestamp: Date;
  data: any;
}

export class NotificationService {
  private queue: NotificationQueue[] = [];
  private webhookEndpoints: string[] = [];
  private retryDelays = [1000, 5000, 15000, 60000]; // 1s, 5s, 15s, 1m

  constructor(webhookEndpoints: string[] = []) {
    this.webhookEndpoints = webhookEndpoints;
    this.startQueueProcessor();
  }

  /**
   * Send notification for status transition
   */
  async sendTransitionNotification(data: TransitionNotificationData): Promise<void> {
    try {
      // Get book and author details
      const book = await prisma.book.findUnique({
        where: { id: data.bookId },
        include: {
          author: { select: { name: true, email: true, role: true } }
        }
      });

      if (!book) {
        console.error(`Book ${data.bookId} not found for notification`);
        return;
      }

      // Get actor details
      const actor = await prisma.user.findUnique({
        where: { id: data.actorId },
        select: { name: true, email: true, role: true }
      });

      // Send notification based on transition
      await this.handleTransitionNotification(book, actor, data);

      // Send webhook notifications
      await this.sendWebhookNotification({
        event: 'book.status_changed',
        bookId: data.bookId,
        timestamp: new Date(),
        data: {
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          actorId: data.actorId,
          reason: data.reason
        }
      });

    } catch (error) {
      console.error('Failed to send transition notification:', error);
      this.queueNotification({
        type: 'TRANSITION',
        data,
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date()
      });
    }
  }

  /**
   * Send SLA reminder notifications
   */
  async sendSLAReminder(data: SLAReminderData): Promise<void> {
    try {
      const book = await prisma.book.findUnique({
        where: { id: data.bookId },
        include: {
          author: { select: { name: true, email: true, role: true } }
        }
      });

      if (!book) {
        console.error(`Book ${data.bookId} not found for SLA reminder`);
        return;
      }

      if (data.type === 'REVIEW_OVERDUE') {
        await this.sendReviewOverdueReminder(book, data);
      } else if (data.type === 'REVISION_OVERDUE') {
        await this.sendRevisionOverdueReminder(book, data);
      }

    } catch (error) {
      console.error('Failed to send SLA reminder:', error);
      this.queueNotification({
        type: 'SLA_REMINDER',
        data,
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date()
      });
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(payload: WebhookPayload): Promise<void> {
    for (const endpoint of this.webhookEndpoints) {
      this.queueNotification({
        type: 'WEBHOOK',
        data: { endpoint, payload },
        retryCount: 0,
        maxRetries: 4,
        scheduledAt: new Date()
      });
    }
  }

  private async handleTransitionNotification(
    book: any,
    actor: any,
    data: TransitionNotificationData
  ): Promise<void> {
    const bookTitle = book.title || 'Untitled';
    const authorName = book.author?.name || 'Unknown Author';
    const actorName = actor?.name || 'Unknown User';

    switch (data.toStatus) {
      case PublishingStatus.PENDING:
        // Notify reviewers that a new submission is ready
        await this.notifyReviewers(book, 'NEW_SUBMISSION');
        
        // Notify author that submission was received
        if (book.author?.email) {
          await sendEmail({
            to: book.author.email,
            subject: `Submission Received: ${bookTitle}`,
            html: this.getSubmissionReceivedTemplate(bookTitle, authorName)
          });
        }
        break;

      case PublishingStatus.APPROVED:
        // Notify author of approval
        if (book.author?.email) {
          await sendEmail({
            to: book.author.email,
            subject: `Story Approved: ${bookTitle}`,
            html: this.getApprovalTemplate(bookTitle, authorName, actorName)
          });
        }
        
        // Notify content admins for final review
        await this.notifyContentAdmins(book, 'READY_FOR_PUBLICATION');
        break;

      case PublishingStatus.PUBLISHED:
        // Notify author of publication
        if (book.author?.email) {
          await sendEmail({
            to: book.author.email,
            subject: `Congratulations! Your story "${bookTitle}" is now published`,
            html: this.getPublicationTemplate(bookTitle, authorName, book.id)
          });
        }
        
        // Notify interested parties
        await this.notifyPublication(book);
        break;

      case PublishingStatus.NEEDS_REVISION:
        // Notify author of revision request
        if (book.author?.email) {
          await sendEmail({
            to: book.author.email,
            subject: `Revision Requested: ${bookTitle}`,
            html: this.getRevisionRequestTemplate(
              bookTitle, 
              authorName, 
              actorName, 
              data.reason || 'Please review and revise your submission.'
            )
          });
        }
        break;

      case PublishingStatus.ARCHIVED:
        // Notify stakeholders of archival
        if (book.author?.email) {
          await sendEmail({
            to: book.author.email,
            subject: `Story Archived: ${bookTitle}`,
            html: this.getArchivalTemplate(bookTitle, authorName, data.reason)
          });
        }
        break;
    }
  }

  private async notifyReviewers(book: any, notificationType: string): Promise<void> {
    // Get users with reviewer roles
    const reviewers = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER] }
      },
      select: { email: true, name: true, role: true }
    });

    const subject = `New Submission Ready for Review: ${book.title}`;
    const template = this.getReviewerNotificationTemplate(book, notificationType);

    for (const reviewer of reviewers) {
      if (reviewer.email) {
        await sendEmail({
          to: reviewer.email,
          subject,
          html: template
        });
      }
    }
  }

  private async notifyContentAdmins(book: any, notificationType: string): Promise<void> {
    const contentAdmins = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.CONTENT_ADMIN, UserRole.ADMIN] }
      },
      select: { email: true, name: true }
    });

    const subject = `Ready for Publication: ${book.title}`;
    const template = this.getContentAdminNotificationTemplate(book, notificationType);

    for (const admin of contentAdmins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject,
          html: template
        });
      }
    }
  }

  private async notifyPublication(book: any): Promise<void> {
    // Notify teachers and content managers about new published content
    const stakeholders = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.TEACHER, UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER] }
      },
      select: { email: true, name: true }
    });

    const subject = `New Story Published: ${book.title}`;
    const template = this.getPublicationNotificationTemplate(book);

    for (const stakeholder of stakeholders) {
      if (stakeholder.email) {
        await sendEmail({
          to: stakeholder.email,
          subject,
          html: template
        });
      }
    }
  }

  private async sendReviewOverdueReminder(book: any, data: SLAReminderData): Promise<void> {
    const reviewers = await prisma.user.findMany({
      where: {
        role: { in: data.recipients || [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER] }
      },
      select: { email: true, name: true }
    });

    const subject = `Review Overdue: ${book.title} (${data.deadlineHours}h exceeded)`;
    const template = this.getReviewOverdueTemplate(book, data.deadlineHours || 48);

    for (const reviewer of reviewers) {
      if (reviewer.email) {
        await sendEmail({
          to: reviewer.email,
          subject,
          html: template,
          priority: 'high'
        });
      }
    }
  }

  private async sendRevisionOverdueReminder(book: any, data: SLAReminderData): Promise<void> {
    if (data.authorEmail || book.author?.email) {
      const email = data.authorEmail || book.author.email;
      const subject = `Revision Reminder: ${book.title} (${data.deadlineDays} days)`;
      const template = this.getRevisionOverdueTemplate(book, data.deadlineDays || 7);

      await sendEmail({
        to: email,
        subject,
        html: template
      });
    }
  }

  private queueNotification(notification: Omit<NotificationQueue, 'id'>): void {
    this.queue.push({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...notification
    });
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      await this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  private async processQueue(): Promise<void> {
    const now = new Date();
    const readyNotifications = this.queue.filter(n => 
      !n.processedAt && n.scheduledAt <= now
    );

    for (const notification of readyNotifications) {
      try {
        await this.processNotification(notification);
        notification.processedAt = new Date();
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
        notification.error = error instanceof Error ? error.message : 'Unknown error';
        notification.retryCount++;

        if (notification.retryCount < notification.maxRetries) {
          // Schedule retry with exponential backoff
          const delay = this.retryDelays[Math.min(notification.retryCount - 1, this.retryDelays.length - 1)];
          notification.scheduledAt = new Date(now.getTime() + delay);
        }
      }
    }

    // Clean up processed notifications (keep for 1 hour for debugging)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    this.queue = this.queue.filter(n => 
      !n.processedAt || n.processedAt > oneHourAgo
    );
  }

  private async processNotification(notification: NotificationQueue): Promise<void> {
    switch (notification.type) {
      case 'TRANSITION':
        await this.sendTransitionNotification(notification.data);
        break;
      case 'SLA_REMINDER':
        await this.sendSLAReminder(notification.data);
        break;
      case 'WEBHOOK':
        await this.sendWebhook(notification.data.endpoint, notification.data.payload);
        break;
    }
  }

  private async sendWebhook(endpoint: string, payload: WebhookPayload): Promise<void> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '1001Stories-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  // Email templates
  private getSubmissionReceivedTemplate(bookTitle: string, authorName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Submission Received!</h2>
        <p>Dear ${authorName},</p>
        <p>Thank you for submitting your story <strong>"${bookTitle}"</strong> to 1001 Stories.</p>
        <p>Your submission is now in our review queue and will be reviewed by our editorial team within 48 hours.</p>
        <p>We'll notify you once the review is complete.</p>
        <p>Best regards,<br>The 1001 Stories Team</p>
      </div>
    `;
  }

  private getApprovalTemplate(bookTitle: string, authorName: string, reviewerName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Story Approved!</h2>
        <p>Dear ${authorName},</p>
        <p>Great news! Your story <strong>"${bookTitle}"</strong> has been approved by ${reviewerName}.</p>
        <p>Your story is now moving to the final publication stage and will be available in our library soon.</p>
        <p>Congratulations on this achievement!</p>
        <p>Best regards,<br>The 1001 Stories Team</p>
      </div>
    `;
  }

  private getPublicationTemplate(bookTitle: string, authorName: string, bookId: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Your Story is Published!</h2>
        <p>Dear ${authorName},</p>
        <p>Congratulations! Your story <strong>"${bookTitle}"</strong> is now live and available in the 1001 Stories library.</p>
        <p>Students and teachers around the world can now read and enjoy your story.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/books/${bookId}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Your Published Story</a></p>
        <p>Thank you for contributing to global education and literacy!</p>
        <p>Best regards,<br>The 1001 Stories Team</p>
      </div>
    `;
  }

  private getRevisionRequestTemplate(
    bookTitle: string, 
    authorName: string, 
    reviewerName: string, 
    reason: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Revision Requested</h2>
        <p>Dear ${authorName},</p>
        <p>${reviewerName} has reviewed your story <strong>"${bookTitle}"</strong> and has requested some revisions.</p>
        <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin-top: 0;">Feedback:</h3>
          <p>${reason}</p>
        </div>
        <p>Please log in to your account to review the feedback and make the necessary changes.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
        <p>Best regards,<br>The 1001 Stories Team</p>
      </div>
    `;
  }

  private getArchivalTemplate(bookTitle: string, authorName: string, reason?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">Story Archived</h2>
        <p>Dear ${authorName},</p>
        <p>Your story <strong>"${bookTitle}"</strong> has been archived.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have questions about this decision, please contact our support team.</p>
        <p>Best regards,<br>The 1001 Stories Team</p>
      </div>
    `;
  }

  private getReviewerNotificationTemplate(book: any, type: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Submission Ready for Review</h2>
        <p>A new story submission is ready for your review:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 6px;">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.authorName}</p>
          <p><strong>Category:</strong> ${book.category?.join(', ') || 'Not specified'}</p>
          <p><strong>Age Range:</strong> ${book.ageRange || 'Not specified'}</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/review/${book.id}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Now</a></p>
      </div>
    `;
  }

  private getContentAdminNotificationTemplate(book: any, type: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Ready for Publication</h2>
        <p>The following story has been approved and is ready for publication:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 6px;">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.authorName}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/publish/${book.id}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Publish Now</a></p>
      </div>
    `;
  }

  private getPublicationNotificationTemplate(book: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">New Story Published</h2>
        <p>A new story has been published and is now available in the library:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 6px;">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.authorName}</p>
          <p><strong>Categories:</strong> ${book.category?.join(', ') || 'General'}</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}/books/${book.id}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Story</a></p>
      </div>
    `;
  }

  private getReviewOverdueTemplate(book: any, deadlineHours: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⏰ Review Overdue</h2>
        <p>The following submission has exceeded the ${deadlineHours}-hour review deadline:</p>
        <div style="background: #fee2e2; padding: 16px; border-radius: 6px;">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.authorName}</p>
          <p><strong>Submitted:</strong> ${new Date(book.createdAt).toLocaleDateString()}</p>
        </div>
        <p>Please prioritize this review to maintain our service level agreement.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/review/${book.id}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Now</a></p>
      </div>
    `;
  }

  private getRevisionOverdueTemplate(book: any, deadlineDays: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Revision Reminder</h2>
        <p>Your story revision has been pending for ${deadlineDays} days:</p>
        <div style="background: #fef3c7; padding: 16px; border-radius: 6px;">
          <h3>${book.title}</h3>
          <p><strong>Last Updated:</strong> ${new Date(book.updatedAt).toLocaleDateString()}</p>
        </div>
        <p>Please log in to complete your revisions. If you need help, don't hesitate to reach out to our support team.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Complete Revision</a></p>
      </div>
    `;
  }
}