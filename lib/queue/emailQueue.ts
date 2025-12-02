import Bull from 'bull';
import { EmailService } from '@/lib/notifications/EmailService';
import { logger } from '@/lib/logger';

export interface EmailJobData {
  to: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const emailQueue = new Bull<EmailJobData>('email-notifications', {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function queueEmailNotification(data: EmailJobData): Promise<Bull.Job<EmailJobData>> {
  return emailQueue.add('send-email', data);
}

const emailService = new EmailService();

emailQueue.process('send-email', async (job) => {
  const { to, name, subject, html, text } = job.data;

  try {
    await emailService.sendNotificationEmail(to, name, subject, html, text);
    logger.info(`[EmailQueue] Successfully sent email to ${to}`);
    return { success: true, to };
  } catch (error) {
    logger.error(`[EmailQueue] Failed to send email to ${to}:`, error);
    throw error;
  }
});

emailQueue.on('completed', (job, result) => {
  logger.info(`[EmailQueue] Job ${job.id} completed`, result);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`[EmailQueue] Job ${job?.id} failed: ${err.message}`);
});

emailQueue.on('error', (error) => {
  logger.error('[EmailQueue] Queue error:', error);
});
