'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  BookOpen,
  ArrowRight,
  Chrome,
  Facebook,
  Apple,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useEmailSignIn, setUseEmailSignIn] = useState(true);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Failed to send verification email. Please try again.');
        toast.error('Failed to send verification email');
      } else {
        toast.success('Check your email for the verification link!');
        router.push('/verify-email');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo account sign in - instant access without email
  const handleDemoSignIn = async (demoEmail: string) => {
    setIsLoading(true);
    try {
      // Check if demo mode is enabled
      const demoStatusResponse = await fetch('/api/auth/demo-login');
      const demoStatus = await demoStatusResponse.json();
      
      if (!demoStatus.demoMode?.enabled) {
        // Fallback to email provider if demo mode is disabled
        const result = await signIn('email', {
          email: demoEmail,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          toast.error('Demo mode is not enabled');
        } else {
          toast.success('Check your email for verification');
          router.push('/verify-email');
        }
        return;
      }

      // Use demo credentials provider for instant access
      const result = await signIn('demo', {
        email: demoEmail,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error('Demo account login failed');
      } else if (result?.ok) {
        toast.success('Demo account access granted! 🎉');
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Demo sign in error:', error);
      toast.error('Failed to access demo account');
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogins = [
    { name: 'Google', icon: Chrome, color: 'bg-red-500 hover:bg-red-600', provider: 'google' },
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700', provider: 'facebook' },
    { name: 'Apple', icon: Apple, color: 'bg-gray-900 hover:bg-black', provider: 'apple' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold gradient-text">1001 Stories</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Social Login */}
        <div className="space-y-3">
          {socialLogins.map((social) => (
            <button
              key={social.name}
              onClick={() => handleOAuthSignIn(social.provider)}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${social.color}`}
            >
              <social.icon className="w-5 h-5" />
              Continue with {social.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or sign in with email</span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <form className="mt-8 space-y-6" onSubmit={handleEmailSignIn}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ 
                    color: 'rgb(17, 24, 39)', 
                    backgroundColor: 'rgb(255, 255, 255)',
                    WebkitTextFillColor: 'rgb(17, 24, 39)',
                    caretColor: 'rgb(17, 24, 39)'
                  }}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-2" />
                Send Magic Link
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Info Message */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              We&apos;ll send you a magic link to sign in without a password. Check your email after clicking the button above.
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up for free
              </Link>
            </p>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900">Try Demo Accounts</h4>
            {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Instant Access
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Click any account below for instant demo access - no email required!
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoSignIn('learner@demo.1001stories.org')}
              disabled={isLoading}
              className="w-full text-left p-2 rounded hover:bg-white/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-blue-900">📚 Learner</span>
                  <p className="text-xs text-gray-500">learner@demo.1001stories.org</p>
                </div>
                <ArrowRight className="w-3 h-3 text-blue-600" />
              </div>
            </button>
            <button
              onClick={() => handleDemoSignIn('teacher@demo.1001stories.org')}
              disabled={isLoading}
              className="w-full text-left p-2 rounded hover:bg-white/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-blue-900">👩‍🏫 Teacher</span>
                  <p className="text-xs text-gray-500">teacher@demo.1001stories.org</p>
                </div>
                <ArrowRight className="w-3 h-3 text-blue-600" />
              </div>
            </button>
            <button
              onClick={() => handleDemoSignIn('volunteer@demo.1001stories.org')}
              disabled={isLoading}
              className="w-full text-left p-2 rounded hover:bg-white/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-blue-900">💝 Volunteer</span>
                  <p className="text-xs text-gray-500">volunteer@demo.1001stories.org</p>
                </div>
                <ArrowRight className="w-3 h-3 text-blue-600" />
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}