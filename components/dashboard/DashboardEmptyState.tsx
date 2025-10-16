'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function DashboardEmptyState({
  icon: Icon,
  iconColor = 'from-gray-100 to-gray-200',
  title,
  description,
  action,
  className = ''
}: DashboardEmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className={`p-4 bg-gradient-to-br ${iconColor} rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center`}>
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}