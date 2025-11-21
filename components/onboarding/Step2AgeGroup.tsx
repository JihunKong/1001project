'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface Step2AgeGroupProps {
  selectedAge: string | null;
  onSelect: (ageGroup: string) => void;
}

export default function Step2AgeGroup({
  selectedAge,
  onSelect,
}: Step2AgeGroupProps) {
  const { t } = useTranslation();

  const ageGroups = [
    { value: '5-8', icon: '👶', key: 'young' },
    { value: '9-12', icon: '👧', key: 'middle' },
    { value: '13-17', icon: '🧑', key: 'teen' },
    { value: '18+', icon: '👨', key: 'adult' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('onboarding.step2.title')}
        </h2>
        <p className="text-lg text-gray-600">
          {t('onboarding.step2.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ageGroups.map((group) => (
          <button
            key={group.value}
            onClick={() => onSelect(group.value)}
            className={`p-6 rounded-xl border-2 transition-all text-left
              ${
                selectedAge === group.value
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
          >
            <div className="text-4xl mb-3">{group.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {t(`onboarding.step2.ageGroups.${group.key}.label`)}
            </h3>
            <p className="text-sm text-gray-600">
              {t(`onboarding.step2.ageGroups.${group.key}.description`)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
