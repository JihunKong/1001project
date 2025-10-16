import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    });
  }

  // Send notification email
  async sendNotificationEmail(
    to: string,
    recipientName: string,
    subject: string,
    html: string,
    text: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: '1001 Stories',
          address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'noreply@1001stories.org'
        },
        to,
        subject,
        html,
        text,
        headers: {
          'X-Category': 'notification',
          'X-Priority': '3'
        }
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Notification email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  }

  // Send status change email with rich formatting
  async sendStatusChangeEmail(
    to: string,
    recipientName: string,
    submissionTitle: string,
    oldStatus: string,
    newStatus: string,
    feedback?: string,
    nextSteps?: string[]
  ): Promise<void> {
    const subject = `Story Update: "${submissionTitle}" - ${this.getStatusDisplayName(newStatus)}`;

    const html = this.createStatusChangeEmailHTML({
      recipientName,
      submissionTitle,
      oldStatus,
      newStatus,
      feedback,
      nextSteps
    });

    const text = this.createStatusChangeEmailText({
      recipientName,
      submissionTitle,
      oldStatus,
      newStatus,
      feedback,
      nextSteps
    });

    await this.sendNotificationEmail(to, recipientName, subject, html, text);
  }

  // Send reviewer assignment email
  async sendReviewerAssignmentEmail(
    to: string,
    reviewerName: string,
    submissionTitle: string,
    authorName: string,
    reviewType: string,
    dueDate?: string
  ): Promise<void> {
    const subject = `New ${reviewType} Assignment: "${submissionTitle}"`;

    const html = this.createReviewerAssignmentEmailHTML({
      reviewerName,
      submissionTitle,
      authorName,
      reviewType,
      dueDate
    });

    const text = this.createReviewerAssignmentEmailText({
      reviewerName,
      submissionTitle,
      authorName,
      reviewType,
      dueDate
    });

    await this.sendNotificationEmail(to, reviewerName, subject, html, text);
  }

  // Send digest email with multiple notifications
  async sendDigestEmail(
    to: string,
    recipientName: string,
    notifications: any[],
    period: 'daily' | 'weekly'
  ): Promise<void> {
    const subject = `Your ${period} 1001 Stories digest - ${notifications.length} updates`;

    const html = this.createDigestEmailHTML(recipientName, notifications, period);
    const text = this.createDigestEmailText(recipientName, notifications, period);

    await this.sendNotificationEmail(to, recipientName, subject, html, text);
  }

  // Create status change email HTML
  private createStatusChangeEmailHTML(data: {
    recipientName: string;
    submissionTitle: string;
    oldStatus: string;
    newStatus: string;
    feedback?: string;
    nextSteps?: string[];
  }): string {
    const statusColor = this.getStatusColor(data.newStatus);
    const statusIcon = this.getStatusIcon(data.newStatus);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Story Status Update</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; font-size: 28px; margin: 0; font-weight: bold;">1001 Stories</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Empowering Young Voices</p>
              </div>
            </div>

            <!-- Main Content -->
            <div style="background: white; border-radius: 0 0 12px 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Greeting -->
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 24px 0;">Hello ${data.recipientName}! ${statusIcon}</h2>

              <!-- Status Update Card -->
              <div style="background: ${statusColor}10; border-left: 4px solid ${statusColor}; padding: 24px; margin: 24px 0; border-radius: 8px;">
                <h3 style="color: ${statusColor}; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;">
                  "${data.submissionTitle}"
                </h3>
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                  <span style="background: #e5e7eb; color: #6b7280; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-right: 12px;">
                    ${this.getStatusDisplayName(data.oldStatus)}
                  </span>
                  <span style="color: #6b7280; margin: 0 12px;">→</span>
                  <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                    ${this.getStatusDisplayName(data.newStatus)}
                  </span>
                </div>
                <p style="color: #4b5563; margin: 0; font-size: 16px; line-height: 1.6;">
                  ${this.getStatusMessage(data.newStatus)}
                </p>
              </div>

              <!-- Feedback Section -->
              ${data.feedback ? `
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0; border-radius: 8px;">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <div style="width: 24px; height: 24px; background: #0ea5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                      <span style="color: white; font-size: 12px; font-weight: bold;">💬</span>
                    </div>
                    <h4 style="color: #0c4a6e; font-size: 16px; margin: 0; font-weight: 600;">Feedback from Reviewer</h4>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 6px; border-left: 3px solid #0ea5e9;">
                    <p style="color: #0c4a6e; margin: 0; font-style: italic; line-height: 1.6;">
                      "${data.feedback}"
                    </p>
                  </div>
                </div>
              ` : ''}

              <!-- Next Steps -->
              ${data.nextSteps && data.nextSteps.length > 0 ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 24px 0; border-radius: 8px;">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="width: 24px; height: 24px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                      <span style="color: white; font-size: 12px;">✓</span>
                    </div>
                    <h4 style="color: #15803d; font-size: 16px; margin: 0; font-weight: 600;">What's Next?</h4>
                  </div>
                  <ul style="color: #15803d; margin: 0; padding-left: 0; list-style: none;">
                    ${data.nextSteps.map(step => `
                      <li style="margin-bottom: 8px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; top: 2px; width: 16px; height: 16px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">→</span>
                        ${step}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 36px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard/writer"
                   style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25); transition: transform 0.2s ease;">
                  View Your Dashboard
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 36px;">
                <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 16px 0;">
                  Thank you for being part of the 1001 Stories community! Every story you write helps inspire young readers around the world.
                </p>
                <div style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL}/profile/notifications" style="color: #6b7280; font-size: 12px; text-decoration: underline;">
                    Manage notification preferences
                  </a>
                  <span style="color: #d1d5db; margin: 0 8px;">|</span>
                  <a href="${process.env.NEXTAUTH_URL}/unsubscribe" style="color: #6b7280; font-size: 12px; text-decoration: underline;">
                    Unsubscribe
                  </a>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Create status change email text version
  private createStatusChangeEmailText(data: {
    recipientName: string;
    submissionTitle: string;
    oldStatus: string;
    newStatus: string;
    feedback?: string;
    nextSteps?: string[];
  }): string {
    let text = `Hello ${data.recipientName}!\n\n`;
    text += `Your story "${data.submissionTitle}" has been updated:\n`;
    text += `${this.getStatusDisplayName(data.oldStatus)} → ${this.getStatusDisplayName(data.newStatus)}\n\n`;
    text += `${this.getStatusMessage(data.newStatus)}\n`;

    if (data.feedback) {
      text += `\nFeedback from Reviewer:\n"${data.feedback}"\n`;
    }

    if (data.nextSteps && data.nextSteps.length > 0) {
      text += `\nWhat's Next?\n`;
      data.nextSteps.forEach((step, index) => {
        text += `${index + 1}. ${step}\n`;
      });
    }

    text += `\nView your dashboard: ${process.env.NEXTAUTH_URL}/dashboard/writer\n\n`;
    text += `Thank you for being part of the 1001 Stories community!\n`;
    text += `\nManage notification preferences: ${process.env.NEXTAUTH_URL}/profile/notifications`;

    return text;
  }

  // Create reviewer assignment email HTML
  private createReviewerAssignmentEmailHTML(data: {
    reviewerName: string;
    submissionTitle: string;
    authorName: string;
    reviewType: string;
    dueDate?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 24px 0;">Hello ${data.reviewerName}!</h2>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 24px; margin: 24px 0; border-radius: 8px;">
                <h3 style="color: #92400e; font-size: 18px; margin: 0 0 12px 0;">New ${data.reviewType} Assignment</h3>
                <p style="color: #92400e; margin: 0; font-size: 16px;">
                  You've been assigned to review "${data.submissionTitle}" by ${data.authorName}.
                </p>
                ${data.dueDate ? `
                  <p style="color: #92400e; margin: 12px 0 0 0; font-weight: 600;">
                    Due Date: ${data.dueDate}
                  </p>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 36px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard"
                   style="display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Start Review
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Create reviewer assignment email text
  private createReviewerAssignmentEmailText(data: {
    reviewerName: string;
    submissionTitle: string;
    authorName: string;
    reviewType: string;
    dueDate?: string;
  }): string {
    let text = `Hello ${data.reviewerName}!\n\n`;
    text += `You've been assigned a new ${data.reviewType.toLowerCase()} review:\n`;
    text += `Story: "${data.submissionTitle}"\n`;
    text += `Author: ${data.authorName}\n`;
    if (data.dueDate) {
      text += `Due Date: ${data.dueDate}\n`;
    }
    text += `\nStart review: ${process.env.NEXTAUTH_URL}/dashboard\n`;
    return text;
  }

  // Create digest email HTML
  private createDigestEmailHTML(recipientName: string, notifications: any[], period: string): string {
    const notificationItems = notifications.map(notif => `
      <div style="border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
        <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 8px 0;">${notif.title}</h4>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">${notif.message}</p>
        <small style="color: #9ca3af; font-size: 12px;">${new Date(notif.createdAt).toLocaleDateString()}</small>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; padding: 40px; border-radius: 12px;">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 24px 0;">
                Your ${period} digest, ${recipientName}
              </h2>
              <p style="color: #6b7280; margin: 0 0 24px 0;">
                Here's what happened with your stories this ${period}.
              </p>
              <div>
                ${notificationItems}
              </div>
              <div style="text-align: center; margin: 36px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard/writer"
                   style="background: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px;">
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Create digest email text
  private createDigestEmailText(recipientName: string, notifications: any[], period: string): string {
    let text = `Your ${period} digest, ${recipientName}\n\n`;
    text += `Here's what happened with your stories this ${period}:\n\n`;

    notifications.forEach((notif, index) => {
      text += `${index + 1}. ${notif.title}\n`;
      text += `   ${notif.message}\n`;
      text += `   ${new Date(notif.createdAt).toLocaleDateString()}\n\n`;
    });

    text += `View your dashboard: ${process.env.NEXTAUTH_URL}/dashboard/writer\n`;
    return text;
  }

  // Helper methods for email formatting
  private getStatusDisplayName(status: string): string {
    const statusNames: { [key: string]: string } = {
      'DRAFT': 'Draft',
      'PENDING': 'Awaiting Review',
      'STORY_REVIEW': 'Story Review',
      'NEEDS_REVISION': 'Needs Revision',
      'STORY_APPROVED': 'Story Approved',
      'FORMAT_REVIEW': 'Format Review',
      'CONTENT_REVIEW': 'Final Review',
      'APPROVED': 'Approved',
      'PUBLISHED': 'Published',
      'REJECTED': 'Not Approved'
    };
    return statusNames[status] || status.toLowerCase().replace('_', ' ');
  }

  private getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'DRAFT': '#6b7280',
      'PENDING': '#f59e0b',
      'STORY_REVIEW': '#3b82f6',
      'NEEDS_REVISION': '#ef4444',
      'STORY_APPROVED': '#10b981',
      'FORMAT_REVIEW': '#8b5cf6',
      'CONTENT_REVIEW': '#06b6d4',
      'APPROVED': '#16a34a',
      'PUBLISHED': '#059669',
      'REJECTED': '#dc2626'
    };
    return colors[status] || '#6b7280';
  }

  private getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'DRAFT': '✏️',
      'PENDING': '⏳',
      'STORY_REVIEW': '👀',
      'NEEDS_REVISION': '✏️',
      'STORY_APPROVED': '✅',
      'FORMAT_REVIEW': '🎨',
      'CONTENT_REVIEW': '🔍',
      'APPROVED': '🎉',
      'PUBLISHED': '📚',
      'REJECTED': '💭'
    };
    return icons[status] || '📄';
  }

  private getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      'PENDING': 'Your story has been submitted and is awaiting reviewer assignment.',
      'STORY_REVIEW': 'Your story is currently being reviewed for content and quality.',
      'NEEDS_REVISION': 'Your story needs some improvements. Check the feedback and resubmit when ready.',
      'STORY_APPROVED': 'Great news! Your story has been approved and is moving to the next stage.',
      'FORMAT_REVIEW': 'Your story is being reviewed for the best publication format.',
      'CONTENT_REVIEW': 'Your story is in final review before publication!',
      'APPROVED': 'Congratulations! Your story has been approved for publication.',
      'PUBLISHED': 'Amazing! Your story is now live and available to readers worldwide.',
      'REJECTED': 'Your story needs more work before it can be published. Don\'t give up - use the feedback to improve!'
    };
    return messages[status] || 'Your story status has been updated.';
  }
}