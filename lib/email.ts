import nodemailer from 'nodemailer'
import { isEmailServiceConfigured } from './auth-demo'

// Create reusable transporter only if email service is configured
const createTransporter = () => {
  if (!isEmailServiceConfigured()) {
    console.warn('Email service not configured. Emails will not be sent.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587'),
    secure: (process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT) === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_SERVER_USER,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

// Email templates
const getVerificationEmailHtml = (url: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email - 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
          }
          .link {
            color: #6366f1;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📚 1001 Stories</div>
          <div class="content">
            <h1>Verify your email address</h1>
            <p>Welcome to 1001 Stories! Click the button below to verify your email address and start your learning journey.</p>
            <a href="${url}" class="button">Verify Email</a>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Or copy and paste this link in your browser:
            </p>
            <p class="link">${url}</p>
            <div class="footer">
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with 1001 Stories, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

const getWelcomeEmailHtml = (name: string, role: string) => {
  const roleMessages = {
    LEARNER: "Ready to explore amazing stories from around the world? Your learning journey starts now!",
    TEACHER: "Welcome to our educator community! You can now create classrooms and manage student progress.",
    INSTITUTION: "Thank you for partnering with us! Let's make education accessible together.",
    VOLUNTEER: "Welcome to our volunteer family! Your contributions will help children worldwide.",
    ADMIN: "Welcome aboard! You have full access to manage the platform."
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
            text-align: left;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 20px;
            text-align: center;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .feature {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📚 1001 Stories</div>
          <div class="content">
            <h1>Welcome${name ? `, ${name}` : ''}! 🎉</h1>
            <p>${roleMessages[role as keyof typeof roleMessages] || roleMessages.LEARNER}</p>
            
            <h2 style="margin-top: 30px;">What you can do now:</h2>
            <div class="feature">
              <strong>📖 Explore Stories</strong><br>
              Discover amazing stories from children around the world
            </div>
            <div class="feature">
              <strong>🎯 Track Progress</strong><br>
              Monitor your learning journey with personalized dashboards
            </div>
            <div class="feature">
              <strong>🌍 Join Community</strong><br>
              Connect with learners and educators globally
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <div class="footer">
              <p>Need help? Visit our <a href="${process.env.NEXTAUTH_URL}/help" style="color: #6366f1;">Help Center</a></p>
              <p>Follow us on social media for updates and new stories!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Send verification email
export async function sendVerificationEmail(email: string, url: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`[Email Service Disabled] Magic link for ${email}:`);
    console.log(url);
    console.log('To enable email sending, configure SMTP settings in .env.local');
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: email,
      subject: "Verify your email - 1001 Stories",
      html: getVerificationEmailHtml(url),
    })

    console.log("Verification email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending verification email:", error)
    console.log(`Fallback - Magic link for ${email}: ${url}`);
    throw new Error("Failed to send verification email")
  }
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string, role: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`[Email Service Disabled] Welcome email would be sent to ${email}`);
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: email,
      subject: "Welcome to 1001 Stories! 🎉",
      html: getWelcomeEmailHtml(name, role),
    })

    console.log("Welcome email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, message: 'Failed to send welcome email' };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, url: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`[Email Service Disabled] Password reset link for ${email}:`);
    console.log(url);
    return { success: false, message: 'Email service not configured' };
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password - 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 20px;">
            📚 1001 Stories
          </div>
          <div class="content">
            <h1>Reset your password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${url}" class="button">Reset Password</a>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This link will expire in 1 hour for security reasons.
            </p>
            <p style="font-size: 14px; color: #666;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: email,
      subject: "Reset your password - 1001 Stories",
      html,
    })

    console.log("Password reset email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    console.log(`Fallback - Password reset link for ${email}: ${url}`);
    return { success: false, message: 'Failed to send password reset email' };
  }
}

// Send program application confirmation email
export async function sendProgramApplicationConfirmationEmail(
  email: string, 
  name: string, 
  programType: string,
  applicationId: string
) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`[Email Service Disabled] Program application confirmation would be sent to ${email}`);
    return { success: false, message: 'Email service not configured' };
  }

  const programLabels = {
    PARTNERSHIP_NETWORK: 'Partnership Network',
    ENGLISH_EDUCATION: 'English Education',
    MENTORSHIP: 'Mentorship Program'
  };

  const programLabel = programLabels[programType as keyof typeof programLabels] || programType;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Application Received - 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
            text-align: left;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #6366f1;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .timeline-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            align-items: center;
          }
          .timeline-number {
            background: #6366f1;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            font-size: 12px;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📚 1001 Stories</div>
          <div class="content">
            <h1>Application Received Successfully! ✅</h1>
            <p>Dear ${name},</p>
            <p>Thank you for applying to our <strong>${programLabel}</strong> program. Your application has been received and is now under review.</p>
            
            <div class="info-box">
              <strong>Application Details:</strong><br>
              Program: ${programLabel}<br>
              Application ID: ${applicationId}<br>
              Submitted: ${new Date().toLocaleDateString()}
            </div>
            
            <h2 style="margin-top: 30px;">What happens next?</h2>
            
            <div class="timeline-item">
              <div class="timeline-number">1</div>
              <div>
                <strong>Review Process</strong><br>
                Our program team will carefully review your application and supporting documents.
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-number">2</div>
              <div>
                <strong>Initial Response</strong><br>
                You'll hear from us within 5-7 business days with an initial response.
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-number">3</div>
              <div>
                <strong>Next Steps</strong><br>
                Depending on our review, we may schedule an interview or request additional information.
              </div>
            </div>
            
            <p style="margin-top: 30px;">You can track your application status in your dashboard:</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Application Status</a>
            </div>
            
            <div class="footer">
              <p><strong>Questions?</strong> Feel free to contact our programs team at <a href="mailto:programs@1001stories.org" style="color: #6366f1;">programs@1001stories.org</a></p>
              <p>Thank you for your interest in joining our global community of changemakers!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories Programs" <programs@1001stories.org>',
      to: email,
      subject: `Application Received - ${programLabel} Program`,
      html,
    });

    console.log("Program application confirmation email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending program application confirmation email:", error);
    return { success: false, message: 'Failed to send confirmation email' };
  }
}

