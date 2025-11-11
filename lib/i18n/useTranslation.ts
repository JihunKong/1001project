'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, isRTLLanguage } from './language-cookie';
import { useLanguage } from './LanguageContext';
import enTranslations from '@/locales/generated/en.json';

type TranslationData = Record<string, any>;

const translationsCache: Map<SupportedLanguage, TranslationData> = new Map();

translationsCache.set('en', enTranslations);

async function loadTranslations(lang: SupportedLanguage): Promise<TranslationData> {
  if (translationsCache.has(lang)) {
    return translationsCache.get(lang)!;
  }

  try {
    const response = await fetch(`/api/translations/${lang}`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    const data = await response.json();
    translationsCache.set(lang, data);
    return data;
  } catch (error) {
    if (lang !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

export interface UseTranslationReturn {
  t: (key: string) => string;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isRTL: boolean;
  isLoading: boolean;
}

export function useTranslation(): UseTranslationReturn {
  const { language, changeLanguage, isRTL } = useLanguage();
  const [translations, setTranslations] = useState<TranslationData>(enTranslations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    loadTranslations(language)
      .then(data => {
        setTranslations({ ...data });
        setIsLoading(false);
      })
      .catch(error => {
        console.error('[useTranslation] Failed to load translations for:', language, error);
        setIsLoading(false);
      });
  }, [language]);

  const t = useCallback((key: string): string => {
    const value = getNestedValue(translations, key);
    if (!value && value !== '') {
      console.warn('[useTranslation] Missing translation key:', key, 'for language:', language);
    }
    return value;
  }, [translations, language]);

  return {
    t,
    language,
    setLanguage: changeLanguage,
    isRTL,
    isLoading,
  };
}
