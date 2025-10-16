'use client';

import { HTMLAttributes } from 'react';

interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  progress: number;
  variant?: 'green' | 'purple' | 'blue' | 'yellow' | 'gray';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const variantColors = {
  green: {
    bg: 'bg-soe-green-100',
    fill: 'bg-gradient-to-r from-soe-green-500 to-soe-green-600',
    text: 'text-soe-green-700'
  },
  purple: {
    bg: 'bg-soe-purple-100',
    fill: 'bg-gradient-to-r from-soe-purple-500 to-soe-purple-600',
    text: 'text-soe-purple-700'
  },
  blue: {
    bg: 'bg-blue-100',
    fill: 'bg-gradient-to-r from-blue-500 to-blue-600',
    text: 'text-blue-700'
  },
  yellow: {
    bg: 'bg-soe-yellow-100',
    fill: 'bg-gradient-to-r from-soe-yellow-500 to-soe-yellow-600',
    text: 'text-soe-yellow-700'
  },
  gray: {
    bg: 'bg-gray-100',
    fill: 'bg-gradient-to-r from-gray-400 to-gray-500',
    text: 'text-gray-700'
  }
};

export default function ProgressBar({
  progress,
  variant = 'green',
  showLabel = true,
  label,
  animated = true,
  className = '',
  ...props
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const colors = variantColors[variant];
  const displayLabel = label || `${Math.round(clampedProgress)}%`;

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${colors.text}`}>
            {displayLabel}
          </span>
        </div>
      )}

      <div
        className={`
          relative w-full h-2 rounded-full overflow-hidden
          ${colors.bg}
        `}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(clampedProgress)}%`}
      >
        <div
          className={`
            h-full rounded-full
            transition-all duration-500 ease-out
            ${colors.fill}
            ${animated ? 'transition-all' : ''}
          `}
          style={{ width: `${clampedProgress}%` }}
        >
          {animated && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                animation: 'shimmer 2s infinite',
              }}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
