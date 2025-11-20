'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  const { t } = useTranslation();

  const errorMessages: Record<string, { title: string; message: string; action: string }> = {
    'AccountLinkingRequired': {
      title: t('auth.errors.accountLinkingRequired.title'),
      message: t('auth.errors.accountLinkingRequired.message'),
      action: '/login'
    },
    'OAuthAccountNotLinked': {
      title: t('auth.errors.oauthNotLinked.title'),
      message: t('auth.errors.oauthNotLinked.message'),
      action: '/dashboard'
    },
    'OAuthSignin': {
      title: t('auth.errors.oauthSignin.title'),
      message: t('auth.errors.oauthSignin.message'),
      action: '/login'
    },
    'OAuthCallback': {
      title: t('auth.errors.oauthCallback.title'),
      message: t('auth.errors.oauthCallback.message'),
      action: '/login'
    },
    'OAuthCreateAccount': {
      title: t('auth.errors.oauthCreateAccount.title'),
      message: t('auth.errors.oauthCreateAccount.message'),
      action: '/login'
    },
    'EmailCreateAccount': {
      title: t('auth.errors.emailCreateAccount.title'),
      message: t('auth.errors.emailCreateAccount.message'),
      action: '/signup'
    },
    'Callback': {
      title: t('auth.errors.callback.title'),
      message: t('auth.errors.callback.message'),
      action: '/login'
    },
    'OAuthAccountNotVerified': {
      title: t('auth.errors.oauthNotVerified.title'),
      message: t('auth.errors.oauthNotVerified.message'),
      action: '/login'
    },
    'EmailSignin': {
      title: t('auth.errors.emailSignin.title'),
      message: t('auth.errors.emailSignin.message'),
      action: '/login'
    },
    'CredentialsSignin': {
      title: t('auth.errors.credentialsSignin.title'),
      message: t('auth.errors.credentialsSignin.message'),
      action: '/login'
    },
    'SessionRequired': {
      title: t('auth.errors.sessionRequired.title'),
      message: t('auth.errors.sessionRequired.message'),
      action: '/login'
    },
    'default': {
      title: t('auth.errors.default.title'),
      message: t('auth.errors.default.message'),
      action: '/login'
    }
  };

  const errorInfo = errorMessages[error as keyof typeof errorMessages] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorInfo.message}
          </p>
        </div>

        {/* Error Details (if available) */}
        {error && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {t('auth.errors.errorCode')}: {error}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href={errorInfo.action}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {t('auth.errors.continueButton')}
          </Link>

          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {t('auth.errors.backToHome')}
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t('auth.errors.needHelp')}{' '}
            <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('auth.errors.contactSupport')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
