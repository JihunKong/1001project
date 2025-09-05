'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import Link from 'next/link';

export interface SectionProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  children: ReactNode;
  className?: string;
  delay?: number;
  noPadding?: boolean;
  transparent?: boolean;
}

export default function Section({
  title,
  subtitle,
  action,
  children,
  className = '',
  delay = 0,
  noPadding = false,
  transparent = false
}: SectionProps) {
  const bgClass = transparent ? '' : 'bg-white rounded-xl shadow-sm';
  const paddingClass = noPadding ? '' : 'p-6';

  return (
    <motion.div
      initial={{ opacity: 0, x: delay % 2 === 0 ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.1 }}
      className={`${bgClass} ${paddingClass} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {action && (
            action.onClick ? (
              <button
                onClick={action.onClick}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                {action.label}
              </button>
            ) : (
              <Link
                href={action.href}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                {action.label}
              </Link>
            )
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}