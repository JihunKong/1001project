'use client';

import { motion } from 'framer-motion';
import { LucideIcon, Calendar, Clock, AlertTriangle } from 'lucide-react';

export interface TaskItem {
  id: string | number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed?: boolean;
  category?: string;
  icon?: LucideIcon;
}

export interface TaskListProps {
  items: TaskItem[];
  showPriorityDot?: boolean;
  showCheckbox?: boolean;
  onToggleComplete?: (id: string | number) => void;
  compact?: boolean;
  className?: string;
  emptyMessage?: string;
}

const priorityConfig = {
  low: {
    color: 'bg-green-500',
    label: 'Low',
    textColor: 'text-green-600'
  },
  medium: {
    color: 'bg-yellow-500',
    label: 'Medium',
    textColor: 'text-yellow-600'
  },
  high: {
    color: 'bg-red-500',
    label: 'High',
    textColor: 'text-red-600'
  },
  critical: {
    color: 'bg-red-600',
    label: 'Critical',
    textColor: 'text-red-700'
  }
};

export default function TaskList({
  items,
  showPriorityDot = true,
  showCheckbox = false,
  onToggleComplete,
  compact = false,
  className = '',
  emptyMessage = 'No tasks available'
}: TaskListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const handleToggle = (id: string | number) => {
    if (onToggleComplete) {
      onToggleComplete(id);
    }
  };

  return (
    <div className={`space-y-${compact ? '2' : '3'} ${className}`}>
      {items.map((item, index) => {
        const priority = priorityConfig[item.priority];
        const Icon = item.icon;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-start gap-3 ${
              item.completed ? 'opacity-60' : ''
            }`}
          >
            {showCheckbox && (
              <input
                type="checkbox"
                checked={item.completed || false}
                onChange={() => handleToggle(item.id)}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            )}

            {showPriorityDot && (
              <div className={`w-2 h-2 rounded-full mt-2 ${priority.color} flex-shrink-0`} />
            )}

            {Icon && (
              <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            )}

            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <p className={`font-medium text-gray-900 ${
                    compact ? 'text-sm' : ''
                  } ${
                    item.completed ? 'line-through' : ''
                  }`}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className={`text-gray-600 mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {item.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {item.dueDate}
                      </span>
                    )}
                    {!showPriorityDot && (
                      <span className={`text-xs font-medium ${priority.textColor}`}>
                        {priority.label}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}