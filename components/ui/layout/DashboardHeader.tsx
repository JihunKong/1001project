'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  userName,
  breadcrumbs,
  actions,
  icon: Icon,
  className = ''
}: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 ${className}`}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-blue-600 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
              {userName && (
                <p className="text-gray-600 mt-1">
                  Welcome back, <span className="font-medium">{userName}</span>!
                </p>
              )}
            </div>
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}