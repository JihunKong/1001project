'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
  const [loginMethod, setLoginMethod] = useState<'email' | 'credentials'>('email');

  // Accessibility and UX state
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl);
      }
    });
  }, [router, callbackUrl]);

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

    // Password validation for credentials method
    if (loginMethod === 'credentials') {
      if (!formData.password) {
        errors.push({
          field: 'password',
          message: 'Password is required',
          code: 'REQUIRED'
        });
      } else if (formData.password.length < 6) {
        errors.push({
          field: 'password',
          message: 'Password must be at least 6 characters',
          code: 'MIN_LENGTH'
        });
      }
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
      // Focus on first error field
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
      if (loginMethod === 'credentials') {
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          callbackUrl,
        });
      } else {
        const result = await signIn('email', {
          email: formData.email,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setMessage('Failed to send login email. Please try again.');
        } else {
          setMessage('Check your email for a login link!');
        }
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
      console.error(`${provider} login failed:`, error);
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

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      bgColor: 'bg-white',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: '📱',
      bgColor: 'bg-gray-900',
      textColor: 'text-white',
      borderColor: 'border-gray-900'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-soe-green-50 to-green-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to 1001 Stories
          </h1>
          <p className="text-gray-600 mb-6">
            Discover and share stories from cultures around the world
          </p>
        </div>

        {/* Error Display */}
        {message && (
          <div
            role="alert"
            aria-live="polite"
            className={`border rounded-md p-4 ${
              message.includes('Check your email')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex">
              <span className={`mr-2 ${message.includes('Check your email') ? 'text-green-500' : 'text-red-500'}`} aria-hidden="true">
                {message.includes('Check your email') ? '✅' : '⚠️'}
              </span>
              <div>
                <h3 className="text-sm font-medium">
                  {message.includes('Check your email') ? 'Success!' : 'Authentication Error'}
                </h3>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'email'
                  ? 'bg-white text-soe-green-400 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('credentials')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'credentials'
                  ? 'bg-white text-soe-green-400 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Password
            </button>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 mb-4">
            Sign in with your preferred method
          </p>

          {socialProviders.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleSocialLogin(provider.id)}
              disabled={loading || socialLoading === provider.id}
              className={`
                w-full flex items-center justify-center px-4 py-3 border rounded-lg
                font-medium text-sm transition-all duration-200
                ${provider.bgColor} ${provider.textColor} ${provider.borderColor}
                hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${keyboardNavigation ? 'focus:ring-2' : ''}
              `}
              aria-label={`Sign in with ${provider.name}`}
            >
              {socialLoading === provider.id ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <span className="mr-2" aria-hidden="true">{provider.icon}</span>
                  <span>Continue with {provider.name}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or continue with email</span>
          </div>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
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
                w-full px-3 py-3 border rounded-lg shadow-sm text-gray-900
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                focus:border-transparent transition-colors duration-200
                ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                ${focusedField === 'email' ? 'ring-2 ring-soe-green-400' : ''}
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

          {loginMethod === 'credentials' && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                    w-full px-3 py-3 pr-10 border rounded-lg shadow-sm text-gray-900
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                    focus:border-transparent transition-colors duration-200
                    ${getFieldError('password') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    ${focusedField === 'password' ? 'ring-2 ring-soe-green-400' : ''}
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
          )}

          {loginMethod === 'credentials' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-soe-green-400 focus:ring-soe-green-400 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-soe-green-400 hover:text-soe-green-500 focus:outline-none focus:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`
              w-full flex justify-center py-3 px-4 border border-transparent
              rounded-lg shadow-sm text-sm font-medium text-white
              bg-soe-green-400 hover:bg-soe-green-500 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-soe-green-400 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors duration-200
              ${keyboardNavigation ? 'focus:ring-2' : ''}
            `}
            aria-label="Sign in to your account"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              loginMethod === 'credentials' ? 'Sign In' : 'Send Magic Link'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-soe-green-400 hover:text-soe-green-500 focus:outline-none focus:underline"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Cultural Context */}
        <div className="bg-soe-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-soe-green-800">
            🌍 Join storytellers from around the world in preserving and sharing cultural heritage
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}