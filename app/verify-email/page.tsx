'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setResendState('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendState('success');
        setCooldown(60);
        setTimeout(() => setResendState('idle'), 3000);
      } else if (response.status === 429) {
        setResendState('error');
        setErrorMessage(t('verifyEmail.errors.rateLimited'));
        setCooldown(data.retryAfter || 60);
      } else {
        setResendState('error');
        setErrorMessage(data.error || t('verifyEmail.errors.sendFailed'));
      }
    } catch {
      setResendState('error');
      setErrorMessage(t('verifyEmail.errors.networkError'));
    }
  };

  const getErrorContent = () => {
    switch (error) {
      case 'invalid':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          title: t('verifyEmail.errors.invalidTitle'),
          message: t('verifyEmail.errors.invalidMessage'),
        };
      case 'expired':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: t('verifyEmail.errors.expiredTitle'),
          message: t('verifyEmail.errors.expiredMessage'),
        };
      case 'user-not-found':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          title: t('verifyEmail.errors.userNotFoundTitle'),
          message: t('verifyEmail.errors.userNotFoundMessage'),
        };
      case 'server':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          title: t('verifyEmail.errors.serverTitle'),
          message: t('verifyEmail.errors.serverMessage'),
        };
      default:
        return null;
    }
  };

  const errorContent = getErrorContent();

  if (errorContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            {errorContent.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {errorContent.title}
          </h1>
          <p className="text-gray-600 mb-8">
            {errorContent.message}
          </p>

          {email && (error === 'expired' || error === 'invalid') && (
            <button
              onClick={handleResend}
              disabled={resendState === 'loading' || cooldown > 0}
              className="w-full mb-4 px-6 py-3 bg-[#91C549] text-white rounded-lg font-medium hover:bg-[#7AB339] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resendState === 'loading' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t('verifyEmail.sending')}
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="w-5 h-5" />
                  {t('verifyEmail.waitSeconds', { seconds: cooldown.toString() })}
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {t('verifyEmail.resendButton')}
                </>
              )}
            </button>
          )}

          <Link
            href="/login"
            className="text-[#91C549] hover:underline font-medium"
          >
            {t('verifyEmail.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#91C549]/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-[#91C549]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('verifyEmail.title')}
        </h1>

        <p className="text-gray-600 mb-2">
          {t('verifyEmail.subtitle')}
        </p>

        {email && (
          <p className="text-[#91C549] font-medium mb-6">
            {email}
          </p>
        )}

        <p className="text-gray-500 text-sm mb-8">
          {t('verifyEmail.checkInbox')}
        </p>

        {resendState === 'success' && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm">
              {t('verifyEmail.resendSuccess')}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">
              {errorMessage}
            </p>
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resendState === 'loading' || cooldown > 0 || !email}
          className="w-full mb-4 px-6 py-3 bg-[#91C549] text-white rounded-lg font-medium hover:bg-[#7AB339] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {resendState === 'loading' ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {t('verifyEmail.sending')}
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock className="w-5 h-5" />
              {t('verifyEmail.waitSeconds', { seconds: cooldown.toString() })}
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              {t('verifyEmail.resendButton')}
            </>
          )}
        </button>

        <p className="text-gray-500 text-sm mb-6">
          {t('verifyEmail.checkSpam')}
        </p>

        <div className="border-t pt-6">
          <Link
            href="/login"
            className="text-[#91C549] hover:underline font-medium"
          >
            {t('verifyEmail.alreadyVerified')}
          </Link>
        </div>
      </div>
    </div>
  );
}
