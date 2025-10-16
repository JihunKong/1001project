'use client';

export type TextSubmissionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'STORY_REVIEW'
  | 'NEEDS_REVISION'
  | 'STORY_APPROVED'
  | 'FORMAT_REVIEW'
  | 'CONTENT_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'REJECTED'
  | 'SUBMITTED'
  | 'IN_REVIEW';

interface StatusBadgeProps {
  status: TextSubmissionStatus | string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}> = {
  DRAFT: {
    label: 'Draft',
    bgColor: '#F9FAFB',
    textColor: '#8E8E93',
    dotColor: '#8E8E93',
  },
  PENDING: {
    label: 'Submitted',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    dotColor: '#92400E',
  },
  SUBMITTED: {
    label: 'Submitted',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    dotColor: '#92400E',
  },
  STORY_REVIEW: {
    label: 'Under Review',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    dotColor: '#1E40AF',
  },
  IN_REVIEW: {
    label: 'Under Review',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    dotColor: '#1E40AF',
  },
  NEEDS_REVISION: {
    label: 'Need Revision',
    bgColor: '#FEF2F2',
    textColor: '#C2410C',
    dotColor: '#C2410C',
  },
  STORY_APPROVED: {
    label: 'Story Approved',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    dotColor: '#065F46',
  },
  FORMAT_REVIEW: {
    label: 'Format Review',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    dotColor: '#1E40AF',
  },
  CONTENT_REVIEW: {
    label: 'Final Review',
    bgColor: '#EDE9FE',
    textColor: '#5B21B6',
    dotColor: '#5B21B6',
  },
  APPROVED: {
    label: 'Approved',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    dotColor: '#065F46',
  },
  PUBLISHED: {
    label: 'Published',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    dotColor: '#065F46',
  },
  ARCHIVED: {
    label: 'Archived',
    bgColor: '#F9FAFB',
    textColor: '#8E8E93',
    dotColor: '#8E8E93',
  },
  REJECTED: {
    label: 'Rejected',
    bgColor: '#FEF2F2',
    textColor: '#C2410C',
    dotColor: '#C2410C',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-[6px] h-[6px]';
  const fontSize = size === 'sm' ? '12px' : '14px';
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-2 py-1.5';

  return (
    <div
      className={`inline-flex items-center justify-center gap-2 rounded ${padding}`}
      style={{
        backgroundColor: config.bgColor,
      }}
    >
      <div
        className={`${dotSize} rounded-full`}
        style={{ backgroundColor: config.dotColor }}
      />
      <span
        style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize,
          fontWeight: 500,
          lineHeight: '1.221',
          color: config.textColor,
        }}
      >
        {config.label}
      </span>
    </div>
  );
}
