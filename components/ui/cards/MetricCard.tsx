'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  iconColor?: string;
  delay?: number;
  subtitle?: string;
  progress?: {
    value: number;
    max: number;
  };
  className?: string;
}

export default function MetricCard({
  icon: Icon,
  value,
  label,
  change,
  changeType = 'positive',
  iconColor = 'text-blue-500',
  delay = 0,
  subtitle,
  progress,
  className = ''
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`bg-white rounded-xl shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        {change && (
          <span className={`text-xs font-medium ${getChangeColor()}`}>
            {change}
          </span>
        )}
        {!change && typeof value === 'string' && (
          <span className="text-2xl font-bold text-gray-900">{value}</span>
        )}
      </div>
      
      {change && (
        <div className="mb-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
        </div>
      )}
      
      <p className="text-gray-600">{label}</p>
      
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
      
      {progress && (
        <div className="mt-3">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(progress.value / progress.max) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.value} / {progress.max}
          </p>
        </div>
      )}
    </motion.div>
  );
}