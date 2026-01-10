'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Clock, ShieldX, HelpCircle } from 'lucide-react';
import { Suspense } from 'react';

const errorMessages: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
  missing_params: {
    title: 'Invalid Link',
    message: 'The consent link appears to be incomplete. Please use the link from the email we sent.',
    icon: <ShieldX className="w-12 h-12 text-red-500" />
  },
  invalid_params: {
    title: 'Invalid Request',
    message: 'The consent request contains invalid information. Please try again using the original email link.',
    icon: <ShieldX className="w-12 h-12 text-red-500" />
  },
  invalid_token: {
    title: 'Invalid Token',
    message: 'The consent token is invalid or has been tampered with. Please request a new consent email.',
    icon: <ShieldX className="w-12 h-12 text-red-500" />
  },
  consent_not_found: {
    title: 'Consent Not Found',
    message: 'We could not find a pending consent request. It may have already been processed or expired.',
    icon: <HelpCircle className="w-12 h-12 text-yellow-500" />
  },
  expired: {
    title: 'Link Expired',
    message: 'This consent link has expired. Consent links are valid for 7 days. Please have your child register again.',
    icon: <Clock className="w-12 h-12 text-orange-500" />
  },
  server_error: {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error processing your request. Please try again later or contact support.',
    icon: <AlertTriangle className="w-12 h-12 text-red-500" />
  }
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'server_error';

  const errorInfo = errorMessages[reason] || errorMessages.server_error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {errorInfo.icon}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {errorInfo.title}
        </h1>

        <p className="text-gray-600 mb-6">
          {errorInfo.message}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700">
            If you continue to experience issues, please contact our support team at{' '}
            <a href="mailto:support@1001stories.org" className="underline">
              support@1001stories.org
            </a>
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/signup"
            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ParentalConsentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
