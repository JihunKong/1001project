import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface KoreanVerificationResult {
  success: boolean;
  verified: boolean;
  method?: KoreanVerificationMethod;
  error?: string;
  code?: string;
}

export type KoreanVerificationMethod =
  | 'IPIN' // i-PIN verification
  | 'MOBILE' // Mobile phone verification
  | 'CREDIT_CARD' // Credit card verification
  | 'PARENTAL_PAYMENT'; // Parent's payment method

export interface PIPAComplianceStatus {
  isKoreanResident: boolean;
  isUnder14: boolean;
  requiresLegalGuardianConsent: boolean;
  consentObtained: boolean;
  verificationMethod?: KoreanVerificationMethod;
  consentDate?: Date;
}

const KOREAN_AGE_OF_CONSENT = 14;

export function isUnder14Korean(dateOfBirth: Date): boolean {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age < KOREAN_AGE_OF_CONSENT;
}

export function isKoreanUser(country?: string, language?: string): boolean {
  if (country === 'KR' || country === 'Korea' || country === '한국') {
    return true;
  }
  if (language === 'ko') {
    return true;
  }
  return false;
}

export async function checkPIPACompliance(
  userId: string
): Promise<PIPAComplianceStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          dateOfBirth: true,
          country: true,
          language: true,
          isMinor: true,
          parentalConsentStatus: true,
          parentalConsentDate: true,
        },
      },
    },
  });

  if (!user || !user.profile) {
    return {
      isKoreanResident: false,
      isUnder14: false,
      requiresLegalGuardianConsent: false,
      consentObtained: false,
    };
  }

  const { profile } = user;
  const isKorean = isKoreanUser(profile.country || undefined, profile.language);
  const isUnder14 = profile.dateOfBirth
    ? isUnder14Korean(profile.dateOfBirth)
    : false;

  const requiresConsent = isKorean && isUnder14;
  const hasConsent = profile.parentalConsentStatus === 'GRANTED';

  return {
    isKoreanResident: isKorean,
    isUnder14,
    requiresLegalGuardianConsent: requiresConsent,
    consentObtained: hasConsent,
    consentDate: profile.parentalConsentDate || undefined,
  };
}

export async function initiateKoreanVerification(
  userId: string,
  method: KoreanVerificationMethod,
  parentInfo: {
    name: string;
    email: string;
    phone?: string;
  }
): Promise<KoreanVerificationResult> {
  try {
    const complianceStatus = await checkPIPACompliance(userId);

    if (!complianceStatus.requiresLegalGuardianConsent) {
      return {
        success: true,
        verified: true,
        error: 'Verification not required for this user',
      };
    }

    if (complianceStatus.consentObtained) {
      return {
        success: true,
        verified: true,
        method: complianceStatus.verificationMethod,
      };
    }

    switch (method) {
      case 'IPIN':
        return initiateIPINVerification(userId, parentInfo);
      case 'MOBILE':
        return initiateMobileVerification(userId, parentInfo);
      case 'CREDIT_CARD':
      case 'PARENTAL_PAYMENT':
        return initiatePaymentVerification(userId, parentInfo);
      default:
        return {
          success: false,
          verified: false,
          error: 'Invalid verification method',
          code: 'INVALID_METHOD',
        };
    }
  } catch (error) {
    logger.error('Korean verification initiation failed', error);
    return {
      success: false,
      verified: false,
      error: 'Verification initiation failed',
      code: 'INIT_FAILED',
    };
  }
}

async function initiateIPINVerification(
  userId: string,
  parentInfo: { name: string; email: string; phone?: string }
): Promise<KoreanVerificationResult> {
  logger.info('i-PIN verification initiated', { userId, parentEmail: parentInfo.email });

  await prisma.profile.update({
    where: { userId },
    data: {
      parentEmail: parentInfo.email,
      parentName: parentInfo.name,
      parentalConsentStatus: 'PENDING',
    },
  });

  return {
    success: true,
    verified: false,
    method: 'IPIN',
    error:
      'i-PIN verification requires integration with Korea Internet & Security Agency (KISA). Please complete verification via the external i-PIN service.',
    code: 'EXTERNAL_VERIFICATION_REQUIRED',
  };
}

async function initiateMobileVerification(
  userId: string,
  parentInfo: { name: string; email: string; phone?: string }
): Promise<KoreanVerificationResult> {
  if (!parentInfo.phone) {
    return {
      success: false,
      verified: false,
      error: 'Phone number is required for mobile verification',
      code: 'PHONE_REQUIRED',
    };
  }

  logger.info('Mobile verification initiated', { userId, parentPhone: parentInfo.phone });

  await prisma.profile.update({
    where: { userId },
    data: {
      parentEmail: parentInfo.email,
      parentName: parentInfo.name,
      phone: parentInfo.phone,
      parentalConsentStatus: 'PENDING',
    },
  });

  return {
    success: true,
    verified: false,
    method: 'MOBILE',
    error:
      'Mobile verification requires integration with Korean telecom providers. Please complete verification via SMS.',
    code: 'EXTERNAL_VERIFICATION_REQUIRED',
  };
}

