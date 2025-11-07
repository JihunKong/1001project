import Cookies from 'js-cookie';

export type SupportedLanguage = 'en' | 'ko' | 'es' | 'ar' | 'hi' | 'fr' | 'de' | 'ja' | 'pt' | 'ru' | 'it' | 'zh';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ko', 'es', 'ar', 'hi', 'fr', 'de', 'ja', 'pt', 'ru', 'it', 'zh'];

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

const LANGUAGE_COOKIE_NAME = 'preferred-language';
const COOKIE_MAX_AGE_DAYS = 30;

export function isRTLLanguage(lang: SupportedLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

export function getLanguagePreferenceFromHeaders(cookieHeader?: string): SupportedLanguage {
  if (!cookieHeader) {
    return 'en';
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const lang = cookies[LANGUAGE_COOKIE_NAME];

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return 'en';
}

export function setLanguagePreferenceClient(language: SupportedLanguage): void {
  Cookies.set(LANGUAGE_COOKIE_NAME, language, {
    expires: COOKIE_MAX_AGE_DAYS,
    path: '/',
    sameSite: 'lax'
  });
}

export function getLanguagePreferenceClient(): SupportedLanguage {
  if (typeof document === 'undefined') {
    return 'en';
  }

  const lang = Cookies.get(LANGUAGE_COOKIE_NAME);

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return 'en';
}
