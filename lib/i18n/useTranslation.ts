'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, isRTLLanguage } from './language-cookie';
import { useLanguage } from './LanguageContext';
import enTranslations from '@/locales/generated/en.json';

type TranslationData = Record<string, any>;

const translationsCache: Map<SupportedLanguage, TranslationData> = new Map();

translationsCache.set('en', enTranslations);

async function loadTranslations(lang: SupportedLanguage, signal?: AbortSignal): Promise<TranslationData> {
  if (translationsCache.has(lang)) {
    return translationsCache.get(lang)!;
  }

  try {
    const response = await fetch(`/api/translations/${lang}`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    const data = await response.json();
    translationsCache.set(lang, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    if (lang !== 'en') {
      return loadTranslations('en', signal);
    }
    return {};
  }
}

function getNestedValue(obj: any, path: string, fallbackObj?: any): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      if (fallbackObj) {
        return getNestedValue(fallbackObj, path);
      }
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

function interpolate(str: string, params?: Record<string, any>): string {
  if (!params) return str;

  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export interface UseTranslationReturn {
  t: (key: string, params?: Record<string, any>) => string;
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
    const abortController = new AbortController();
    setIsLoading(true);

    loadTranslations(language, abortController.signal)
      .then(data => {
        if (!abortController.signal.aborted) {
          setTranslations({ ...data });
          setIsLoading(false);
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('[useTranslation] Failed to load translations for:', language, error);
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, any>): string => {
    const value = getNestedValue(translations, key, enTranslations);
    if (!value && value !== '') {
      console.warn('[useTranslation] Missing translation key:', key, 'for language:', language);
    }
    return interpolate(value, params);
  }, [translations, language]);

  return {
    t,
    language,
    setLanguage: changeLanguage,
    isRTL,
    isLoading,
  };
}
