import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const ContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

const CONTACT_RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 3,
  message: 'Too many messages. Please try again later.',
};

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, CONTACT_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = ContactSchema.parse(body);

    const subjectMap: Record<string, string> = {
      general: 'General Inquiry',
      teacher: 'Teacher/Educator Inquiry',
      writer: 'Writer/Contributor Inquiry',
      partnership: 'Partnership Inquiry',
      technical: 'Technical Support',
      other: 'Other',
    };

    const subjectLabel = subjectMap[data.subject] || data.subject;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New Contact Form Message</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.firstName} ${data.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${data.email}">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Subject</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${subjectLabel}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #374151;">Message</h3>
          <p style="white-space: pre-wrap; color: #4b5563;">${data.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
          Sent from 1001 Stories contact form
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: 'info@seedsofempowerment.org',
      subject: `[1001 Stories Contact] ${subjectLabel} - ${data.firstName} ${data.lastName}`,
      html,
    });

    if (!result.success) {
      logger.error('Contact form email failed', { email: data.email, reason: result.message });
      return NextResponse.json(
        { error: 'Failed to send message. Please try emailing us directly.' },
        { status: 503 }
      );
    }

    logger.info('Contact form message sent', { from: data.email, subject: data.subject });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Please fill in all required fields correctly.' },
        { status: 400 }
      );
    }
    logger.error('Contact form error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
