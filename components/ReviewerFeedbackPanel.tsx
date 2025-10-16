'use client';

import { MessageCircle } from 'lucide-react';

interface FeedbackItem {
  id: string;
  createdAt: Date;
  feedback: string;
  reviewerName?: string;
}

interface ReviewerFeedbackPanelProps {
  feedbackList?: FeedbackItem[];
  status?: string;
}

export default function ReviewerFeedbackPanel({ feedbackList = [], status }: ReviewerFeedbackPanelProps) {
  if (!feedbackList || feedbackList.length === 0) {
    return null;
  }

  if (status !== 'NEEDS_REVISION' && status !== 'STORY_REVIEW' && status !== 'FORMAT_REVIEW') {
    return null;
  }

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#141414]" />
        <h2
          className="text-[#141414]"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: '1.221'
          }}
        >
          Reviewer&apos;s Feedback
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {feedbackList.map((feedback, index) => (
          <div
            key={feedback.id || index}
            className="bg-[#F9FAFB] border border-[#E5E5EA] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.193'
                }}
              >
                {feedback.reviewerName || 'Reviewer'}
              </span>
              <span
                className="text-[#8E8E93]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '1.193'
                }}
              >
                {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <p
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {feedback.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
