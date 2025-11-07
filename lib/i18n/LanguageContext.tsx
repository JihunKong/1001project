'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  SupportedLanguage,
  setLanguagePreferenceClient,
  getLanguagePreferenceClient,
  isRTLLanguage
} from './language-cookie';

interface LanguageContextType {
  language: SupportedLanguage;
  changeLanguage: (newLanguage: SupportedLanguage) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage: SupportedLanguage;
}

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [isRTL, setIsRTL] = useState<boolean>(isRTLLanguage(initialLanguage));

  useEffect(() => {
    const cookieLang = getLanguagePreferenceClient();
    console.log('[LanguageContext] Mount - cookie:', cookieLang, 'initial:', initialLanguage);

    if (cookieLang !== language) {
      console.log('[LanguageContext] Syncing language from cookie:', cookieLang);
      setLanguage(cookieLang);
      setIsRTL(isRTLLanguage(cookieLang));
    }
  }, []);

  const changeLanguage = useCallback((newLanguage: SupportedLanguage) => {
    console.log('[LanguageContext] changeLanguage called:', newLanguage, 'current:', language);

    setLanguagePreferenceClient(newLanguage);
    setLanguage(newLanguage);
    setIsRTL(isRTLLanguage(newLanguage));

    console.log('[LanguageContext] Language state updated, forcing page reload...');

    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
