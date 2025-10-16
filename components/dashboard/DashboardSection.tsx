'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerBgColor?: string;
  noPadding?: boolean;
}

export default function DashboardSection({
  title,
  icon: Icon,
  badge,
  actions,
  children,
  className = '',
  headerBgColor = 'bg-white',
  noPadding = false
}: DashboardSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className={`px-6 py-4 border-b border-gray-200 ${headerBgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
            )}
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            {badge}
          </div>
          {actions}
        </div>
      </div>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}