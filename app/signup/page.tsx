'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export default function SignupPage() {
  const router = useRouter();

  // Form state - role removed, will be set to WRITER on backend
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    termsAccepted: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
  }, [formData, message, validationErrors.length]);

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    // Name validation
    if (!formData.name.trim()) {
      errors.push({
        field: 'name',
        message: 'Full name is required',
        code: 'REQUIRED'
      });
    } else if (formData.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'Name must be at least 2 characters',
        code: 'MIN_LENGTH'
      });
    }

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
    } else if (formData.password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters',
        code: 'MIN_LENGTH'
      });
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain uppercase, lowercase, and number',
        code: 'WEAK_PASSWORD'
      });
    }

    // Terms validation
    if (!formData.termsAccepted) {
      errors.push({
        field: 'termsAccepted',
        message: 'You must accept the terms of service',
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    setSocialLoading(provider);

    try {
      await signIn(provider, {
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      console.error(`${provider} signup failed:`, error);
      setMessage(`Failed to sign up with ${provider}. Please try again.`);
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
      {/* Left Column - Signup Form */}
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
            <h2 className="text-2xl font-semibold text-center text-[#171717] mb-8">
              Welcome to Our Family!
            </h2>

            {/* Message Display */}
            {message && (
              <div
                role="alert"
                aria-live="polite"
                className={`border rounded-lg p-4 mb-6 ${
                  message.includes('success')
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <div className="flex">
                  <span className={`mr-2 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`} aria-hidden="true">
                    {message.includes('success') ? '✅' : '⚠️'}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">
                      {message.includes('success') ? 'Success!' : 'Registration Error'}
                    </h3>
                    <p className="text-sm mt-1">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-normal text-[#737373] mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    w-full px-3 py-3 border-b bg-transparent
                    placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                    transition-colors duration-200
                    ${getFieldError('name') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                  `}
                  placeholder="Enter your full name"
                  aria-invalid={!!getFieldError('name')}
                  aria-describedby={getFieldError('name') ? 'name-error' : undefined}
                />
                {getFieldError('name') && (
                  <p
                    id="name-error"
                    role="alert"
                    className="mt-1 text-sm text-red-600"
                  >
                    {getFieldError('name')?.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-normal text-[#737373] mb-2"
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
                    w-full px-3 py-3 border-b bg-transparent
                    placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                    transition-colors duration-200
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
                  className="block text-sm font-normal text-[#737373] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`
                      w-full px-3 py-3 pr-10 border-b bg-transparent
                      placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                      transition-colors duration-200
                      ${getFieldError('password') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                    `}
                    placeholder="Create a password"
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
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="py-3 px-4 border border-transparent rounded
                    text-base font-normal text-white bg-[#000000]
                    hover:bg-[#2B2B2B] focus:outline-none focus:ring-2
                    focus:ring-offset-2 focus:ring-[#000000] disabled:opacity-50
                    disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="py-3 px-4 border border-[#D4D4D4] rounded
                    text-base font-normal text-[#404040] bg-white
                    hover:bg-gray-50 focus:outline-none focus:ring-2
                    focus:ring-offset-2 focus:ring-[#91C549] transition-colors duration-200"
                >
                  Log In
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

            {/* Social Signup */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialSignup('google')}
                disabled={loading || socialLoading === 'google'}
                className="w-full flex items-center justify-center px-4 py-3 border border-[#D4D4D4]
                  rounded font-normal text-sm text-[#404040] bg-white
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#91C549]
                  focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
                aria-label="Sign up with Google"
              >
                {socialLoading === 'google' ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-5 h-5 mr-3 bg-[#A3A3A3] rounded flex items-center justify-center text-white text-sm font-normal">
                      G
                    </div>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Already have account */}
            <div className="mt-6 text-center">
              <span className="text-sm text-[#525252]">
                Already have an account?{' '}
              </span>
              <Link
                href="/login"
                className="text-sm text-[#000000] hover:text-[#2B2B2B] focus:outline-none focus:underline font-normal"
              >
                Sign in here
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
          <div className="mb-8">
            <Image
              src="/images/signup-illustration.svg"
              alt="Join our family"
              width={300}
              height={300}
              className="mx-auto"
            />
          </div>
          <h1 className="text-5xl font-semibold mb-6">
            Join 1001 Stories
          </h1>
          <p className="text-2xl font-semibold opacity-90">
            Share your cultural stories with the world
          </p>
        </div>
      </div>
    </div>
  );
}
