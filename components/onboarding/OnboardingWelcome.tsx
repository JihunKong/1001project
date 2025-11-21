'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export default function OnboardingWelcome({ onStart }: OnboardingWelcomeProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-12 text-center">
        {/* Logo or Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('onboarding.welcome.title')}
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          {t('onboarding.welcome.subtitle')}
        </p>
        <p className="text-base text-gray-500 mb-12 max-w-lg mx-auto">
          {t('onboarding.welcome.description')}
        </p>

        {/* Get Started Button */}
        <button
          onClick={onStart}
          className="px-8 py-4 rounded-lg font-semibold text-lg
            bg-gradient-to-r from-blue-500 to-indigo-600 text-white
            hover:from-blue-600 hover:to-indigo-700
            shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          {t('onboarding.welcome.getStarted')}
        </button>

        {/* Login Link */}
        <p className="mt-8 text-sm text-gray-500">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('onboarding.welcome.loginInstead')}
          </Link>
        </p>
      </div>
    </div>
  );
}
