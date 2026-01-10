'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import PasswordRequirements from '@/components/auth/PasswordRequirements';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export default function SignupPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // Form state - role removed, will be set to WRITER on backend
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    termsAccepted: false,
    aiServiceConsent: false,
    dataTransferConsent: false,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

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

  // Real-time password validation
  useEffect(() => {
    const password = formData.password;
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    });
  }, [formData.password]);

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    // Name validation
    if (!formData.name.trim()) {
      errors.push({
        field: 'name',
        message: t('auth.signup.form.fullName.validation.required'),
        code: 'REQUIRED'
      });
    } else if (formData.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: t('auth.signup.form.fullName.validation.minLength'),
        code: 'MIN_LENGTH'
      });
    }

    // Email validation
    if (!formData.email) {
      errors.push({
        field: 'email',
        message: t('auth.common.form.email.validation.required'),
        code: 'REQUIRED'
      });
    } else if (!isValidEmail(formData.email)) {
      errors.push({
        field: 'email',
        message: t('auth.common.form.email.validation.invalid'),
        code: 'INVALID_FORMAT'
      });
    }

    // Password validation
    if (!formData.password) {
      errors.push({
        field: 'password',
        message: t('auth.common.form.password.validation.required'),
        code: 'REQUIRED'
      });
    } else if (formData.password.length < 8) {
      errors.push({
        field: 'password',
        message: t('auth.common.form.password.validation.minLength'),
        code: 'MIN_LENGTH'
      });
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push({
        field: 'password',
        message: t('auth.common.form.password.validation.complexity'),
        code: 'WEAK_PASSWORD'
      });
    }

    // Password confirmation validation
    if (!formData.passwordConfirm) {
      errors.push({
        field: 'passwordConfirm',
        message: t('auth.signup.form.passwordConfirm.validation.required'),
        code: 'REQUIRED'
      });
    } else if (formData.password !== formData.passwordConfirm) {
      errors.push({
        field: 'passwordConfirm',
        message: t('auth.signup.form.passwordConfirm.validation.mismatch'),
        code: 'PASSWORD_MISMATCH'
      });
    }

    // Terms validation
    if (!formData.termsAccepted) {
      errors.push({
        field: 'termsAccepted',
        message: t('auth.signup.form.terms.validation.required'),
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
        setMessage(t('auth.signup.messages.accountCreated'));

        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        setTimeout(() => {
          router.push('/onboarding');
        }, 1500);
      } else {
        setMessage(data.error || t('auth.signup.messages.failed'));
      }
    } catch (error) {
      setMessage(t('auth.common.errors.generic'));
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    setSocialLoading(provider);

    try {
      await signIn(provider, {
        callbackUrl: '/onboarding',
      });
    } catch (error) {
      setMessage(t('auth.signup.messages.socialFailed', { provider }));
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
              {t('auth.common.branding.appName')}
            </Link>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
            <h2 className="text-2xl font-semibold text-center text-[#171717] mb-8">
              {t('auth.signup.header.title')}
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
                      {message.includes('success') ? t('auth.signup.messages.success') : t('auth.signup.messages.error')}
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
                  {t('auth.signup.form.fullName.label')}
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
                    w-full px-3 py-3 border-b bg-transparent text-gray-900
                    placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                    transition-colors duration-200
                    ${getFieldError('name') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                  `}
                  placeholder={t('auth.signup.form.fullName.placeholder')}
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
                  {t('auth.common.form.email.label')}
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
                    w-full px-3 py-3 border-b bg-transparent text-gray-900
                    placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                    transition-colors duration-200
                    ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                  `}
                  placeholder={t('auth.common.form.email.placeholder')}
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
                  {t('auth.common.form.password.label')}
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
                      w-full px-3 py-3 pr-10 border-b bg-transparent text-gray-900
                      placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                      transition-colors duration-200
                      ${getFieldError('password') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                    `}
                    placeholder={t('auth.common.form.password.placeholderNew')}
                    aria-invalid={!!getFieldError('password')}
                    aria-describedby={getFieldError('password') ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? t('auth.common.form.password.hidePassword') : t('auth.common.form.password.showPassword')}
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
                <PasswordRequirements
                  requirements={passwordRequirements}
                  show={formData.password.length > 0}
                />
              </div>

              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-normal text-[#737373] mb-2"
                >
                  {t('auth.signup.form.passwordConfirm.label')}
                </label>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('passwordConfirm')}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    w-full px-3 py-3 border-b bg-transparent text-gray-900
                    placeholder-[#ADAEBC] focus:outline-none focus:border-[#91C549]
                    transition-colors duration-200
                    ${getFieldError('passwordConfirm') ? 'border-red-300 bg-red-50' : 'border-[#D4D4D4]'}
                  `}
                  placeholder={t('auth.signup.form.passwordConfirm.placeholder')}
                  aria-invalid={!!getFieldError('passwordConfirm')}
                  aria-describedby={getFieldError('passwordConfirm') ? 'passwordConfirm-error' : undefined}
                />
                {getFieldError('passwordConfirm') && (
                  <p
                    id="passwordConfirm-error"
                    role="alert"
                    className="mt-1 text-sm text-red-600"
                  >
                    {getFieldError('passwordConfirm')?.message}
                  </p>
                )}
              </div>

              {/* Terms Acceptance Checkbox */}
              <div className="flex items-start gap-3 pt-4">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#91C549] focus:ring-[#91C549]"
                  aria-describedby={getFieldError('termsAccepted') ? 'terms-error' : undefined}
                />
                <label htmlFor="termsAccepted" className="text-sm text-[#737373]">
                  {t('auth.signup.form.terms.label')}
                  <Link href="/terms" className="underline hover:text-[#2B2B2B]">
                    {t('auth.common.footer.termsLink')}
                  </Link>
                  {' '}{t('auth.common.footer.termsConnector')}{' '}
                  <Link href="/privacy" className="underline hover:text-[#2B2B2B]">
                    {t('auth.common.footer.privacyLink')}
                  </Link>
                  {t('auth.signup.form.terms.suffix')}
                </label>
              </div>
              {getFieldError('termsAccepted') && (
                <p
                  id="terms-error"
                  role="alert"
                  className="mt-1 text-sm text-red-600"
                >
                  {getFieldError('termsAccepted')?.message}
                </p>
              )}

              {/* Data Privacy Consents - PIPA/COPPA Compliance */}
              <div className="pt-4 space-y-4 border-t border-gray-100">
                <p className="text-xs text-[#737373] font-medium">
                  {t('auth.signup.form.dataConsent.title')}
                </p>

                {/* AI Service Consent */}
                <div className="flex items-start gap-3">
                  <input
                    id="aiServiceConsent"
                    name="aiServiceConsent"
                    type="checkbox"
                    checked={formData.aiServiceConsent}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#91C549] focus:ring-[#91C549]"
                  />
                  <label htmlFor="aiServiceConsent" className="text-sm text-[#737373]">
                    <span className="font-medium text-[#525252]">
                      {t('auth.signup.form.dataConsent.aiService.label')}
                    </span>
                    <br />
                    <span className="text-xs">
                      {t('auth.signup.form.dataConsent.aiService.description')}
                    </span>
                  </label>
                </div>

                {/* Data Transfer Consent */}
                <div className="flex items-start gap-3">
                  <input
                    id="dataTransferConsent"
                    name="dataTransferConsent"
                    type="checkbox"
                    checked={formData.dataTransferConsent}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#91C549] focus:ring-[#91C549]"
                  />
                  <label htmlFor="dataTransferConsent" className="text-sm text-[#737373]">
                    <span className="font-medium text-[#525252]">
                      {t('auth.signup.form.dataConsent.dataTransfer.label')}
                    </span>
                    <br />
                    <span className="text-xs">
                      {t('auth.signup.form.dataConsent.dataTransfer.description')}
                    </span>
                  </label>
                </div>

                <p className="text-xs text-[#737373] italic">
                  {t('auth.signup.form.dataConsent.optionalNotice')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-8">
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
                    t('auth.common.buttons.signUp')
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
                  {t('auth.common.buttons.logIn')}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E5E5]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-[#737373]">{t('auth.common.divider.or')}</span>
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
                    <span>{t('auth.common.loading.connecting')}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-5 h-5 mr-3 bg-[#A3A3A3] rounded flex items-center justify-center text-white text-sm font-normal">
                      G
                    </div>
                    <span>{t('auth.common.buttons.signInWithGoogle')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Already have account */}
            <div className="mt-6 text-center">
              <span className="text-sm text-[#525252]">
                {t('auth.signup.links.hasAccount')}{' '}
              </span>
              <Link
                href="/login"
                className="text-sm text-[#000000] hover:text-[#2B2B2B] focus:outline-none focus:underline font-normal"
              >
                {t('auth.signup.links.signInHere')}
              </Link>
            </div>
          </div>

          {/* Terms & Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#737373]">
              {t('auth.common.footer.termsPrefix')}{' '}
              <Link href="/terms" className="text-[#737373] hover:text-[#2B2B2B] underline">
                {t('auth.common.footer.termsLink')}
              </Link>
              {' '}{t('auth.common.footer.termsConnector')}{' '}
              <Link href="/privacy" className="text-[#737373] hover:text-[#2B2B2B] underline">
                {t('auth.common.footer.privacyLink')}
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
              alt={t('auth.signup.header.rightPanel.imageAlt')}
              width={300}
              height={300}
              className="mx-auto"
            />
          </div>
          <h1 className="text-5xl font-semibold mb-6">
            {t('auth.signup.header.rightPanel.title')}
          </h1>
          <p className="text-2xl font-semibold opacity-90">
            {t('auth.signup.header.rightPanel.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
