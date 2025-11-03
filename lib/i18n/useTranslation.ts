'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, getLanguagePreferenceClient, setLanguagePreferenceClient, isRTLLanguage } from './language-cookie';

type TranslationData = Record<string, any>;

const translationsCache: Map<SupportedLanguage, TranslationData> = new Map();

async function loadTranslations(lang: SupportedLanguage): Promise<TranslationData> {
  if (translationsCache.has(lang)) {
    return translationsCache.get(lang)!;
  }

  try {
    const response = await fetch(`/locales/generated/${lang}.json`);
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
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const lang = getLanguagePreferenceClient();
    setLanguageState(lang);

    loadTranslations(lang).then(data => {
      setTranslations(data);
      setIsLoading(false);
    });
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    setLanguagePreferenceClient(lang);
    setIsLoading(true);

    loadTranslations(lang).then(data => {
      setTranslations(data);
      setIsLoading(false);
    });
  }, []);

  const t = useCallback((key: string): string => {
    return getNestedValue(translations, key);
  }, [translations]);

  return {
    t,
    language,
    setLanguage,
    isRTL: isRTLLanguage(language),
    isLoading,
  };
}
