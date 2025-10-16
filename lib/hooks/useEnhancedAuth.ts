'use client';

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/EnhancedAuthProvider';
import { CulturalProfile, PrivacySettings, UserType } from '@/types/auth';

/**
 * Enhanced auth hook with additional utilities
 */
export const useEnhancedAuth = () => {
  const auth = useAuth();

  // Check if user has completed cultural profile setup
  const hasCulturalProfile = useMemo(() => {
    return Boolean(
      auth.user?.culturalProfile?.heritageBackgrounds?.length &&
      auth.user.culturalProfile.primaryLanguages?.length
    );
  }, [auth.user?.culturalProfile]);

  // Check if user is a minor (for COPPA compliance)
  const isMinor = useMemo(() => {
    if (!auth.user) return false;
    // This would check user's age from profile/birth date
    return auth.user.userType === 'student'; // Simplified check
  }, [auth.user]);

  // Check if user needs parental consent
  const needsParentalConsent = useMemo(() => {
    return isMinor && !auth.user?.privacySettings?.parentalConsent;
  }, [isMinor, auth.user?.privacySettings?.parentalConsent]);

  // Check if user is an educator
  const isEducator = useMemo(() => {
    return auth.user?.userType === 'educator';
  }, [auth.user?.userType]);

  // Check educator verification status
  const educatorStatus = useMemo(() => {
    if (!isEducator) return 'not_applicable';
    return auth.user?.isEducatorVerified ? 'verified' : 'pending';
  }, [isEducator, auth.user?.isEducatorVerified]);

  // Get user's cultural preferences
  const culturalPreferences = useMemo(() => {
    return auth.user?.culturalProfile?.contentPreferences || null;
  }, [auth.user?.culturalProfile?.contentPreferences]);

  // Get user's accessibility settings
  const accessibilitySettings = useMemo(() => {
    return auth.user?.preferences?.accessibility || null;
  }, [auth.user?.preferences?.accessibility]);

  // Update cultural profile with validation
  const updateCulturalProfileSafe = useCallback(async (updates: Partial<CulturalProfile>) => {
    try {
      // Validate cultural profile updates
      const validatedUpdates = validateCulturalUpdates(updates);
      return await auth.updateCulturalProfile(validatedUpdates);
    } catch (error) {
      console.error('Failed to update cultural profile:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.updateCulturalProfile]);

  // Update privacy settings with COPPA compliance check
  const updatePrivacySettingsSafe = useCallback(async (updates: Partial<PrivacySettings>) => {
    try {
      // For minors, ensure certain privacy protections
      if (isMinor) {
        updates = {
          ...updates,
          profileVisibility: 'private',
          dataCollection: false,
          marketingEmails: false,
        };
      }

      return await auth.updatePrivacySettings(updates);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.updatePrivacySettings, isMinor]);

  // Request educator verification with validation
  const requestEducatorVerificationSafe = useCallback(async (educatorInfo: any) => {
    try {
      if (!isEducator) {
        throw new Error('User must be registered as an educator');
      }

      // Validate educator information
      const validatedInfo = validateEducatorInfo(educatorInfo);
      return await auth.requestEducatorVerification(validatedInfo);
    } catch (error) {
      console.error('Failed to request educator verification:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.requestEducatorVerification, isEducator]);

  return {
    // Original auth properties and methods
    ...auth,

    // Enhanced properties
    hasCulturalProfile,
    isMinor,
    needsParentalConsent,
    isEducator,
    educatorStatus,
    culturalPreferences,
    accessibilitySettings,

    // Enhanced methods
    updateCulturalProfileSafe,
    updatePrivacySettingsSafe,
    requestEducatorVerificationSafe,
  };
};

// Validation helpers
const validateCulturalUpdates = (updates: Partial<CulturalProfile>): Partial<CulturalProfile> => {
  // Ensure at least one heritage background if provided
  if (updates.heritageBackgrounds && updates.heritageBackgrounds.length === 0) {
    throw new Error('At least one heritage background is required');
  }

  // Ensure at least one primary language
  if (updates.primaryLanguages && updates.primaryLanguages.length === 0) {
    throw new Error('At least one primary language is required');
  }

  return updates;
};

const validateEducatorInfo = (info: any) => {
  if (!info.institution) {
    throw new Error('Institution name is required');
  }

  if (!info.role) {
    throw new Error('Educator role is required');
  }

  if (!info.yearsExperience || info.yearsExperience < 0) {
    throw new Error('Years of experience must be a positive number');
  }

  return info;
};

/**
 * Hook for cultural profile management
 */
export const useCulturalProfile = () => {
  const { user, updateCulturalProfileSafe } = useEnhancedAuth();

  const profile = useMemo(() => user?.culturalProfile, [user?.culturalProfile]);

  const addHeritageBackground = useCallback(async (heritage: string) => {
    if (!profile) return;

    const currentBackgrounds = profile.heritageBackgrounds || [];
    if (currentBackgrounds.includes(heritage)) return;

    await updateCulturalProfileSafe({
      heritageBackgrounds: [...currentBackgrounds, heritage]
    });
  }, [profile, updateCulturalProfileSafe]);

  const removeHeritageBackground = useCallback(async (heritage: string) => {
    if (!profile) return;

    const currentBackgrounds = profile.heritageBackgrounds || [];
    const updatedBackgrounds = currentBackgrounds.filter(bg => bg !== heritage);

    if (updatedBackgrounds.length === 0) {
      throw new Error('At least one heritage background must remain');
    }

    await updateCulturalProfileSafe({
      heritageBackgrounds: updatedBackgrounds
    });
  }, [profile, updateCulturalProfileSafe]);

  const updateLanguages = useCallback(async (primary: string[], secondary?: string[]) => {
    if (primary.length === 0) {
      throw new Error('At least one primary language is required');
    }

    await updateCulturalProfileSafe({
      primaryLanguages: primary,
      secondaryLanguages: secondary || []
    });
  }, [updateCulturalProfileSafe]);

  const updateContentPreferences = useCallback(async (preferences: Partial<CulturalProfile['contentPreferences']>) => {
    if (!profile) return;

    await updateCulturalProfileSafe({
      contentPreferences: {
        ...profile.contentPreferences,
        ...preferences
      }
    });
  }, [profile, updateCulturalProfileSafe]);

  return {
    profile,
    addHeritageBackground,
    removeHeritageBackground,
    updateLanguages,
    updateContentPreferences,
  };
};

/**
 * Hook for privacy settings management with COPPA compliance
 */
export const usePrivacySettings = () => {
  const { user, isMinor, updatePrivacySettingsSafe } = useEnhancedAuth();

  const settings = useMemo(() => user?.privacySettings, [user?.privacySettings]);

  const updateProfileVisibility = useCallback(async (visibility: PrivacySettings['profileVisibility']) => {
    // Minors can only have private profiles
    if (isMinor && visibility !== 'private') {
      throw new Error('Minors can only have private profiles');
    }

    await updatePrivacySettingsSafe({ profileVisibility: visibility });
  }, [isMinor, updatePrivacySettingsSafe]);

  const toggleDataCollection = useCallback(async (enabled: boolean) => {
    // Minors cannot enable data collection
    if (isMinor && enabled) {
      throw new Error('Data collection cannot be enabled for minors');
    }

    await updatePrivacySettingsSafe({ dataCollection: enabled });
  }, [isMinor, updatePrivacySettingsSafe]);

  const updateGdprConsent = useCallback(async (consent: boolean) => {
    await updatePrivacySettingsSafe({ gdprConsent: consent });
  }, [updatePrivacySettingsSafe]);

  const updateParentalConsent = useCallback(async (consent: boolean) => {
    if (!isMinor) {
      throw new Error('Parental consent is only applicable for minors');
    }

    await updatePrivacySettingsSafe({ parentalConsent: consent });
  }, [isMinor, updatePrivacySettingsSafe]);

  return {
    settings,
    isMinor,
    updateProfileVisibility,
    toggleDataCollection,
    updateGdprConsent,
    updateParentalConsent,
  };
};

/**
 * Hook for accessibility settings management
 */
export const useAccessibilitySettings = () => {
  const { user, updateProfile } = useEnhancedAuth();

  const settings = useMemo(() => user?.preferences?.accessibility, [user?.preferences?.accessibility]);

  const updateFontSize = useCallback(async (fontSize: 'small' | 'medium' | 'large' | 'extra-large') => {
    if (!user) return;

    await updateProfile({
      preferences: {
        ...user.preferences,
        accessibility: {
          ...user.preferences.accessibility,
          fontSize
        }
      }
    });
  }, [user, updateProfile]);

  const toggleHighContrast = useCallback(async (enabled: boolean) => {
    if (!user) return;

    await updateProfile({
      preferences: {
        ...user.preferences,
        accessibility: {
          ...user.preferences.accessibility,
          highContrast: enabled
        }
      }
    });
  }, [user, updateProfile]);

  const toggleReducedMotion = useCallback(async (enabled: boolean) => {
    if (!user) return;

    await updateProfile({
      preferences: {
        ...user.preferences,
        accessibility: {
          ...user.preferences.accessibility,
          reducedMotion: enabled
        }
      }
    });
  }, [user, updateProfile]);

  return {
    settings,
    updateFontSize,
    toggleHighContrast,
    toggleReducedMotion,
  };
};