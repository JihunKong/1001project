'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface RTLContextType {
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  locale: string;
  script: string;
  culturalColors: Record<string, any>;
  fontFamily?: string;
  applyRTLStyles: (styles: Record<string, any>) => Record<string, any>;
  getDirectionalClass: (baseClass: string) => string;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

interface RTLProviderProps {
  children: React.ReactNode;
  locale?: string;
}

export function RTLProvider({ children, locale: propLocale }: RTLProviderProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const currentLocale = propLocale || language || 'en';
  const direction = currentLocale.startsWith('ar') || currentLocale.startsWith('he') ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';
  const fontFamily = undefined;
  const culturalColors = useMemo(() => ({}), []);

  // Apply RTL styles transformation
  const applyRTLStyles = (styles: Record<string, any>): Record<string, any> => {
    if (!isRTL) return styles;

    const rtlStyles = { ...styles };

    // Transform directional properties for RTL
    const directionalMappings = {
      marginLeft: 'marginRight',
      marginRight: 'marginLeft',
      paddingLeft: 'paddingRight',
      paddingRight: 'paddingLeft',
      borderLeft: 'borderRight',
      borderRight: 'borderLeft',
      borderLeftWidth: 'borderRightWidth',
      borderRightWidth: 'borderLeftWidth',
      borderLeftColor: 'borderRightColor',
      borderRightColor: 'borderLeftColor',
      borderLeftStyle: 'borderRightStyle',
      borderRightStyle: 'borderLeftStyle',
      left: 'right',
      right: 'left',
      textAlign: styles.textAlign === 'left' ? 'right' : styles.textAlign === 'right' ? 'left' : styles.textAlign
    };

    Object.entries(directionalMappings).forEach(([ltr, rtl]) => {
      if (ltr in rtlStyles && rtl !== ltr) {
        const value = rtlStyles[ltr];
        delete rtlStyles[ltr];
        rtlStyles[rtl] = value;
      }
    });

    return rtlStyles;
  };

  // Get directional CSS class names
  const getDirectionalClass = (baseClass: string): string => {
    if (!isRTL) return baseClass;

    const directionalClasses = {
      'text-left': 'text-right',
      'text-right': 'text-left',
      'ml-': 'mr-',
      'mr-': 'ml-',
      'pl-': 'pr-',
      'pr-': 'pl-',
      'border-l': 'border-r',
      'border-r': 'border-l',
      'rounded-l': 'rounded-r',
      'rounded-r': 'rounded-l',
      'flex-row': 'flex-row-reverse',
    };

    let transformedClass = baseClass;
    Object.entries(directionalClasses).forEach(([ltr, rtl]) => {
      if (transformedClass.includes(ltr)) {
        transformedClass = transformedClass.replace(ltr, rtl);
      }
    });

    return transformedClass;
  };

  // Apply document-level RTL styles
  useEffect(() => {
    setMounted(true);

    if (typeof document !== 'undefined') {
      const html = document.documentElement;

      // Set direction
      html.dir = direction;
      html.lang = currentLocale;

      // Apply cultural font family
      if (fontFamily) {
        document.body.style.fontFamily = fontFamily;
      }

      // Apply script-specific styles
      const scriptClasses = {
        arabic: 'arabic-script',
        chinese: 'chinese-script',
        devanagari: 'devanagari-script',
        korean: 'korean-script',
        latin: 'latin-script',
        cyrillic: 'cyrillic-script'
      };

      // Remove previous script classes
      Object.values(scriptClasses).forEach(className => {
        html.classList.remove(className);
      });

      // Add current script class - simplified
      const script = currentLocale.startsWith('ar') ? 'arabic' :
                     currentLocale.startsWith('zh') ? 'chinese' :
                     currentLocale.startsWith('hi') ? 'devanagari' :
                     currentLocale.startsWith('ko') ? 'korean' : 'latin';
      if (scriptClasses[script as keyof typeof scriptClasses]) {
        html.classList.add(scriptClasses[script as keyof typeof scriptClasses]);
      }

      // Add RTL class
      if (isRTL) {
        html.classList.add('rtl');
      } else {
        html.classList.remove('rtl');
      }

      // Apply cultural color CSS variables
      Object.entries(culturalColors).forEach(([key, value]) => {
        const cssValue = typeof value === 'string' ? value : JSON.stringify(value);
        document.documentElement.style.setProperty(`--color-cultural-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, cssValue);
      });
    }
  }, [currentLocale, direction, fontFamily, culturalColors, isRTL]);

  const contextValue: RTLContextType = {
    direction,
    isRTL,
    locale: currentLocale,
    script: currentLocale.startsWith('ar') ? 'arabic' :
            currentLocale.startsWith('zh') ? 'chinese' :
            currentLocale.startsWith('hi') ? 'devanagari' :
            currentLocale.startsWith('ko') ? 'korean' : 'latin',
    culturalColors,
    fontFamily,
    applyRTLStyles,
    getDirectionalClass
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <RTLContext.Provider value={contextValue}>
      <div
        dir={direction}
        className="min-h-screen"
        style={{
          fontFamily: fontFamily || undefined
        }}
      >
        {children}
      </div>
    </RTLContext.Provider>
  );
}

// Hook to use RTL context
export function useRTL(): RTLContextType {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
}

// Utility component for directional layouts
interface DirectionalBoxProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
}

export function DirectionalBox({
  children,
  className = '',
  style = {},
  as: Component = 'div'
}: DirectionalBoxProps) {
  const { applyRTLStyles, getDirectionalClass } = useRTL();

  const transformedStyle = applyRTLStyles(style);
  const transformedClassName = getDirectionalClass(className);

  return (
    <Component
      className={transformedClassName}
      style={transformedStyle}
    >
      {children}
    </Component>
  );
}

// Component for vertical text (CJK languages)
interface VerticalTextProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

export function VerticalText({ children, className = '', enabled }: VerticalTextProps) {
  const { locale, script } = useRTL();

  const shouldUseVertical = enabled !== undefined
    ? enabled
    : ['chinese', 'korean'].includes(script) && locale !== 'en';

  if (!shouldUseVertical) {
    return <>{children}</>;
  }

  return (
    <div
      className={`vertical-text ${className}`}
      style={{
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        height: 'fit-content'
      }}
    >
      {children}
    </div>
  );
}

// Directional Flexbox component
interface DirectionalFlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  reverse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DirectionalFlex({
  children,
  direction = 'row',
  reverse = false,
  className = '',
  style = {}
}: DirectionalFlexProps) {
  const { isRTL, getDirectionalClass } = useRTL();

  // Determine flex direction based on RTL and props
  let flexDirection: string = direction;

  if (direction === 'row') {
    if (isRTL && !reverse) {
      flexDirection = 'row-reverse';
    } else if (!isRTL && reverse) {
      flexDirection = 'row-reverse';
    }
  } else if (reverse) {
    flexDirection = 'column-reverse';
  }

  const transformedClassName = getDirectionalClass(`flex flex-${flexDirection} ${className}`);

  return (
    <div
      className={transformedClassName}
      style={style}
    >
      {children}
    </div>
  );
}