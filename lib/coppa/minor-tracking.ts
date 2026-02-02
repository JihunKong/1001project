import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export interface TrackingRestrictions {
  canCollectIP: boolean;
  canCollectUserAgent: boolean;
  canCollectBehavioralData: boolean;
  canCollectGeolocation: boolean;
  canUseCookiesForTracking: boolean;
  canShareWithThirdParties: boolean;
  allowedDataTypes: string[];
  restrictionReason?: string;
}

export async function checkUserTrackingRestrictions(
  userId: string
): Promise<TrackingRestrictions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          isMinor: true,
          dateOfBirth: true,
          parentalConsentStatus: true,
          coppaCompliant: true,
          aiServiceConsent: true,
          dataTransferConsent: true,
        },
      },
    },
  });

  if (!user || !user.profile) {
    return getDefaultRestrictions('User not found');
  }

  const { profile } = user;

  const isMinor = profile.isMinor || isUnder13(profile.dateOfBirth);

  if (!isMinor) {
    return getAdultPermissions();
  }

  const hasVerifiedConsent =
    profile.parentalConsentStatus === 'GRANTED' && profile.coppaCompliant;

  if (!hasVerifiedConsent) {
    return getStrictMinorRestrictions();
  }

  return getConsentedMinorPermissions();
}

export function isUnder13(dateOfBirth: Date | null): boolean {
  if (!dateOfBirth) return false;

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

  return age < 13;
}

function getDefaultRestrictions(reason: string): TrackingRestrictions {
  return {
    canCollectIP: false,
    canCollectUserAgent: false,
    canCollectBehavioralData: false,
    canCollectGeolocation: false,
    canUseCookiesForTracking: false,
    canShareWithThirdParties: false,
    allowedDataTypes: ['essential_session'],
    restrictionReason: reason,
  };
}

function getAdultPermissions(): TrackingRestrictions {
  return {
    canCollectIP: true,
    canCollectUserAgent: true,
    canCollectBehavioralData: true,
    canCollectGeolocation: false,
    canUseCookiesForTracking: true,
    canShareWithThirdParties: false,
    allowedDataTypes: [
      'essential_session',
      'reading_progress',
      'educational_metrics',
      'activity_logs',
      'preferences',
    ],
  };
}

function getStrictMinorRestrictions(): TrackingRestrictions {
  return {
    canCollectIP: false,
    canCollectUserAgent: false,
    canCollectBehavioralData: false,
    canCollectGeolocation: false,
    canUseCookiesForTracking: false,
    canShareWithThirdParties: false,
    allowedDataTypes: ['essential_session', 'basic_reading_progress'],
    restrictionReason: 'Minor without verified parental consent',
  };
}

function getConsentedMinorPermissions(): TrackingRestrictions {
  return {
    canCollectIP: false,
    canCollectUserAgent: false,
    canCollectBehavioralData: false,
    canCollectGeolocation: false,
    canUseCookiesForTracking: false,
    canShareWithThirdParties: false,
    allowedDataTypes: [
      'essential_session',
      'reading_progress',
      'educational_metrics',
      'quiz_results',
    ],
    restrictionReason: 'Minor with parental consent - limited data collection',
  };
}

export interface SanitizedActivityData {
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createSanitizedActivityLog(
  userId: string,
  data: SanitizedActivityData
): Promise<{ success: boolean; logged: boolean; reason?: string }> {
  const restrictions = await checkUserTrackingRestrictions(userId);

  const sanitizedData: SanitizedActivityData = {
    action: data.action,
    entity: data.entity,
    entityId: data.entityId,
    metadata: {},
  };

  if (restrictions.canCollectIP && data.ipAddress) {
    sanitizedData.ipAddress = data.ipAddress;
  }

  if (restrictions.canCollectUserAgent && data.userAgent) {
    sanitizedData.userAgent = data.userAgent;
  }

  if (restrictions.canCollectBehavioralData && data.metadata) {
    sanitizedData.metadata = data.metadata;
  }

  if (!restrictions.canCollectBehavioralData) {
    const allowedMetadataKeys = ['pageType', 'contentType', 'bookId'];
    if (data.metadata) {
      sanitizedData.metadata = Object.fromEntries(
        Object.entries(data.metadata).filter(([key]) =>
          allowedMetadataKeys.includes(key)
        )
      );
    }
  }

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: sanitizedData.action,
        entity: sanitizedData.entity,
        entityId: sanitizedData.entityId,
        metadata: (sanitizedData.metadata as Prisma.InputJsonValue) || undefined,
        ipAddress: sanitizedData.ipAddress || null,
        userAgent: sanitizedData.userAgent || null,
      },
    });

    return {
      success: true,
      logged: true,
      reason: restrictions.restrictionReason,
    };
  } catch (error) {
    logger.error('Failed to create activity log', error);
    return {
      success: false,
      logged: false,
      reason: 'Database error',
    };
  }
}

export function getMinorSafeHeaders(
  userId: string | undefined,
  isMinor: boolean
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (isMinor) {
    headers['X-COPPA-Protected'] = 'true';
    headers['X-Do-Not-Track'] = 'true';
    headers['X-No-Behavioral-Tracking'] = 'true';
  }

  return headers;
}

export async function logEducationalActivity(
  userId: string,
  activityType:
    | 'reading_started'
    | 'reading_completed'
    | 'quiz_started'
    | 'quiz_completed'
    | 'vocabulary_learned',
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const restrictions = await checkUserTrackingRestrictions(userId);

  if (!restrictions.allowedDataTypes.includes('educational_metrics')) {
    logger.debug('Educational activity logging skipped due to restrictions', {
      userId,
      activityType,
      reason: restrictions.restrictionReason,
    });
    return;
  }

  const safeMetadata: Record<string, unknown> = {
    activityType,
    timestamp: new Date().toISOString(),
  };

  if (metadata) {
    const allowedKeys = [
      'bookId',
      'chapterId',
      'quizId',
      'score',
      'duration',
      'wordsLearned',
    ];
    for (const key of allowedKeys) {
      if (key in metadata) {
        safeMetadata[key] = metadata[key];
      }
    }
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action: activityType,
      entity: 'educational_progress',
      entityId,
      metadata: safeMetadata as Prisma.InputJsonValue,
    },
  });
}

export async function getMinorDataSummary(userId: string): Promise<{
  isMinor: boolean;
  hasParentalConsent: boolean;
  dataCollected: string[];
  restrictions: TrackingRestrictions;
}> {
  const restrictions = await checkUserTrackingRestrictions(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          isMinor: true,
          parentalConsentStatus: true,
        },
      },
    },
  });

  return {
    isMinor: user?.profile?.isMinor ?? false,
    hasParentalConsent: user?.profile?.parentalConsentStatus === 'GRANTED',
    dataCollected: restrictions.allowedDataTypes,
    restrictions,
  };
}
