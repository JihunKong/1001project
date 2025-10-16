'use client';

interface DashboardProgressBarProps {
  label?: string;
  value: number;
  max?: number;
  showPercentage?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger' | 'custom';
  customColor?: string;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export default function DashboardProgressBar({
  label,
  value,
  max = 100,
  showPercentage = false,
  colorScheme = 'default',
  customColor,
  height = 'md',
  className = '',
  animate = true
}: DashboardProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getColorClass = (): string => {
    if (customColor) return customColor;

    switch (colorScheme) {
      case 'success':
        return 'bg-gradient-to-r from-green-400 to-green-500';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
      case 'danger':
        return 'bg-gradient-to-r from-red-400 to-red-500';
      default:
        // Auto-color based on percentage
        if (percentage > 80) return 'bg-gradient-to-r from-green-400 to-green-500';
        if (percentage > 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
        if (percentage > 40) return 'bg-gradient-to-r from-orange-400 to-orange-500';
        return 'bg-gradient-to-r from-red-400 to-red-500';
    }
  };

  const getHeightClass = (): string => {
    switch (height) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${getHeightClass()}`}>
        <div
          className={`${getHeightClass()} rounded-full ${getColorClass()} ${
            animate ? 'transition-all duration-500' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}