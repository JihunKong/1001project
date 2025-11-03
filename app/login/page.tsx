'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Accessibility and UX state
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  // Handle keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Clear errors when form data changes
  useEffect(() => {
    if (message || validationErrors.length > 0) {
      setMessage('');
      setValidationErrors([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    // Email validation
    if (!formData.email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        code: 'REQUIRED'
      });
    } else if (!isValidEmail(formData.email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'INVALID_FORMAT'
      });
    }

    // Password validation
    if (!formData.password) {
      errors.push({
        field: 'password',
        message: 'Password is required',
        code: 'REQUIRED'
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = validationErrors[0];
      if (firstError) {
        const field = document.getElementById(firstError.field);
        field?.focus();
      }
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setMessage('Invalid email or password. Please try again.');
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);

    try {
      await signIn(provider, {
        callbackUrl,
      });
    } catch (error) {
      setMessage(`Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getFieldError = (field: string): ValidationError | undefined => {
    return validationErrors.find(error => error.field === field);
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Left Column - Login Form */}
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
            <h2 className="text-2xl font-normal text-center text-[#171717] mb-8">
              Welcome Back!
            </h2>

            {/* Error Display */}
            {message && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6"
              >
                <div className="flex">
                  <span className="text-red-500 mr-2" aria-hidden="true">⚠️</span>
                  <div>
                    <h3 className="text-sm font-medium">Authentication Error</h3>
                    <p className="text-sm mt-1">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-normal text-[#404040] mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    w-full px-4 py-3 border rounded-lg text-gray-900
                    placeholder-[#ADAEBC] focus:outline-none focus:ring-2 focus:ring-[#91C549]
                    focus:border-transparent transition-colors duration-200
                    ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                  `}
                  placeholder="Enter your email"
                  aria-invalid={!!getFieldError('email')}
                  aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                />
                {getFieldError('email') && (
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-1 text-sm text-red-600"
                  >
                    {getFieldError('email')?.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-normal text-[#404040] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`
                      w-full px-4 py-3 pr-10 border rounded-lg text-gray-900
                      placeholder-[#ADAEBC] focus:outline-none focus:ring-2 focus:ring-[#91C549]
                      focus:border-transparent transition-colors duration-200
                      ${getFieldError('password') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                    `}
                    placeholder="Enter your password"
                    aria-invalid={!!getFieldError('password')}
                    aria-describedby={getFieldError('password') ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="text-gray-400 hover:text-gray-600">
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </button>
                </div>
                {getFieldError('password') && (
                  <p
                    id="password-error"
                    role="alert"
                    className="mt-1 text-sm text-red-600"
                  >
                    {getFieldError('password')?.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent
                    rounded-lg text-base font-normal text-white
                    bg-[#2B2B2B] hover:bg-[#171717] focus:outline-none focus:ring-2
                    focus:ring-offset-2 focus:ring-[#2B2B2B] disabled:opacity-50
                    disabled:cursor-not-allowed transition-colors duration-200"
                  aria-label="Sign in to your account"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Log In'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  className="w-full flex justify-center py-3 px-4 border border-transparent
                    rounded-lg text-base font-normal text-white
                    bg-[#171717] hover:bg-[#2B2B2B] focus:outline-none focus:ring-2
                    focus:ring-offset-2 focus:ring-[#171717] transition-colors duration-200"
                >
                  Sign Up
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E5E5]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-[#737373]">OR</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading || socialLoading === 'google'}
                className="w-full flex items-center justify-center px-4 py-3 border border-[#D4D4D4]
                  rounded-lg font-normal text-sm text-[#2B2B2B] bg-white
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#91C549]
                  focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
                aria-label="Sign in with Google"
              >
                {socialLoading === 'google' ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Forgot Password & Create Account */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[#525252] hover:text-[#2B2B2B] focus:outline-none focus:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="text-center">
                <span className="text-sm text-[#525252]">
                  Don&apos;t have an account?{' '}
                </span>
                <Link
                  href="/signup"
                  className="text-sm text-[#525252] hover:text-[#2B2B2B] focus:outline-none focus:underline"
                >
                  Create Account
                </Link>
              </div>
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
          <div className="mb-8">
            <Image
              src="/soe-logo-new.png"
              alt="Seeds of Empowerment"
              width={333}
              height={100}
              className="mx-auto"
            />
          </div>
          <h1 className="text-5xl font-semibold mb-6">
            Welcome to 1001 Stories
          </h1>
          <p className="text-2xl font-semibold opacity-90">
            Discover stories from cultures around the world
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91C549] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
