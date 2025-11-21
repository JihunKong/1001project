'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { useState } from 'react';

interface Step4InterestsProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
}

export default function Step4Interests({
  selectedInterests,
  onInterestsChange,
}: Step4InterestsProps) {
  const { t } = useTranslation();

  const categories = {
    fiction: [
      'adventure',
      'fantasy',
      'mystery',
      'scienceFiction',
      'historical',
    ],
    nonFiction: ['biography', 'history', 'science', 'nature', 'culture'],
    thematic: [
      'friendship',
      'family',
      'courage',
      'kindness',
      'creativity',
      'perseverance',
    ],
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      onInterestsChange(selectedInterests.filter((i) => i !== interest));
    } else {
      onInterestsChange([...selectedInterests, interest]);
    }
  };

  const selectAll = () => {
    const allInterests = [
      ...categories.fiction,
      ...categories.nonFiction,
      ...categories.thematic,
    ];
    onInterestsChange(allInterests);
  };

  const clearAll = () => {
    onInterestsChange([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('onboarding.step4.title')}
        </h2>
        <p className="text-lg text-gray-600">
          {t('onboarding.step4.subtitle')}
        </p>
      </div>

      {/* Select/Clear All Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={selectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('onboarding.step4.selectAll')}
        </button>
        <button
          onClick={clearAll}
          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          {t('onboarding.step4.clearAll')}
        </button>
      </div>

      {/* Fiction Category */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {t('onboarding.step4.categories.fiction.title')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.fiction.map((item) => (
            <button
              key={item}
              onClick={() => toggleInterest(item)}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${
                  selectedInterests.includes(item)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
            >
              {t(`onboarding.step4.categories.fiction.items.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Non-Fiction Category */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {t('onboarding.step4.categories.nonFiction.title')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.nonFiction.map((item) => (
            <button
              key={item}
              onClick={() => toggleInterest(item)}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${
                  selectedInterests.includes(item)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
            >
              {t(`onboarding.step4.categories.nonFiction.items.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Thematic Category */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {t('onboarding.step4.categories.thematic.title')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.thematic.map((item) => (
            <button
              key={item}
              onClick={() => toggleInterest(item)}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${
                  selectedInterests.includes(item)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
            >
              {t(`onboarding.step4.categories.thematic.items.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Message */}
      {selectedInterests.length === 0 && (
        <p className="text-sm text-amber-600 text-center mt-4">
          {t('onboarding.step4.validation.selectAtLeastOne')}
        </p>
      )}
    </div>
  );
}
