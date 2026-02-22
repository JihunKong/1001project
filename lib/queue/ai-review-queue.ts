import { Queue } from 'bullmq';
import { queueOptions } from './config';
import { SupportedLanguage } from '@/lib/i18n/language-cookie';

export interface AIReviewJobData {
  submissionId: string;
  content: string;
  userId: string;
  triggerType: 'manual' | 'auto';
  language?: SupportedLanguage;
}

let _queue: Queue<AIReviewJobData> | null = null;

function getQueue(): Queue<AIReviewJobData> {
  if (!_queue) {
    _queue = new Queue<AIReviewJobData>('ai-review', queueOptions);
  }
  return _queue;
}

export const aiReviewQueue = { get instance() { return getQueue(); } };

export async function enqueueAIReview(data: AIReviewJobData): Promise<string> {
  const job = await getQueue().add('process-ai-review', data, {
    jobId: `ai-review-${data.submissionId}-${Date.now()}`,
    priority: data.triggerType === 'manual' ? 1 : 2,
  });

  return job.id || '';
}

export async function getJobStatus(jobId: string) {
  const job = await getQueue().getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}
