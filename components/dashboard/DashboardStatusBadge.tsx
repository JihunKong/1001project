'use client';

import { LucideIcon } from 'lucide-react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Edit
} from 'lucide-react';

type BadgeVariant = 'status' | 'priority' | 'alert' | 'role' | 'custom';

interface DashboardStatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  showIcon?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function DashboardStatusBadge({
  status,
  variant = 'status',
  showIcon = false,
  className = '',
  size = 'sm'
}: DashboardStatusBadgeProps) {
  const getColorClasses = (): string => {
    if (variant === 'priority') {
      switch (status.toLowerCase()) {
        case 'urgent':
        case 'high':
          return 'bg-red-100 text-red-800';
        case 'medium':
          return 'bg-yellow-100 text-yellow-800';
        case 'low':
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    if (variant === 'alert') {
      switch (status.toLowerCase()) {
        case 'error':
          return 'bg-red-100 text-red-800';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800';
        case 'info':
          return 'bg-soe-green-100 text-soe-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    if (variant === 'role') {
      switch (status.toUpperCase()) {
        case 'ADMIN':
          return 'bg-purple-100 text-purple-800';
        case 'TEACHER':
          return 'bg-soe-green-100 text-soe-green-800';
        case 'LEARNER':
          return 'bg-blue-100 text-blue-800';
        case 'WRITER':
          return 'bg-orange-100 text-orange-800';
        case 'STORY_MANAGER':
          return 'bg-indigo-100 text-indigo-800';
        case 'BOOK_MANAGER':
          return 'bg-teal-100 text-teal-800';
        case 'CONTENT_ADMIN':
          return 'bg-pink-100 text-pink-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    // Default status variant
    switch (status.toUpperCase()) {
      case 'PUBLISHED':
      case 'COMPLETED':
      case 'APPROVED':
      case 'STORY_APPROVED':
      case 'ACTIVE':
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'STORY_REVIEW':
      case 'REVIEW':
      case 'REVIEWING':
        return 'bg-purple-100 text-purple-800';
      case 'NEEDS_REVISION':
      case 'REVISION':
        return 'bg-orange-100 text-orange-800';
      case 'REJECTED':
      case 'FAILED':
      case 'ERROR':
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (): LucideIcon | null => {
    if (!showIcon) return null;

    switch (status.toUpperCase()) {
      case 'PUBLISHED':
      case 'COMPLETED':
      case 'APPROVED':
      case 'STORY_APPROVED':
      case 'SUCCESS':
        return CheckCircle;
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return Clock;
      case 'STORY_REVIEW':
      case 'REVIEW':
      case 'REVIEWING':
        return Eye;
      case 'NEEDS_REVISION':
      case 'REVISION':
        return Edit;
      case 'REJECTED':
      case 'FAILED':
      case 'ERROR':
        return XCircle;
      case 'DRAFT':
        return FileText;
      default:
        return AlertCircle;
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'xs':
        return 'px-2 py-0.5 text-xs';
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  const Icon = getIcon();
  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${colorClasses} ${sizeClasses} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {status}
    </span>
  );
}