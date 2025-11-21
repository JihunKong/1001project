'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { ReactNode } from 'react';

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onFinish?: () => void;
  canGoNext?: boolean;
  canGoBack?: boolean;
  showSkip?: boolean;
  isLastStep?: boolean;
  children: ReactNode;
}

export default function OnboardingLayout({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  onFinish,
  canGoNext = true,
  canGoBack = true,
  showSkip = false,
  isLastStep = false,
  children,
}: OnboardingLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t('onboarding.common.stepIndicator', {
                current: currentStep.toString(),
                total: totalSteps.toString(),
              })}
            </span>
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('onboarding.common.skip')}
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">{children}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={onBack}
            disabled={!canGoBack || currentStep === 1}
            className="px-6 py-3 rounded-lg font-medium transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-gray-100 text-gray-700
              border border-gray-300"
          >
            {t('onboarding.common.back')}
          </button>

          {isLastStep ? (
            <button
              onClick={onFinish}
              disabled={!canGoNext}
              className="px-6 py-3 rounded-lg font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                hover:from-blue-600 hover:to-indigo-700
                shadow-lg hover:shadow-xl"
            >
              {t('onboarding.common.finish')}
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="px-6 py-3 rounded-lg font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                hover:from-blue-600 hover:to-indigo-700
                shadow-lg hover:shadow-xl"
            >
              {t('onboarding.common.next')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
