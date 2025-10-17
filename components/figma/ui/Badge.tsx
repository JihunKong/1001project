'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps {
  count?: number;
  max?: number;
  showZero?: boolean;
  dot?: boolean;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses = {
  primary: 'bg-[#874FFF] text-white',
  secondary: 'bg-gray-500 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white'
};

const sizeClasses = {
  sm: {
    badge: 'min-w-[16px] h-4 text-[10px] px-1',
    dot: 'w-2 h-2'
  },
  md: {
    badge: 'min-w-[20px] h-5 text-xs px-1.5',
    dot: 'w-2.5 h-2.5'
  },
  lg: {
    badge: 'min-w-[24px] h-6 text-sm px-2',
    dot: 'w-3 h-3'
  }
};

const positionClasses = {
  'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
  'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
  'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2'
};

export default function Badge({
  count,
  max = 99,
  showZero = false,
  dot = false,
  children,
  variant = 'error',
  position = 'top-right',
  size = 'md',
  className
}: BadgeProps) {
  const displayCount = count !== undefined && count > max ? `${max}+` : count;
  const shouldShow = dot || (count !== undefined && (showZero || count > 0));

  if (!shouldShow && !children) {
    return null;
  }

  const badge = (
    <span
      className={cn(
        'absolute inline-flex items-center justify-center font-semibold rounded-full',
        'ring-2 ring-white',
        dot ? sizeClasses[size].dot : sizeClasses[size].badge,
        variantClasses[variant],
        positionClasses[position],
        className
      )}
      aria-label={
        count !== undefined && count > 0
          ? `${count} ${count === 1 ? 'notification' : 'notifications'}`
          : dot
          ? 'Has notifications'
          : undefined
      }
      role="status"
    >
      {!dot && displayCount}
    </span>
  );

  if (children) {
    return (
      <div className="relative inline-flex">
        {children}
        {shouldShow && badge}
      </div>
    );
  }

  return badge;
}
