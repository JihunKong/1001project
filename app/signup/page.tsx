'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

const ROLE_OPTIONS = [
  {
    value: 'LEARNER',
    label: 'Student/Learner',
    description: 'Read and learn from cultural stories',
    icon: '📚'
  },
  {
    value: 'TEACHER',
    label: 'Educator',
    description: 'Assign books and guide student learning',
    icon: '🎓'
  },
  {
    value: 'WRITER',
    label: 'Storyteller/Writer',
    description: 'Contribute and share cultural stories',
    icon: '✍️'
  }
];

export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'LEARNER',
    classCode: '',
    termsAccepted: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
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

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Account created successfully! Check your email for a verification link.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
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
      <div className="max-w-lg w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join 1001 Stories
          </h1>
          <p className="text-gray-600 mb-6">
            Create your account and start your cultural storytelling journey
          </p>
        </div>

        {/* Error Display */}
        {message && (
          <div
            role="alert"
            aria-live="polite"
            className={`border rounded-md p-4 ${
              message.includes('created')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex">
              <span className={`mr-2 ${message.includes('created') ? 'text-green-500' : 'text-red-500'}`} aria-hidden="true">
                {message.includes('created') ? '✅' : '⚠️'}
              </span>
              <div>
                <h3 className="text-sm font-medium">
                  {message.includes('created') ? 'Success!' : 'Registration Error'}
                </h3>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Social Signup Buttons */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 mb-4">
            Quick signup with your account
          </p>

          {socialProviders.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleSocialSignup(provider.id)}
              disabled={loading || socialLoading === provider.id}
              className={`
                w-full flex items-center justify-center px-4 py-3 border rounded-lg
                font-medium text-sm transition-all duration-200
                ${provider.bgColor} ${provider.textColor} ${provider.borderColor}
                hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${keyboardNavigation ? 'focus:ring-2' : ''}
              `}
              aria-label={`Sign up with ${provider.name}`}
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
            <span className="px-2 bg-white text-gray-500">or create account with email</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
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
                w-full px-3 py-3 border rounded-lg shadow-sm
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                focus:border-transparent transition-colors duration-200
                ${getFieldError('name') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                ${focusedField === 'name' ? 'ring-2 ring-soe-green-400' : ''}
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
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
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
                w-full px-3 py-3 border rounded-lg shadow-sm
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                focus:border-transparent transition-colors duration-200
                ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                ${focusedField === 'email' ? 'ring-2 ring-soe-green-400' : ''}
              `}
              placeholder="your.email@example.com"
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

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a... *
            </label>
            <div className="space-y-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleSelect(option.value)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    formData.role === option.value
                      ? 'border-soe-green-400 bg-soe-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl" aria-hidden="true">{option.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{option.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Class Code for Students */}
          {formData.role === 'LEARNER' && (
            <div>
              <label
                htmlFor="classCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teacher&apos;s Class Code (Optional)
              </label>
              <input
                id="classCode"
                name="classCode"
                type="text"
                value={formData.classCode}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soe-green-400
                          focus:border-transparent transition-colors duration-200"
                placeholder="Enter 6-character class code"
                maxLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 Get this code from your teacher to automatically join their class
              </p>
            </div>
          )}

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className={`mt-1 h-4 w-4 text-soe-green-400 focus:ring-soe-green-400 border-gray-300 rounded
                         ${getFieldError('termsAccepted') ? 'border-red-300' : ''}`}
              aria-invalid={!!getFieldError('termsAccepted')}
              aria-describedby={getFieldError('termsAccepted') ? 'terms-error' : undefined}
            />
            <div className="text-sm">
              <label htmlFor="termsAccepted" className="text-gray-700">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-soe-green-400 hover:text-soe-green-500 underline"
                  target="_blank"
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link
                  href="/privacy"
                  className="text-soe-green-400 hover:text-soe-green-500 underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
              {getFieldError('termsAccepted') && (
                <p
                  id="terms-error"
                  role="alert"
                  className="mt-1 text-red-600"
                >
                  {getFieldError('termsAccepted')?.message}
                </p>
              )}
            </div>
          </div>

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
            aria-label="Create your account"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-soe-green-400 hover:text-soe-green-500 focus:outline-none focus:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Cultural Context */}
        <div className="bg-soe-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-soe-green-800">
            🌍 Join a global community dedicated to preserving and sharing cultural heritage through storytelling
          </p>
        </div>
      </div>
    </div>
  );
}