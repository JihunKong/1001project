'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface Step3LocationProps {
  selectedCountry: string | null;
  selectedLanguage: string | null;
  onCountryChange: (country: string) => void;
  onLanguageChange: (language: string) => void;
}

export default function Step3Location({
  selectedCountry,
  selectedLanguage,
  onCountryChange,
  onLanguageChange,
}: Step3LocationProps) {
  const { t } = useTranslation();

  const languages = [
    { code: 'en', name: t('onboarding.step3.languages.en') },
    { code: 'ko', name: t('onboarding.step3.languages.ko') },
    { code: 'es', name: t('onboarding.step3.languages.es') },
    { code: 'ar', name: t('onboarding.step3.languages.ar') },
    { code: 'hi', name: t('onboarding.step3.languages.hi') },
    { code: 'fr', name: t('onboarding.step3.languages.fr') },
    { code: 'de', name: t('onboarding.step3.languages.de') },
    { code: 'ja', name: t('onboarding.step3.languages.ja') },
    { code: 'pt', name: t('onboarding.step3.languages.pt') },
    { code: 'ru', name: t('onboarding.step3.languages.ru') },
    { code: 'it', name: t('onboarding.step3.languages.it') },
    { code: 'zh', name: t('onboarding.step3.languages.zh') },
  ];

  const countries = [
    'United States',
    'South Korea',
    'United Kingdom',
    'Canada',
    'Australia',
    'Japan',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'China',
    'India',
    'Brazil',
    'Mexico',
    'Other',
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('onboarding.step3.title')}
        </h2>
        <p className="text-lg text-gray-600">
          {t('onboarding.step3.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Country Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('onboarding.step3.countryLabel')}
          </label>
          <select
            value={selectedCountry || ''}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">
              {t('onboarding.step3.countryPlaceholder')}
            </option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('onboarding.step3.languageLabel')}
          </label>
          <select
            value={selectedLanguage || ''}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">
              {t('onboarding.step3.languagePlaceholder')}
            </option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
