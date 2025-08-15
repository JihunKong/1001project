'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  href: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  external?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  delay?: number;
}

const colorSchemes = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    icon: 'text-blue-600',
    text: 'text-blue-900'
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    icon: 'text-green-600',
    text: 'text-green-900'
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    icon: 'text-purple-600',
    text: 'text-purple-900'
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    icon: 'text-red-600',
    text: 'text-red-900'
  },
  yellow: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    icon: 'text-yellow-600',
    text: 'text-yellow-900'
  },
  gray: {
    bg: 'bg-gray-50 hover:bg-gray-100',
    icon: 'text-gray-600',
    text: 'text-gray-900'
  }
};

const sizes = {
  sm: {
    padding: 'p-2',
    iconSize: 'w-4 h-4',
    textSize: 'text-xs',
    gap: 'gap-2'
  },
  md: {
    padding: 'p-3',
    iconSize: 'w-5 h-5',
    textSize: 'text-sm',
    gap: 'gap-3'
  },
  lg: {
    padding: 'p-4',
    iconSize: 'w-6 h-6',
    textSize: 'text-base',
    gap: 'gap-4'
  }
};

export default function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  colorScheme = 'blue',
  size = 'md',
  external = false,
  onClick,
  className = '',
  delay = 0
}: QuickActionCardProps) {
  const colors = colorSchemes[colorScheme];
  const sizeStyles = sizes[size];

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center ${sizeStyles.gap} ${sizeStyles.padding} ${colors.bg} rounded-lg transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      <Icon className={`${sizeStyles.iconSize} ${colors.icon} flex-shrink-0`} />
      <div className="flex-grow">
        <span className={`${sizeStyles.textSize} font-medium ${colors.text} block`}>
          {title}
        </span>
        {description && (
          <span className={`text-xs ${colors.text} opacity-75 mt-1 block`}>
            {description}
          </span>
        )}
      </div>
    </motion.div>
  );

  if (onClick && !href) {
    return content;
  }

  return (
    <Link 
      href={href} 
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {content}
    </Link>
  );
}