'use client';

import { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';

interface SettingsLayoutProps {
  children: ReactNode;
  role: string;
}

export function SettingsLayout({ children, role }: SettingsLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/${role}/profile`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('settings.backToProfile')}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('settings.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('settings.description')}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
