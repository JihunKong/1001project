'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const isApproved = status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {isApproved ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Consent Granted!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for providing parental consent. Your child's account is now fully activated
              and they can start exploring stories from around the world.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-green-700 text-left space-y-2">
                <li>• Your child can now log in to their account</li>
                <li>• They can read age-appropriate stories</li>
                <li>• Teachers can assign reading materials</li>
                <li>• You can request data deletion at any time</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Consent Denied
            </h1>
            <p className="text-gray-600 mb-6">
              We respect your decision. The account request has been declined and no personal
              information will be stored or processed.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">What happens now?</h3>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li>• The pending account will be removed</li>
                <li>• No personal data will be retained</li>
                <li>• Your child can request a new account later</li>
              </ul>
            </div>
          </>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/privacy"
            className="block text-green-600 hover:text-green-700 text-sm"
          >
            Read our Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ParentalConsentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
