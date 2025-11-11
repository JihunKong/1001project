'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function DirectionUpdater() {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
  }, [language, isRTL]);

  return null;
}
