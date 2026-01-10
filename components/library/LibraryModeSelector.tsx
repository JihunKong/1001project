'use client';

import { Globe, BookOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SupportedLanguage } from '@/lib/i18n/language-cookie';

export type LibraryMode = 'english' | 'localized';

export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
  ar: 'العربية',
  hi: 'हिन्दी',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  pt: 'Português',
  ru: 'Русский',
  it: 'Italiano',
  zh: '中文'
};

interface LibraryModeSelectorProps {
  currentMode: LibraryMode;
  onModeChange: (mode: LibraryMode) => void;
  userLanguage: SupportedLanguage;
  translatedBookCount?: number;
  className?: string;
}

export function LibraryModeSelector({
  currentMode,
  onModeChange,
  userLanguage,
  translatedBookCount,
  className = ''
}: LibraryModeSelectorProps) {
  const { t } = useTranslation();

  const languageName = LANGUAGE_DISPLAY_NAMES[userLanguage] || userLanguage;

  return (
    <div className={`flex items-center gap-2 p-1 bg-gray-100 rounded-lg ${className}`}>
      <button
        onClick={() => onModeChange('english')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentMode === 'english'
            ? 'bg-white text-primary-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
        aria-pressed={currentMode === 'english'}
      >
        <BookOpen className="w-4 h-4" />
        <span>{t('library.mode.english') || 'English Library'}</span>
      </button>

      <button
        onClick={() => onModeChange('localized')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentMode === 'localized'
            ? 'bg-white text-primary-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
        aria-pressed={currentMode === 'localized'}
        disabled={userLanguage === 'en'}
        title={userLanguage === 'en' ? (t('library.mode.sameAsEnglish') || 'Select a different language first') : ''}
      >
        <Globe className="w-4 h-4" />
        <span>
          {(t('library.mode.localized') || 'Books in {language}').replace('{language}', languageName)}
        </span>
        {translatedBookCount !== undefined && translatedBookCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
            {translatedBookCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default LibraryModeSelector;
