import { Queue } from 'bullmq';
import { queueOptions } from './config';

export interface AIReviewJobData {
  submissionId: string;
  content: string;
  userId: string;
  triggerType: 'manual' | 'auto';
}

export const aiReviewQueue = new Queue<AIReviewJobData>('ai-review', queueOptions);

export async function enqueueAIReview(data: AIReviewJobData): Promise<string> {
  const job = await aiReviewQueue.add('process-ai-review', data, {
    jobId: `ai-review-${data.submissionId}-${Date.now()}`,
    priority: data.triggerType === 'manual' ? 1 : 2,
  });

  return job.id || '';
}

export async function getJobStatus(jobId: string) {
  const job = await aiReviewQueue.getJob(jobId);

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
