'use client';

import StatusBadge from './StatusBadge';
import { Lightbulb, Sparkles } from 'lucide-react';

interface StoryDetailsPanelProps {
  title?: string;
  summary?: string;
  status?: string;
  submittedAt?: Date | string | null;
  ageRange?: string | null;
  wordCount?: number;
  imageUrl?: string | null;
  className?: string;
}

export default function StoryDetailsPanel({
  status = 'DRAFT',
  submittedAt,
  wordCount = 0,
  className = '',
}: StoryDetailsPanelProps) {
  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'Not saved yet';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`flex w-full flex-col gap-4 lg:flex-shrink-0 ${className}`}>
      {/* Card 1: Details */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 flex flex-col gap-[11px]">
        <div className="flex flex-col gap-4">
          {/* Frame 133 */}
          <div className="flex flex-col gap-2">
            {/* Frame 135 - Header */}
            <div className="flex gap-2">
              <h3
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                Details
              </h3>
            </div>

            {/* Frame 142 - Status Row */}
            <div className="flex justify-between items-center gap-2">
              <span
                className="text-[#8E8E93]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193',
                  width: '81px'
                }}
              >
                Status
              </span>
              <StatusBadge status={status} />
            </div>

            {/* Frame 143 - Last Saved Row */}
            <div className="flex justify-between items-center gap-2">
              <span
                className="text-[#8E8E93]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193'
                }}
              >
                Last Saved
              </span>
              <span
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {formatDate(submittedAt)}
              </span>
            </div>

            {/* Frame 144 - Word Count Row */}
            <div className="flex justify-between items-center gap-2">
              <span
                className="text-[#8E8E93]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193'
                }}
              >
                Word Count
              </span>
              <span
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {wordCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Writing Tips */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 flex flex-col gap-[11px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* Header with icon */}
            <div className="flex gap-2">
              <Lightbulb className="w-6 h-6 text-[#141414]" />
              <h3
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                Writing Tips
              </h3>
            </div>

            {/* Description */}
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              Get instant feedback on grammar, structure, and style to improve your story&apos;s quality.
            </p>
          </div>

          {/* Button */}
          <button
            className="w-full bg-[#F2F2F7] rounded-md py-3 px-6 flex items-center justify-center"
            type="button"
          >
            <span
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              Learn more
            </span>
          </button>
        </div>
      </div>

      {/* Card 3: AI Review */}
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 flex flex-col gap-[11px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* Header with icon */}
            <div className="flex gap-2">
              <Sparkles className="w-6 h-6 text-[#5951E7]" />
              <h3
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                AI Review
              </h3>
            </div>

            {/* Description */}
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              Get instant feedback on grammar, structure, and style to improve your story&apos;s quality.
            </p>
          </div>

          {/* Button */}
          <button
            className="w-full bg-[#EEF2FF] rounded-md py-3 px-6 flex items-center justify-center gap-[10px]"
            type="button"
          >
            <Sparkles className="w-6 h-6 text-[#5951E7]" />
            <span
              className="text-[#5951E7]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              Request AI Review
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
