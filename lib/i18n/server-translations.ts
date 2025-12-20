import fs from 'fs';
import path from 'path';
import { SupportedLanguage } from './language-cookie';

export interface EmailVerificationTranslations {
  subject: string;
  title: string;
  greeting: string;
  message: string;
  buttonText: string;
  linkNote: string;
  expireNote: string;
  ignoreNote: string;
}

export interface VerifyEmailPageTranslations {
  title: string;
  subtitle: string;
  checkInbox: string;
  checkSpam: string;
  resendButton: string;
  resendSuccess: string;
  resendError: string;
  resendCooldown: string;
  alreadyVerified: string;
  loginLink: string;
  emailSentTo: string;
  successTitle: string;
  successMessage: string;
  continueButton: string;
  errorInvalidToken: string;
  errorExpiredToken: string;
  errorUserNotFound: string;
  errorAlreadyVerified: string;
}

const defaultEmailVerificationTranslations: EmailVerificationTranslations = {
  subject: 'Verify your email - 1001 Stories',
  title: 'Verify your email address',
  greeting: 'Welcome to 1001 Stories!',
  message: 'Click the button below to verify your email address and start your learning journey.',
  buttonText: 'Verify Email',
  linkNote: 'Or copy and paste this link in your browser:',
  expireNote: 'This link will expire in 24 hours for security reasons.',
  ignoreNote: "If you didn't create an account with 1001 Stories, you can safely ignore this email.",
};

const defaultVerifyEmailPageTranslations: VerifyEmailPageTranslations = {
  title: 'Verify Your Email',
  subtitle: 'We sent a verification link to your email address',
  checkInbox: 'Please check your inbox and click the verification link to continue.',
  checkSpam: "Don't see the email? Check your spam folder.",
  resendButton: 'Resend Verification Email',
  resendSuccess: 'Verification email sent!',
  resendError: 'Failed to send email. Please try again.',
  resendCooldown: 'Please wait {seconds} seconds before requesting again.',
  alreadyVerified: 'Already verified?',
  loginLink: 'Log in here',
  emailSentTo: 'Email sent to: {email}',
  successTitle: 'Email Verified!',
  successMessage: 'Your email has been successfully verified. You can now access your dashboard.',
  continueButton: 'Continue to Dashboard',
  errorInvalidToken: 'Invalid or expired verification link',
  errorExpiredToken: 'This verification link has expired. Please request a new one.',
  errorUserNotFound: 'User not found',
  errorAlreadyVerified: 'This email is already verified',
};

let translationsCache: Map<SupportedLanguage, Record<string, unknown>> = new Map();

function loadTranslations(language: SupportedLanguage): Record<string, unknown> {
  if (translationsCache.has(language)) {
    return translationsCache.get(language)!;
  }

  try {
    const filePath = path.join(process.cwd(), 'locales', 'generated', `${language}.json`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);
    translationsCache.set(language, translations);
    return translations;
  } catch {
    if (language !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function getEmailVerificationTranslations(language: SupportedLanguage): EmailVerificationTranslations {
  const translations = loadTranslations(language);
  const emailSection = getNestedValue(translations, 'email.verification') as Partial<EmailVerificationTranslations> | undefined;

  if (!emailSection) {
    return defaultEmailVerificationTranslations;
  }

  return {
    subject: emailSection.subject || defaultEmailVerificationTranslations.subject,
    title: emailSection.title || defaultEmailVerificationTranslations.title,
    greeting: emailSection.greeting || defaultEmailVerificationTranslations.greeting,
    message: emailSection.message || defaultEmailVerificationTranslations.message,
    buttonText: emailSection.buttonText || defaultEmailVerificationTranslations.buttonText,
    linkNote: emailSection.linkNote || defaultEmailVerificationTranslations.linkNote,
    expireNote: emailSection.expireNote || defaultEmailVerificationTranslations.expireNote,
    ignoreNote: emailSection.ignoreNote || defaultEmailVerificationTranslations.ignoreNote,
  };
}

export function getVerifyEmailPageTranslations(language: SupportedLanguage): VerifyEmailPageTranslations {
  const translations = loadTranslations(language);
  const pageSection = getNestedValue(translations, 'verifyEmail.page') as Partial<VerifyEmailPageTranslations> | undefined;
  const successSection = getNestedValue(translations, 'verifyEmail.success') as Record<string, string> | undefined;
  const errorSection = getNestedValue(translations, 'verifyEmail.error') as Record<string, string> | undefined;

  if (!pageSection) {
    return defaultVerifyEmailPageTranslations;
  }

  return {
    title: pageSection.title || defaultVerifyEmailPageTranslations.title,
    subtitle: pageSection.subtitle || defaultVerifyEmailPageTranslations.subtitle,
    checkInbox: pageSection.checkInbox || defaultVerifyEmailPageTranslations.checkInbox,
    checkSpam: pageSection.checkSpam || defaultVerifyEmailPageTranslations.checkSpam,
    resendButton: pageSection.resendButton || defaultVerifyEmailPageTranslations.resendButton,
    resendSuccess: pageSection.resendSuccess || defaultVerifyEmailPageTranslations.resendSuccess,
    resendError: pageSection.resendError || defaultVerifyEmailPageTranslations.resendError,
    resendCooldown: pageSection.resendCooldown || defaultVerifyEmailPageTranslations.resendCooldown,
    alreadyVerified: pageSection.alreadyVerified || defaultVerifyEmailPageTranslations.alreadyVerified,
    loginLink: pageSection.loginLink || defaultVerifyEmailPageTranslations.loginLink,
    emailSentTo: pageSection.emailSentTo || defaultVerifyEmailPageTranslations.emailSentTo,
    successTitle: successSection?.title || defaultVerifyEmailPageTranslations.successTitle,
    successMessage: successSection?.message || defaultVerifyEmailPageTranslations.successMessage,
    continueButton: successSection?.continueButton || defaultVerifyEmailPageTranslations.continueButton,
    errorInvalidToken: errorSection?.invalidToken || defaultVerifyEmailPageTranslations.errorInvalidToken,
    errorExpiredToken: errorSection?.expiredToken || defaultVerifyEmailPageTranslations.errorExpiredToken,
    errorUserNotFound: errorSection?.userNotFound || defaultVerifyEmailPageTranslations.errorUserNotFound,
    errorAlreadyVerified: errorSection?.alreadyVerified || defaultVerifyEmailPageTranslations.errorAlreadyVerified,
  };
}

export function clearTranslationsCache(): void {
  translationsCache.clear();
}
