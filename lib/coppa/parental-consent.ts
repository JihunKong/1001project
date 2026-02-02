import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { ParentalVerificationMethod } from '@prisma/client';
import {
  generateKBASession,
  verifyKBAAnswers,
  KBAVerificationResult,
} from './kba-questions';

export interface ParentalConsentRequest {
  childUserId: string;
  parentEmail: string;
  parentName?: string;
  verificationMethod: ParentalVerificationMethod;
  consentScope: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentVerificationResult {
  success: boolean;
  consentRecordId?: string;
  error?: string;
  code?: string;
  kbaSession?: {
    sessionId: string;
    questions: Array<{ id: string; question: string; options: string[] }>;
  };
}

const CONSENT_EXPIRY_DAYS = 365;
const CONSENT_RECORD_RETENTION_YEARS = 3;

export async function initiateParentalConsent(
  request: ParentalConsentRequest
): Promise<ConsentVerificationResult> {
  const {
    childUserId,
    parentEmail,
    parentName,
    verificationMethod,
    consentScope,
    ipAddress,
    userAgent,
  } = request;

  const existingUser = await prisma.user.findUnique({
    where: { id: childUserId },
    include: { profile: true },
  });

  if (!existingUser) {
    return {
      success: false,
      error: 'Child user not found',
      code: 'USER_NOT_FOUND',
    };
  }

  if (!existingUser.profile?.isMinor) {
    return {
      success: false,
      error: 'User is not identified as a minor',
      code: 'NOT_A_MINOR',
    };
  }

  const existingActiveConsent = await prisma.parentalConsentRecord.findFirst({
    where: {
      childUserId,
      consentGranted: true,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingActiveConsent) {
    return {
      success: false,
      error: 'Active consent already exists',
      code: 'CONSENT_ALREADY_EXISTS',
    };
  }

  const consentRecord = await prisma.parentalConsentRecord.create({
    data: {
      childUserId,
      parentEmail,
      parentName,
      verificationMethod,
      consentScope,
      consentGranted: false,
      ipAddress,
      userAgent,
    },
  });

  if (verificationMethod === 'KBA') {
    const language =
      existingUser.profile?.language === 'ko' ? 'ko' : 'en';
    const kbaSession = generateKBASession(language);

    return {
      success: true,
      consentRecordId: consentRecord.id,
      kbaSession,
    };
  }

  if (verificationMethod === 'EMAIL') {
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.profile.update({
      where: { userId: childUserId },
      data: {
        parentalConsentToken: token,
        parentalConsentTokenExp: tokenExpiry,
        parentEmail,
        parentName,
      },
    });

    return {
      success: true,
      consentRecordId: consentRecord.id,
    };
  }

  return {
    success: true,
    consentRecordId: consentRecord.id,
  };
}

export async function verifyKBAConsent(
  consentRecordId: string,
  kbaSessionId: string,
  answers: Record<string, number>,
  ipAddress?: string
): Promise<ConsentVerificationResult> {
  const consentRecord = await prisma.parentalConsentRecord.findUnique({
    where: { id: consentRecordId },
  });

  if (!consentRecord) {
    return {
      success: false,
      error: 'Consent record not found',
      code: 'RECORD_NOT_FOUND',
    };
  }

  if (consentRecord.consentGranted) {
    return {
      success: false,
      error: 'Consent already granted',
      code: 'CONSENT_ALREADY_GRANTED',
    };
  }

  const verificationResult = verifyKBAAnswers(kbaSessionId, answers);

  if ('error' in verificationResult) {
    return {
      success: false,
      error: verificationResult.error,
      code: verificationResult.code,
    };
  }

  const kbaResult = verificationResult as KBAVerificationResult;

  const hashedAnswers = crypto
    .createHash('sha256')
    .update(JSON.stringify(answers))
    .digest('hex');

  await prisma.parentalConsentRecord.update({
    where: { id: consentRecordId },
    data: {
      kbaAnswers: { hash: hashedAnswers, sessionId: kbaSessionId },
      kbaScore: kbaResult.score,
      ipAddress,
    },
  });

  if (!kbaResult.passed) {
    return {
      success: false,
      error: `KBA verification failed. Score: ${kbaResult.score}%, Required: ${kbaResult.passThreshold}%`,
      code: 'KBA_FAILED',
    };
  }

  return grantConsent(consentRecordId);
}

export async function verifyPaymentConsent(
  consentRecordId: string,
  paymentReference: string,
  paymentVerified: boolean,
  ipAddress?: string
): Promise<ConsentVerificationResult> {
  const consentRecord = await prisma.parentalConsentRecord.findUnique({
    where: { id: consentRecordId },
  });

  if (!consentRecord) {
    return {
      success: false,
      error: 'Consent record not found',
      code: 'RECORD_NOT_FOUND',
    };
  }

  if (consentRecord.consentGranted) {
    return {
      success: false,
      error: 'Consent already granted',
      code: 'CONSENT_ALREADY_GRANTED',
    };
  }

  await prisma.parentalConsentRecord.update({
    where: { id: consentRecordId },
    data: {
      paymentReference,
      paymentVerified,
      ipAddress,
    },
  });

  if (!paymentVerified) {
    return {
      success: false,
      error: 'Payment verification failed',
      code: 'PAYMENT_FAILED',
    };
  }

  return grantConsent(consentRecordId);
}

export async function grantConsent(
  consentRecordId: string
): Promise<ConsentVerificationResult> {
  const consentRecord = await prisma.parentalConsentRecord.findUnique({
    where: { id: consentRecordId },
  });

  if (!consentRecord) {
    return {
      success: false,
      error: 'Consent record not found',
      code: 'RECORD_NOT_FOUND',
    };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CONSENT_EXPIRY_DAYS);

  await prisma.$transaction([
    prisma.parentalConsentRecord.update({
      where: { id: consentRecordId },
      data: {
        consentGranted: true,
        consentDate: new Date(),
        expiresAt,
      },
    }),
    prisma.profile.update({
      where: { userId: consentRecord.childUserId },
      data: {
        parentalConsentStatus: 'GRANTED',
        parentalConsentDate: new Date(),
        coppaCompliant: true,
      },
    }),
  ]);

  return {
    success: true,
    consentRecordId,
  };
}

export async function revokeConsent(
  consentRecordId: string,
  reason?: string
): Promise<ConsentVerificationResult> {
  const consentRecord = await prisma.parentalConsentRecord.findUnique({
    where: { id: consentRecordId },
  });

  if (!consentRecord) {
    return {
      success: false,
      error: 'Consent record not found',
      code: 'RECORD_NOT_FOUND',
    };
  }

  await prisma.$transaction([
    prisma.parentalConsentRecord.update({
      where: { id: consentRecordId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }),
    prisma.profile.update({
      where: { userId: consentRecord.childUserId },
      data: {
        parentalConsentStatus: 'DENIED',
        coppaCompliant: false,
      },
    }),
  ]);

  return {
    success: true,
    consentRecordId,
  };
}

export async function checkConsentStatus(childUserId: string): Promise<{
  hasActiveConsent: boolean;
  consentRecord?: {
    id: string;
    parentEmail: string;
    verificationMethod: ParentalVerificationMethod;
    consentDate: Date | null;
    expiresAt: Date | null;
  };
  daysUntilExpiry?: number;
}> {
  const activeConsent = await prisma.parentalConsentRecord.findFirst({
    where: {
      childUserId,
      consentGranted: true,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { consentDate: 'desc' },
  });

  if (!activeConsent) {
    return { hasActiveConsent: false };
  }

  const daysUntilExpiry = activeConsent.expiresAt
    ? Math.ceil(
        (activeConsent.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : undefined;

  return {
    hasActiveConsent: true,
    consentRecord: {
      id: activeConsent.id,
      parentEmail: activeConsent.parentEmail,
      verificationMethod: activeConsent.verificationMethod,
      consentDate: activeConsent.consentDate,
      expiresAt: activeConsent.expiresAt,
    },
    daysUntilExpiry,
  };
}

export async function getConsentHistory(childUserId: string) {
  return prisma.parentalConsentRecord.findMany({
    where: { childUserId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      parentEmail: true,
      verificationMethod: true,
      consentGranted: true,
      consentDate: true,
      expiresAt: true,
      revokedAt: true,
      revokedReason: true,
      createdAt: true,
    },
  });
}

export async function cleanupExpiredConsentRecords(): Promise<number> {
  const retentionCutoff = new Date();
  retentionCutoff.setFullYear(
    retentionCutoff.getFullYear() - CONSENT_RECORD_RETENTION_YEARS
  );

  const result = await prisma.parentalConsentRecord.deleteMany({
    where: {
      OR: [
        {
          consentGranted: false,
          createdAt: { lt: retentionCutoff },
        },
        {
          AND: [
            { revokedAt: { not: null } },
            { revokedAt: { lt: retentionCutoff } },
          ],
        },
      ],
    },
  });

  return result.count;
}

export async function sendConsentRenewalReminder(
  daysBeforeExpiry: number = 30
): Promise<number> {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + daysBeforeExpiry);

  const expiringConsents = await prisma.parentalConsentRecord.findMany({
    where: {
      consentGranted: true,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
        lte: expiryThreshold,
      },
    },
  });

  let sentCount = 0;

  for (const consent of expiringConsents) {
    const user = await prisma.user.findUnique({
      where: { id: consent.childUserId },
      select: { name: true, email: true },
    });

    if (user) {
      // Note: Email sending would be implemented in the email service
      // This is a placeholder for tracking purposes
      console.log(
        `Reminder needed for consent ${consent.id}, parent: ${consent.parentEmail}`
      );
      sentCount++;
    }
  }

  return sentCount;
}

export const COPPA_CONSENT_SCOPES = {
  BASIC_ACCOUNT: 'basic_account_creation',
  EDUCATIONAL_PROGRESS: 'educational_progress_tracking',
  AI_ASSISTANCE: 'ai_assistance_features',
  CONTENT_SUBMISSION: 'content_submission',
  COMMUNICATION: 'platform_communication',
  THIRD_PARTY_SHARING: 'third_party_data_sharing',
} as const;

export function getDefaultConsentScopes(): string[] {
  return [
    COPPA_CONSENT_SCOPES.BASIC_ACCOUNT,
    COPPA_CONSENT_SCOPES.EDUCATIONAL_PROGRESS,
  ];
}

export function getFullConsentScopes(): string[] {
  return Object.values(COPPA_CONSENT_SCOPES);
}
