'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  subValue?: string | ReactNode;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
    icon?: LucideIcon;
  };
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

export default function DashboardStatsCard({
  title,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-soe-green-600',
  iconBgColor = 'from-soe-green-400 to-soe-green-500',
  trend,
  className = '',
  onClick,
  loading = false
}: DashboardStatsCardProps) {
  const baseClasses = 'bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all duration-300';
  const clickableClasses = onClick ? 'cursor-pointer hover:-translate-y-1' : '';

  if (loading) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-7 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 bg-gradient-to-br ${iconBgColor} rounded-xl`}>
          <Icon className={`h-6 w-6 text-white`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-xs text-gray-500 mt-1">{subValue}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.icon && <trend.icon className="h-3 w-3" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}