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
    console.log('[language-cookie] No cookie header provided, defaulting to en');
    return 'en';
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const lang = cookies[LANGUAGE_COOKIE_NAME];
  console.log('[language-cookie] Read from headers:', lang);

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return 'en';
}

export function setLanguagePreferenceClient(language: SupportedLanguage): void {
  console.log('[language-cookie] Setting cookie to:', language);

  Cookies.set(LANGUAGE_COOKIE_NAME, language, {
    expires: COOKIE_MAX_AGE_DAYS,
    path: '/',
    sameSite: 'lax'
  });

  const readBack = Cookies.get(LANGUAGE_COOKIE_NAME);
  console.log('[language-cookie] Cookie set, read back value:', readBack);

  if (readBack !== language) {
    console.error('[language-cookie] ⚠️ Cookie set FAILED! Expected:', language, 'Got:', readBack);
  } else {
    console.log('[language-cookie] ✅ Cookie set successfully');
  }
}

export function getLanguagePreferenceClient(): SupportedLanguage {
  if (typeof document === 'undefined') {
    console.log('[language-cookie] SSR context, defaulting to en');
    return 'en';
  }

  const lang = Cookies.get(LANGUAGE_COOKIE_NAME);
  console.log('[language-cookie] Read from client cookie:', lang);

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  console.log('[language-cookie] No valid cookie found, defaulting to en');
  return 'en';
}
