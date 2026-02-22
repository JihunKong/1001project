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

let _queue: Queue<EmailJobData> | null = null;
let _workerInitialized = false;

function getQueue(): Queue<EmailJobData> {
  if (!_queue) {
    _queue = new Queue<EmailJobData>('email-notifications', queueOptions);
  }
  return _queue;
}

export async function queueEmailNotification(data: EmailJobData) {
  ensureWorker();
  return getQueue().add('send-email', data);
}

function ensureWorker() {
  if (_workerInitialized) return;
  _workerInitialized = true;

  const emailService = new EmailService();

  const worker = new Worker<EmailJobData>(
    'email-notifications',
    async (job: Job<EmailJobData>) => {
      const { to, name, subject, html, text } = job.data;
      await emailService.sendNotificationEmail(to, name, subject, html, text);
      logger.info(`[EmailQueue] Successfully sent email to ${to}`);
      return { success: true, to };
    },
    workerOptions
  );

  worker.on('completed', (job, result) => {
    logger.info(`[EmailQueue] Job ${job.id} completed`, result);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[EmailQueue] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (error) => {
    logger.error('[EmailQueue] Queue error:', error);
  });
}
