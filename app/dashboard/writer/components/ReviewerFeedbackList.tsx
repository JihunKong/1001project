'use client';

import Image from 'next/image';
import { MessageSquare } from 'lucide-react';

interface Feedback {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

interface ReviewerFeedbackListProps {
  feedbacks: Feedback[];
}

export default function ReviewerFeedbackList({ feedbacks }: ReviewerFeedbackListProps) {
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 w-[610px]">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-[#141414]" />
          <h3
            className="text-[#141414]"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            Reviewer's Feedback
          </h3>
        </div>
        <p
          className="text-[#8E8E93]"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '1.193'
          }}
        >
          No feedback yet. Once your story is reviewed, feedback will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 w-[610px] max-h-[687px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-[#141414]" />
        <h3
          className="text-[#141414]"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: '1.221'
          }}
        >
          Reviewer's Feedback
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#E5E5EA] flex items-center justify-center overflow-hidden flex-shrink-0">
                <svg
                  className="w-6 h-6 text-[#8E8E93]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              <div className="space-y-1">
                <p
                  className="text-[#141414]"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '18px',
                    fontWeight: 500,
                    lineHeight: '1.221'
                  }}
                >
                  {feedback.authorName}
                </p>
              </div>
            </div>

            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            <p
              className="text-[#141414] whitespace-pre-wrap"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {feedback.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