// Send program application status update email
export async function sendProgramApplicationStatusUpdateEmail(
  email: string,
  name: string,
  programType: string,
  oldStatus: string,
  newStatus: string,
  message?: string
) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`[Email Service Disabled] Program application status update would be sent to ${email}`);
    return { success: false, message: 'Email service not configured' };
  }

  const programLabels = {
    PARTNERSHIP_NETWORK: 'Partnership Network',
    ENGLISH_EDUCATION: 'English Education',
    MENTORSHIP: 'Mentorship Program'
  };

  const statusLabels = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    ADDITIONAL_INFO_REQUESTED: 'Additional Information Requested',
    INTERVIEW_SCHEDULED: 'Interview Scheduled',
    ACCEPTED: 'Accepted',
    REJECTED: 'Not Selected',
    WAITLISTED: 'Waitlisted',
    WITHDRAWN: 'Withdrawn'
  };

  const statusColors = {
    ACCEPTED: '#10b981',
    REJECTED: '#ef4444',
    INTERVIEW_SCHEDULED: '#8b5cf6',
    ADDITIONAL_INFO_REQUESTED: '#f59e0b',
    WAITLISTED: '#6366f1',
    UNDER_REVIEW: '#3b82f6',
    WITHDRAWN: '#6b7280'
  };

  const programLabel = programLabels[programType as keyof typeof programLabels] || programType;
  const statusLabel = statusLabels[newStatus as keyof typeof statusLabels] || newStatus;
  const statusColor = statusColors[newStatus as keyof typeof statusColors] || '#6366f1';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Application Update - 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
            text-align: left;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background-color: ${statusColor};
            color: white;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .message-box {
            background: #f8f9fa;
            border-left: 4px solid ${statusColor};
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📚 1001 Stories</div>
          <div class="content">
            <h1>Application Status Update</h1>
            <p>Dear ${name},</p>
            <p>We have an update regarding your application to the <strong>${programLabel}</strong> program.</p>
            
            <p>Your application status has been updated to:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge">${statusLabel}</span>
            </div>
            
            ${message ? `
              <div class="message-box">
                <strong>Message from our team:</strong><br>
                ${message}
              </div>
            ` : ''}
            
            ${newStatus === 'ACCEPTED' ? `
              <p>🎉 <strong>Congratulations!</strong> We're excited to welcome you to our program. You'll receive additional information about next steps and onboarding within the next few days.</p>
            ` : newStatus === 'REJECTED' ? `
              <p>While we were impressed with your application, we're unable to offer you a position in this program at this time. We encourage you to apply for future programs as they become available.</p>
            ` : newStatus === 'INTERVIEW_SCHEDULED' ? `
              <p>We'd like to learn more about you! Our team will be in touch soon to schedule an interview. Please keep an eye on your email for scheduling details.</p>
            ` : newStatus === 'ADDITIONAL_INFO_REQUESTED' ? `
              <p>To continue processing your application, we need some additional information from you. Please log in to your dashboard to see what's needed and submit the required information.</p>
            ` : newStatus === 'WAITLISTED' ? `
              <p>Your application has been placed on our waitlist. We'll contact you if a position becomes available in this program.</p>
            ` : `
              <p>We'll keep you updated as your application progresses through our review process.</p>
            `}
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Full Details</a>
            </div>
            
            <div class="footer">
              <p><strong>Questions?</strong> Contact us at <a href="mailto:programs@1001stories.org" style="color: #6366f1;">programs@1001stories.org</a></p>
              <p>Thank you for your interest in 1001 Stories!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories Programs" <programs@1001stories.org>',
      to: email,
      subject: `Application Update - ${programLabel} Program`,
      html,
    });

    console.log("Program application status update email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending program application status update email:", error);
    return { success: false, message: 'Failed to send status update email' };
  }
}

// Generic send email function
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`[Email Service Disabled] Email would be sent to ${options.to}: ${options.subject}`);
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: options.from || process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: 'Failed to send email' };
  }
}