import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import koCommon from '@/locales/ko/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  ko: {
    common: koCommon,
  },
  es: {
    common: enCommon, // Default to English for now
  },
  fr: {
    common: enCommon, // Default to English for now
  },
  zh: {
    common: enCommon, // Default to English for now
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;