async function initiatePaymentVerification(
  userId: string,
  parentInfo: { name: string; email: string; phone?: string }
): Promise<KoreanVerificationResult> {
  logger.info('Payment verification initiated', { userId, parentEmail: parentInfo.email });

  const consentRecord = await prisma.parentalConsentRecord.create({
    data: {
      childUserId: userId,
      parentEmail: parentInfo.email,
      parentName: parentInfo.name,
      verificationMethod: 'PAYMENT',
      consentScope: ['basic_account', 'educational_data'],
      consentGranted: false,
    },
  });

  await prisma.profile.update({
    where: { userId },
    data: {
      parentEmail: parentInfo.email,
      parentName: parentInfo.name,
      parentalConsentStatus: 'PENDING',
    },
  });

  return {
    success: true,
    verified: false,
    method: 'PARENTAL_PAYMENT',
    error: `Payment verification initiated. Record ID: ${consentRecord.id}. Complete a small payment (KRW 100) to verify parental identity.`,
    code: 'PAYMENT_PENDING',
  };
}

export async function completeKoreanVerification(
  userId: string,
  verificationCode: string,
  method: KoreanVerificationMethod
): Promise<KoreanVerificationResult> {
  try {
    const isValid = await validateVerificationCode(verificationCode, method);

    if (!isValid) {
      return {
        success: false,
        verified: false,
        error: 'Invalid verification code',
        code: 'INVALID_CODE',
      };
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: { userId },
        data: {
          parentalConsentStatus: 'GRANTED',
          parentalConsentDate: new Date(),
          coppaCompliant: true,
        },
      }),
      prisma.parentalConsentRecord.updateMany({
        where: {
          childUserId: userId,
          consentGranted: false,
        },
        data: {
          consentGranted: true,
          consentDate: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    logger.info('Korean verification completed', { userId, method });

    return {
      success: true,
      verified: true,
      method,
    };
  } catch (error) {
    logger.error('Korean verification completion failed', error);
    return {
      success: false,
      verified: false,
      error: 'Verification completion failed',
      code: 'COMPLETION_FAILED',
    };
  }
}

async function validateVerificationCode(
  code: string,
  method: KoreanVerificationMethod
): Promise<boolean> {
  if (!code || code.length < 6) {
    return false;
  }

  switch (method) {
    case 'IPIN':
      return code.startsWith('IPIN-') && code.length === 20;
    case 'MOBILE':
      return /^\d{6}$/.test(code);
    case 'CREDIT_CARD':
    case 'PARENTAL_PAYMENT':
      return code.startsWith('PAY-') && code.length >= 10;
    default:
      return false;
  }
}

export const PIPA_DATA_COLLECTION_NOTICE = {
  ko: {
    title: '개인정보 수집 및 이용 동의',
    purpose: '교육 서비스 제공 및 학습 진도 관리',
    items: [
      '이름, 이메일 주소',
      '생년월일 (연령 확인용)',
      '학습 진도 및 퀴즈 결과',
      '읽기 기록',
    ],
    retention: '회원 탈퇴 시까지 (단, 법령에 따른 보관 의무가 있는 경우 해당 기간)',
    refusalRight: '귀하는 개인정보 수집에 동의를 거부할 권리가 있으며, 동의 거부 시 서비스 이용이 제한될 수 있습니다.',
  },
  en: {
    title: 'Consent for Collection and Use of Personal Information',
    purpose: 'Provision of educational services and learning progress management',
    items: [
      'Name, email address',
      'Date of birth (for age verification)',
      'Learning progress and quiz results',
      'Reading history',
    ],
    retention: 'Until account deletion (except where retention is required by law)',
    refusalRight: 'You have the right to refuse consent for personal information collection. Service access may be limited if consent is refused.',
  },
};

export function getPIPANotice(language: 'ko' | 'en' = 'ko') {
  return PIPA_DATA_COLLECTION_NOTICE[language];
}

export const PIPA_REQUIREMENTS = {
  underAge: 14,
  consentMethods: ['IPIN', 'MOBILE', 'CREDIT_CARD', 'PARENTAL_PAYMENT'],
  dataProtectionOfficer: {
    title: '개인정보보호책임자 (DPO)',
    name: 'Seeds of Empowerment',
    email: 'privacy@1001stories.org',
    address: 'Korea Office Contact',
  },
  regulatoryBody: {
    name: '개인정보보호위원회 (PIPC)',
    website: 'https://www.pipc.go.kr',
    reportUrl: 'https://privacy.go.kr',
  },
};
