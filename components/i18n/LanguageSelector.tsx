'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n/language-cookie';
import { useState, useRef, useEffect } from 'react';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
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
  zh: '中文',
};

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/reset-language', { method: 'POST' });
      if (response.ok) {
        setLanguage('en');
        setIsOpen(false);
        // No reload needed - React will handle the translation update
      }
    } catch (error) {
      console.error('[LanguageSelector] Failed to reset language:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Select language"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="hidden sm:inline">{LANGUAGE_NAMES[language]}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  language === lang ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {LANGUAGE_NAMES[lang]}
              </button>
            ))}
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={handleReset}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              {t('common.resetLanguage')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{LANGUAGE_NAMES[language]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
            {t('common.selectLanguage')}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between ${
                  language === lang ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{LANGUAGE_NAMES[lang]}</span>
                {language === lang && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={handleReset}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{t('common.resetLanguage')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
