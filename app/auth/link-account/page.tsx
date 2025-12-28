'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

function LinkAccountContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams?.get('email') || '';
  const provider = searchParams?.get('provider') || '';
  const token = searchParams?.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLinkAccount = async () => {
    if (!token || !email || !provider) {
      setError(t('auth.linkAccount.errors.invalidParams'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.linkAccount.errors.linkFailed'));
        return;
      }

      setSuccess(true);

      // Auto sign in with Google after successful linking
      setTimeout(async () => {
        await signIn('google', { callbackUrl: '/dashboard' });
      }, 1500);
    } catch (err) {
      setError(t('auth.linkAccount.errors.linkFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/login');
  };

  const getProviderName = (providerKey: string): string => {
    const providers: Record<string, string> = {
      google: 'Google',
      github: 'GitHub',
      facebook: 'Facebook',
    };
    return providers[providerKey] || providerKey;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.linkAccount.title')}
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600">
            {t('auth.linkAccount.existingAccount', { email })}
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.linkAccount.confirmLink', { provider: getProviderName(provider) })}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {t('auth.linkAccount.success')}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {t('auth.linkAccount.redirecting')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Provider Info */}
        <div className="rounded-md bg-gray-50 p-4">
          <div className="flex items-center">
            {provider === 'google' && (
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getProviderName(provider)}
              </p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!success && (
          <div className="space-y-3">
            <button
              onClick={handleLinkAccount}
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  <span>{t('auth.linkAccount.linking')}</span>
                </div>
              ) : (
                t('auth.linkAccount.linkButton')
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {t('auth.linkAccount.cancel')}
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t('auth.linkAccount.helpText')}{' '}
            <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('auth.errors.contactSupport')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LinkAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LinkAccountContent />
    </Suspense>
  );
}
