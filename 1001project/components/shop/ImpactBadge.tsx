'use client';

import { motion } from 'framer-motion';
import { Heart, GraduationCap, Book, Users } from 'lucide-react';

interface ImpactBadgeProps {
  metric: string;
  value: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function ImpactBadge({ metric, value, size = 'md', animated = true }: ImpactBadgeProps) {
  const getIcon = () => {
    if (metric.includes('education') || metric.includes('school')) {
      return <GraduationCap className={`${sizeClasses.icon[size]}`} />;
    }
    if (metric.includes('stories') || metric.includes('book')) {
      return <Book className={`${sizeClasses.icon[size]}`} />;
    }
    if (metric.includes('meal') || metric.includes('nutrition')) {
      return <Heart className={`${sizeClasses.icon[size]}`} />;
    }
    return <Users className={`${sizeClasses.icon[size]}`} />;
  };

  const sizeClasses = {
    container: {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4'
    },
    text: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    },
    icon: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }
  };

  const BadgeContent = () => (
    <div className={`
      bg-gradient-to-r from-green-50 to-emerald-50 
      border border-green-200 rounded-lg 
      ${sizeClasses.container[size]}
      flex items-center gap-3
    `}>
      <div className="text-green-600">
        {getIcon()}
      </div>
      <div className={`${sizeClasses.text[size]}`}>
        <span className="font-semibold text-green-800">Your Impact:</span>
        <span className="ml-2 text-green-700">
          {value} {metric}
        </span>
      </div>
    </div>
  );

  if (!animated) {
    return <BadgeContent />;
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <BadgeContent />
    </motion.div>
  );
}