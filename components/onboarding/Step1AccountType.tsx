'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccountType } from '@prisma/client';

interface Step1AccountTypeProps {
  selectedType: AccountType | null;
  onSelect: (type: AccountType) => void;
}

export default function Step1AccountType({
  selectedType,
  onSelect,
}: Step1AccountTypeProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('onboarding.step1.title')}
        </h2>
        <p className="text-lg text-gray-600">
          {t('onboarding.step1.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Option */}
        <button
          onClick={() => onSelect(AccountType.STUDENT)}
          className={`p-8 rounded-xl border-2 transition-all text-left
            ${
              selectedType === AccountType.STUDENT
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
        >
          <div className="text-5xl mb-4">🎓</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('onboarding.step1.student.title')}
          </h3>
          <p className="text-gray-600">
            {t('onboarding.step1.student.description')}
          </p>
        </button>

        {/* Parent Option */}
        <button
          onClick={() => onSelect(AccountType.PARENT)}
          className={`p-8 rounded-xl border-2 transition-all text-left
            ${
              selectedType === AccountType.PARENT
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
        >
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('onboarding.step1.parent.title')}
          </h3>
          <p className="text-gray-600">
            {t('onboarding.step1.parent.description')}
          </p>
        </button>
      </div>
    </div>
  );
}
