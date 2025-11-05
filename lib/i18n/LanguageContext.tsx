'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  SupportedLanguage,
  setLanguagePreferenceClient,
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

  const changeLanguage = useCallback((newLanguage: SupportedLanguage) => {
    setLanguagePreferenceClient(newLanguage);
    setLanguage(newLanguage);
    setIsRTL(isRTLLanguage(newLanguage));
    router.refresh();
  }, [router]);

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
