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

  // Sync cookie language on initial mount only
  useEffect(() => {
    const cookieLang = getLanguagePreferenceClient();

    if (cookieLang !== initialLanguage) {
      setLanguage(cookieLang);
      setIsRTL(isRTLLanguage(cookieLang));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const changeLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    setLanguagePreferenceClient(newLanguage);
    setLanguage(newLanguage);
    setIsRTL(isRTLLanguage(newLanguage));

    try {
      await fetch(`/api/translations/${newLanguage}`);
    } catch (error) {
      console.error('[LanguageContext] Failed to preload translations:', error);
    }

    // No reload needed - React will automatically update translations via useTranslation hook
  }, []);

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
