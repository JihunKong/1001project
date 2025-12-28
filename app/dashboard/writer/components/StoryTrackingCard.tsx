'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface StoryTrackingCardProps {
  title: string;
  description: string;
  thumbnailUrl?: string;
  status: string;
  submissionDate: string;
  targetAgeGroup?: string;
  targetAudience?: string;
  wordCount?: number;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'NEEDS_REVISION':
      return {
        bg: '#FEF2F2',
        text: '#C2410C'
      };
    case 'PENDING':
    case 'STORY_REVIEW':
      return {
        bg: '#EEF2FF',
        text: '#5951E7'
      };
    case 'BOOK_REVIEW':
      return {
        bg: '#FEF3C7',
        text: '#F59E0B'
      };
    case 'APPROVED':
    case 'PUBLISHED':
      return {
        bg: '#D1FAE5',
        text: '#059669'
      };
    case 'DRAFT':
      return {
        bg: '#F3F4F6',
        text: '#6B7280'
      };
    default:
      return {
        bg: '#F3F4F6',
        text: '#6B7280'
      };
  }
};

const getStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'NEEDS_REVISION':
      return t('dashboard.writer.storyCard.status.needRevision');
    case 'PENDING':
    case 'STORY_REVIEW':
      return t('dashboard.writer.storyCard.status.underReview');
    case 'BOOK_REVIEW':
      return t('dashboard.writer.storyCard.status.finalReview');
    case 'APPROVED':
    case 'PUBLISHED':
      return t('dashboard.writer.storyCard.status.approved');
    case 'DRAFT':
      return t('dashboard.writer.storyCard.status.draft');
    default:
      return status;
  }
};

export default function StoryTrackingCard({
  title,
  description,
  thumbnailUrl,
  status,
  submissionDate,
  targetAgeGroup,
  targetAudience,
  wordCount
}: StoryTrackingCardProps) {
  const { t } = useTranslation();
  const statusStyles = getStatusStyles(status);

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 w-full">
      <div className="space-y-10">
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-6 min-w-0 flex-1">
            {thumbnailUrl ? (
              <div className="relative w-[120px] h-[100px] flex-shrink-0">
                <Image
                  src={thumbnailUrl}
                  alt={title}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-[120px] h-[100px] flex-shrink-0 bg-[#F3F4F6] rounded flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-[#D1D1D6]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2">
              <h3
                className="text-[#141414] truncate"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '24px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {title}
              </h3>
              <p
                className="text-[#141414] line-clamp-3 break-words"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.193',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 3
                }}
              >
                {description}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-2 py-1.5 rounded flex-shrink-0 whitespace-nowrap"
            style={{ backgroundColor: statusStyles.bg }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusStyles.text }}
            />
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.221',
                color: statusStyles.text
              }}
            >
              {getStatusLabel(status, t)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end gap-25">
          <div className="space-y-1">
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {t('dashboard.writer.storyCard.submissionDate')}
            </p>
            <p
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {new Date(submissionDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {(targetAgeGroup || targetAudience) && (
            <div className="space-y-1 w-[141px]">
              <p
                className="text-[#8E8E93]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {t('dashboard.writer.storyCard.targetAgeGroup')}
              </p>
              <p
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193'
                }}
              >
                {targetAgeGroup || targetAudience}
              </p>
            </div>
          )}

          {wordCount !== undefined && (
            <div className="space-y-1 w-[141px]">
              <p
                className="text-[#8E8E93]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {t('dashboard.writer.storyCard.wordCount')}
              </p>
              <p
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193'
                }}
              >
                {wordCount.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
