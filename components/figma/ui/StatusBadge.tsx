'use client';

import { HTMLAttributes } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileEdit,
  Eye,
  Archive,
  Sparkles
} from 'lucide-react';

type TextSubmissionStatus =
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
  | 'REJECTED';

interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  status: TextSubmissionStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<TextSubmissionStatus, {
  label: string;
  icon: typeof Clock;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  DRAFT: {
    label: 'Draft',
    icon: FileEdit,
    bgColor: 'bg-gray-50',
    textColor: 'text-figma-gray-inactive',
    borderColor: 'border-figma-gray-border'
  },
  PENDING: {
    label: 'Pending Review',
    icon: Clock,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200'
  },
  STORY_REVIEW: {
    label: 'Story Review',
    icon: Eye,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  NEEDS_REVISION: {
    label: 'Needs Revision',
    icon: AlertCircle,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  STORY_APPROVED: {
    label: 'Story Approved',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200'
  },
  FORMAT_REVIEW: {
    label: 'Format Review',
    icon: Eye,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  CONTENT_REVIEW: {
    label: 'Content Review',
    icon: Eye,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200'
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  PUBLISHED: {
    label: 'Published',
    icon: Sparkles,
    bgColor: 'bg-soe-green-50',
    textColor: 'text-soe-green-700',
    borderColor: 'border-soe-green-200'
  },
  ARCHIVED: {
    label: 'Archived',
    icon: Archive,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300'
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  }
};

const sizeClasses = {
  sm: {
    container: 'h-6 px-2 gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs'
  },
  md: {
    container: 'h-8 px-3 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm'
  },
  lg: {
    container: 'h-10 px-4 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base'
  }
};

export default function StatusBadge({
  status,
  size = 'md',
  className = '',
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center justify-center
        rounded-full
        border
        font-medium
        transition-all duration-200
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${sizes.container}
        ${className}
      `}
      role="status"
      aria-label={`Status: ${config.label}`}
      {...props}
    >
      <Icon className={`${sizes.icon} flex-shrink-0`} />
      <span className={sizes.text}>{config.label}</span>
    </div>
  );
}
