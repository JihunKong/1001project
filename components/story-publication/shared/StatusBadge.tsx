'use client';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-700',
    bg: 'bg-gray-100'
  },
  PENDING: {
    label: 'Pending Review',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100'
  },
  STORY_REVIEW: {
    label: 'Story Review',
    color: 'text-purple-700',
    bg: 'bg-purple-100'
  },
  NEEDS_REVISION: {
    label: 'Needs Revision',
    color: 'text-orange-700',
    bg: 'bg-orange-100'
  },
  STORY_APPROVED: {
    label: 'Story Approved',
    color: 'text-blue-700',
    bg: 'bg-blue-100'
  },
  FORMAT_DECISION: {
    label: 'Format Decision',
    color: 'text-indigo-700',
    bg: 'bg-indigo-100'
  },
  FINAL_REVIEW: {
    label: 'Final Review',
    color: 'text-violet-700',
    bg: 'bg-violet-100'
  },
  PUBLISHED: {
    label: 'Published',
    color: 'text-green-700',
    bg: 'bg-green-100'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-100'
  },
  ARCHIVED: {
    label: 'Archived',
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
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    color: 'text-gray-700',
    bg: 'bg-gray-100'
  };

  const sizeClasses = SIZE_CONFIG[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.bg} ${config.color} ${sizeClasses} ${className}`}
    >
      {config.label}
    </span>
  );
}
