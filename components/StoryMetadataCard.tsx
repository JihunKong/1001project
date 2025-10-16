'use client';

import StatusBadge, { type TextSubmissionStatus } from './StatusBadge';

interface StoryMetadataCardProps {
  status: TextSubmissionStatus | string;
  updatedAt: string | Date;
  wordCount: number | null | undefined;
}

export default function StoryMetadataCard({ status, updatedAt, wordCount }: StoryMetadataCardProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: '1.221',
              color: '#141414'
            }}
          >
            Details
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193',
                color: '#8E8E93'
              }}
            >
              Status
            </span>
            <StatusBadge status={status} size="md" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193',
                color: '#8E8E93'
              }}
            >
              Last Saved
            </span>
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.221',
                color: '#141414'
              }}
            >
              {formatDate(updatedAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193',
                color: '#8E8E93'
              }}
            >
              Word Count
            </span>
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.221',
                color: '#141414'
              }}
            >
              {wordCount?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
