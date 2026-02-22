import { Queue, Worker, Job } from 'bullmq';
import { queueOptions, workerOptions } from './config';
import { EmailService } from '@/lib/notifications/EmailService';
import { logger } from '@/lib/logger';

export interface EmailJobData {
  to: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

export const emailQueue = new Queue<EmailJobData>('email-notifications', queueOptions);

export async function queueEmailNotification(data: EmailJobData) {
  return emailQueue.add('send-email', data);
}

const emailService = new EmailService();

const emailWorker = new Worker<EmailJobData>(
  'email-notifications',
  async (job: Job<EmailJobData>) => {
    const { to, name, subject, html, text } = job.data;
    await emailService.sendNotificationEmail(to, name, subject, html, text);
    logger.info(`[EmailQueue] Successfully sent email to ${to}`);
    return { success: true, to };
  },
  workerOptions
);

emailWorker.on('completed', (job, result) => {
  logger.info(`[EmailQueue] Job ${job.id} completed`, result);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`[EmailQueue] Job ${job?.id} failed: ${err.message}`);
});

emailWorker.on('error', (error) => {
  logger.error('[EmailQueue] Queue error:', error);
});
