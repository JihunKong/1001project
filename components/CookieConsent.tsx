'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = '1001stories_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365;

export function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: 0,
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent) as CookiePreferences;
        const expiryTime = parsed.timestamp + (CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        if (Date.now() < expiryTime) {
          setPreferences(parsed);
          return;
        }
      } catch {
        // Invalid stored consent, show banner
      }
    }
    setShowBanner(true);
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    const prefsWithTimestamp = { ...prefs, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefsWithTimestamp));
    setPreferences(prefsWithTimestamp);
    setShowBanner(false);
    setShowDetails(false);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  }, [savePreferences]);

  const acceptEssentialOnly = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  }, [savePreferences]);

  const saveCustomPreferences = useCallback(() => {
    savePreferences(preferences);
  }, [preferences, savePreferences]);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {t('cookieConsent.title') || 'Cookie Settings'}
              </h3>
              <p className="text-sm text-gray-600">
                {t('cookieConsent.description') ||
                  'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('cookieConsent.customize') || 'Customize'}
              </button>
              <button
                onClick={acceptEssentialOnly}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('cookieConsent.essentialOnly') || 'Essential Only'}
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('cookieConsent.acceptAll') || 'Accept All'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('cookieConsent.customizeTitle') || 'Cookie Preferences'}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      {t('cookieConsent.essential.title') || 'Essential Cookies'}
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                      {t('cookieConsent.required') || 'Required'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookieConsent.essential.description') ||
                      'These cookies are necessary for the website to function and cannot be disabled. They include session management, authentication, and security features.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 w-5 h-5 text-green-600 rounded cursor-not-allowed"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {t('cookieConsent.analytics.title') || 'Analytics Cookies'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookieConsent.analytics.description') ||
                      'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1 w-5 h-5 text-green-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {t('cookieConsent.marketing.title') || 'Marketing Cookies'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookieConsent.marketing.description') ||
                      'These cookies are used to track visitors across websites to display relevant advertisements.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="mt-1 w-5 h-5 text-green-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={acceptEssentialOnly}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('cookieConsent.essentialOnly') || 'Essential Only'}
              </button>
              <button
                onClick={saveCustomPreferences}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('cookieConsent.savePreferences') || 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent) as CookiePreferences;
        setConsent(parsed);
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return {
    hasConsent: consent !== null,
    analyticsEnabled: consent?.analytics ?? false,
    marketingEnabled: consent?.marketing ?? false,
  };
}
