'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Eye, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export interface ProgressCardProps {
  id: string | number;
  title: string;
  subtitle?: string;
  progress: number;
  progressLabel?: string;
  href?: string;
  icon?: LucideIcon;
  status?: {
    label: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'default';
  };
  metadata?: Array<{
    label: string;
    value: string | number;
  }>;
  children?: ReactNode;
  className?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

const statusColors = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700'
};

const progressColors = {
  high: 'bg-green-500',
  medium: 'bg-blue-500',
  low: 'bg-yellow-500',
  critical: 'bg-red-500'
};

export default function ProgressCard({
  id,
  title,
  subtitle,
  progress,
  progressLabel,
  href,
  icon: Icon,
  status,
  metadata,
  children,
  className = '',
  onAction,
  actionIcon: ActionIcon = ChevronRight
}: ProgressCardProps) {
  const getProgressColor = () => {
    if (progress >= 80) return progressColors.high;
    if (progress >= 50) return progressColors.medium;
    if (progress >= 25) return progressColors.low;
    return progressColors.critical;
  };

  const CardContent = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
          {metadata && (
            <div className="flex flex-wrap gap-3 mt-2">
              {metadata.map((item, index) => (
                <span key={index} className="text-sm text-gray-600">
                  {item.label}: <span className="font-medium">{item.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.type]}`}>
            {status.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-grow bg-gray-200 rounded-full h-2">
          <div
            className={`${getProgressColor()} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 font-medium min-w-[3rem] text-right">
          {progressLabel || `${progress}%`}
        </span>
        {(href || onAction) && (
          <button
            onClick={onAction}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-2"
          >
            <ActionIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </>
  );

  const cardClassName = `border rounded-lg p-4 hover:shadow-md transition-shadow ${className}`;

  if (href && !onAction) {
    return (
      <Link href={href}>
        <div className={cardClassName}>
          {CardContent}
        </div>
      </Link>
    );
  }

  return (
    <div className={cardClassName}>
      {CardContent}
    </div>
  );
}