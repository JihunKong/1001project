'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_STYLE_CONFIG: Record<string, { color: string; bg: string }> = {
  DRAFT: {
    color: 'text-gray-700',
    bg: 'bg-gray-100'
  },
  PENDING: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-100'
  },
  STORY_REVIEW: {
    color: 'text-purple-700',
    bg: 'bg-purple-100'
  },
  NEEDS_REVISION: {
    color: 'text-orange-700',
    bg: 'bg-orange-100'
  },
  STORY_APPROVED: {
    color: 'text-blue-700',
    bg: 'bg-blue-100'
  },
  FORMAT_DECISION: {
    color: 'text-indigo-700',
    bg: 'bg-indigo-100'
  },
  FINAL_REVIEW: {
    color: 'text-violet-700',
    bg: 'bg-violet-100'
  },
  PUBLISHED: {
    color: 'text-green-700',
    bg: 'bg-green-100'
  },
  REJECTED: {
    color: 'text-red-700',
    bg: 'bg-red-100'
  },
  ARCHIVED: {
    color: 'text-gray-600',
    bg: 'bg-gray-200'
  }
};

const SIZE_CONFIG = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5'
};

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const { t } = useTranslation();

  // Get label from translations
  const getStatusLabel = (status: string): string => {
    const statusKey = status.toLowerCase().replace(/_/g, '');
    const translationKeys: Record<string, string> = {
      'draft': 'components.statusBadge.draft',
      'pending': 'components.statusBadge.pendingReview',
      'submitted': 'components.statusBadge.pendingReview',
      'storyreview': 'components.statusBadge.storyReview',
      'inreview': 'components.statusBadge.storyReview',
      'needsrevision': 'components.statusBadge.needsRevision',
      'storyapproved': 'components.statusBadge.storyApproved',
      'formatdecision': 'components.statusBadge.formatDecision',
      'finalreview': 'components.statusBadge.finalReview',
      'published': 'components.statusBadge.published',
      'rejected': 'components.statusBadge.rejected',
      'archived': 'components.statusBadge.archived'
    };

    return t(translationKeys[statusKey] || 'components.statusBadge.draft');
  };

  const styleConfig = STATUS_STYLE_CONFIG[status] || {
    color: 'text-gray-700',
    bg: 'bg-gray-100'
  };

  const sizeClasses = SIZE_CONFIG[size];
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${styleConfig.bg} ${styleConfig.color} ${sizeClasses} ${className}`}
    >
      {label}
    </span>
  );
}
