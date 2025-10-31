'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setError('Failed to send magic link. Please try again.');
      } else {
        setMessage('Check your email! We sent you a magic link to sign in.');
        setEmail('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-8">
            <Link href="/" className="text-2xl font-semibold text-[#91C549]">
              1001 Stories
            </Link>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
            <h2 className="text-2xl font-normal text-center text-[#171717] mb-4">
              Forgot Password?
            </h2>
            <p className="text-center text-[#737373] text-sm mb-8">
              No worries! We&apos;ll send you a magic link to sign in.
            </p>

            {/* Success Message */}
            {message && (
              <div
                role="alert"
                className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6"
              >
                <div className="flex">
                  <span className="text-green-500 mr-2">✓</span>
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6"
              >
                <div className="flex">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-normal text-[#404040] mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-gray-900
                    placeholder-[#ADAEBC] focus:outline-none focus:ring-2 focus:ring-[#91C549]
                    focus:border-transparent transition-colors duration-200 border-[#D4D4D4]"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent
                  rounded-lg text-base font-normal text-white
                  bg-[#2B2B2B] hover:bg-[#171717] focus:outline-none focus:ring-2
                  focus:ring-offset-2 focus:ring-[#2B2B2B] disabled:opacity-50
                  disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Magic Link'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-[#525252] hover:text-[#2B2B2B] focus:outline-none focus:underline"
              >
                ← Back to Login
              </Link>
            </div>
          </div>

          {/* Terms & Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#737373]">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-[#737373] hover:text-[#2B2B2B] underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#737373] hover:text-[#2B2B2B] underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#91C549]/70 to-[#04A59D]/70 items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-5xl font-semibold mb-6">
            We&apos;ve Got You Covered
          </h1>
          <p className="text-2xl font-semibold opacity-90">
            Just enter your email and we&apos;ll send you a magic link
          </p>
        </div>
      </div>
    </div>
  );
}
