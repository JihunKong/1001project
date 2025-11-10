'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  userName?: string | null;
  actions?: ReactNode;
  showNotifications?: boolean;
  className?: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'from-soe-green-400 to-soe-green-500',
  userName,
  actions,
  showNotifications = true,
  className = ''
}: DashboardHeaderProps) {
  return (
    <div className={`bg-white shadow ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-2 bg-gradient-to-br ${iconColor} rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle || (userName ? `Welcome back, ${userName}` : '')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {showNotifications && <NotificationDropdown />}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}