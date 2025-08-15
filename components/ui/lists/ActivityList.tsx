'use client';

import { LucideIcon, CheckCircle, FileText, Award, AlertCircle, Clock, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ActivityItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'achievement' | 'assignment' | 'help' | 'default';
  icon?: LucideIcon;
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface ActivityListProps {
  items: ActivityItem[];
  showIcon?: boolean;
  showUser?: boolean;
  compact?: boolean;
  className?: string;
  emptyMessage?: string;
}

const typeConfig = {
  success: {
    bg: 'bg-green-100',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  info: {
    bg: 'bg-blue-100',
    icon: FileText,
    iconColor: 'text-blue-600'
  },
  warning: {
    bg: 'bg-yellow-100',
    icon: AlertCircle,
    iconColor: 'text-yellow-600'
  },
  error: {
    bg: 'bg-red-100',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  achievement: {
    bg: 'bg-yellow-100',
    icon: Award,
    iconColor: 'text-yellow-600'
  },
  assignment: {
    bg: 'bg-blue-100',
    icon: FileText,
    iconColor: 'text-blue-600'
  },
  help: {
    bg: 'bg-red-100',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  default: {
    bg: 'bg-gray-100',
    icon: Clock,
    iconColor: 'text-gray-600'
  }
};

export default function ActivityList({
  items,
  showIcon = true,
  showUser = false,
  compact = false,
  className = '',
  emptyMessage = 'No recent activity'
}: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const paddingClass = compact ? 'p-2' : 'p-3';
  const gapClass = compact ? 'gap-2' : 'gap-3';

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => {
        const config = typeConfig[item.type] || typeConfig.default;
        const Icon = item.icon || config.icon;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-start ${gapClass} ${paddingClass} bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors`}
          >
            {showIcon && (
              <div className={`p-2 rounded-full ${config.bg} flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.iconColor}`} />
              </div>
            )}

            {showUser && item.user && (
              <div className="flex-shrink-0">
                {item.user.avatar ? (
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                )}
              </div>
            )}

            <div className="flex-grow min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  {item.title && (
                    <p className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
                      {item.title}
                    </p>
                  )}
                  {item.user && showUser && (
                    <p className="text-sm font-medium text-gray-900">
                      {item.user.name}
                    </p>
                  )}
                  {item.subtitle && (
                    <p className="text-sm text-gray-700 mt-0.5">{item.subtitle}</p>
                  )}
                  <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} ${item.title ? 'mt-0.5' : ''}`}>
                    {item.description}
                  </p>
                </div>
              </div>
              <p className={`text-gray-500 mt-1 ${compact ? 'text-xs' : 'text-xs'}`}>
                {item.time}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}