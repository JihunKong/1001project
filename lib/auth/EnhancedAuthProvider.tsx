'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  EnhancedUser,
  AuthContextType,
  AuthState,
  AuthAction,
  LoginCredentials,
  RegisterData,
  CulturalProfile,
  PrivacySettings,
  EducatorInfo,
  SocialAuthResult,
  UserType
} from '@/types/auth';

// Enhanced Auth Error class
class EnhancedAuthError extends Error {
  constructor(public code: string, message: string, public field?: string) {
    super(message);
    this.name = 'EnhancedAuthError';
  }
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  authProviders: [
    { id: 'google', name: 'Google', type: 'google', isEnabled: true, icon: 'google' },
    { id: 'apple', name: 'Apple', type: 'apple', isEnabled: false, icon: 'apple' },
    { id: 'facebook', name: 'Facebook', type: 'facebook', isEnabled: false, icon: 'facebook' },
    { id: 'email', name: 'Magic Link', type: 'email', isEnabled: true, icon: 'email' }
  ],
  registrationStep: 0,
  culturalSetupComplete: false,
  educatorVerificationStatus: 'none'
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
        isAuthenticated: true,
        culturalSetupComplete: Boolean(action.payload.culturalProfile?.heritageBackgrounds?.length),
        educatorVerificationStatus: action.payload.isEducatorVerified ? 'approved' :
          action.payload.userType === 'educator' ? 'pending' : 'none'
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        registrationStep: 0,
        culturalSetupComplete: false,
        educatorVerificationStatus: 'none'
      };

    case 'UPDATE_PROFILE':
      return state.user ? {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      } : state;

    case 'UPDATE_CULTURAL_PROFILE':
      return state.user ? {
        ...state,
        user: {
          ...state.user,
          culturalProfile: { ...state.user.culturalProfile, ...action.payload }
        },
        culturalSetupComplete: Boolean(action.payload.heritageBackgrounds?.length),
        error: null
      } : state;

    case 'UPDATE_PRIVACY_SETTINGS':
      return state.user ? {
        ...state,
        user: {
          ...state.user,
          privacySettings: { ...state.user.privacySettings, ...action.payload }
        },
        error: null
      } : state;

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_REGISTRATION_STEP':
      return { ...state, registrationStep: action.payload };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const EnhancedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { data: session, status } = useSession();

  // Initialize authentication state from NextAuth session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Only process when status is not loading to avoid race conditions
        if (status === 'loading') {
          dispatch({ type: 'SET_LOADING', payload: true });
          return;
        }

        if (session?.user) {
          // Convert NextAuth user to EnhancedUser
          const enhancedUser = await convertToEnhancedUser(session.user);
          dispatch({ type: 'AUTH_SUCCESS', payload: enhancedUser });

          // Check COPPA compliance for minors
          if (enhancedUser.userType === 'student' && isMinor(enhancedUser.culturalProfile)) {
            await validateParentalConsent(enhancedUser);
          }
        } else {
          // Properly clear auth state when no session exists
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' });
      }
    };

    initializeAuth();
  }, [session, status]);

  // Debug authentication state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Auth Debug]', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        loading: state.loading,
        sessionStatus: status,
        hasSession: !!session
      });
    }
  }, [state, status, session]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });

      // For magic link authentication with NextAuth
      const result = await signIn('email', {
        email: credentials.email,
        redirect: false
      });

      if (result?.error) {
        throw new EnhancedAuthError('LOGIN_FAILED', result.error);
      }

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, []);

  const loginWithProvider = useCallback(async (providerId: string) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const provider = state.authProviders.find(p => p.id === providerId);
      if (!provider || !provider.isEnabled) {
        throw new EnhancedAuthError('PROVIDER_DISABLED', `${providerId} authentication is not available`);
      }

      const result = await signIn(providerId, {
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        throw new EnhancedAuthError('PROVIDER_LOGIN_FAILED', result.error);
      }

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, [state.authProviders]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Comprehensive validation
      const validation = await validateRegistrationData(data);
      if (!validation.isValid) {
        throw new EnhancedAuthError('VALIDATION_ERROR', validation.errors[0].message);
      }

      // Age verification and COPPA compliance
      const ageVerification = verifyAge(data.birthDate);
      if (ageVerification.requiresParentalConsent && !data.parentalConsent) {
        throw new EnhancedAuthError('PARENTAL_CONSENT_REQUIRED',
          'Parental consent is required for users under 13');
      }

      // Create enhanced user profile first
      const enhancedProfile = await createEnhancedProfile(data);

      // Use NextAuth for initial registration
      const result = await signIn('email', {
        email: data.email,
        redirect: false
      });

      if (result?.error) {
        throw new EnhancedAuthError('REGISTRATION_FAILED', result.error);
      }

      // Set next step based on user type
      if (data.userType === 'educator') {
        dispatch({ type: 'SET_REGISTRATION_STEP', payload: 3 }); // Educator verification
      } else if (!data.culturalProfile.heritageBackgrounds?.length) {
        dispatch({ type: 'SET_REGISTRATION_STEP', payload: 2 }); // Cultural setup
      }

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      dispatch({ type: 'AUTH_LOGOUT' });

      // Clear any cached enhanced data
      await clearUserData();

    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if server request fails
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<EnhancedUser>) => {
    try {
      if (!state.user) throw new EnhancedAuthError('NOT_AUTHENTICATED', 'User not authenticated');

      // Update enhanced profile in database
      const updatedUser = await updateEnhancedProfile(state.user.id, updates);
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, [state.user]);

  const updateCulturalProfile = useCallback(async (profile: Partial<CulturalProfile>) => {
    try {
      if (!state.user) throw new EnhancedAuthError('NOT_AUTHENTICATED', 'User not authenticated');

      const updatedProfile = await updateCulturalProfileInDB(state.user.id, profile);
      dispatch({ type: 'UPDATE_CULTURAL_PROFILE', payload: updatedProfile });

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, [state.user]);

  const updatePrivacySettings = useCallback(async (settings: Partial<PrivacySettings>) => {
    try {
      if (!state.user) throw new EnhancedAuthError('NOT_AUTHENTICATED', 'User not authenticated');

      // Validate privacy settings
      const validatedSettings = await validatePrivacySettings(settings, state.user);

      const updatedSettings = await updatePrivacySettingsInDB(
        state.user.id,
        validatedSettings
      );

      dispatch({ type: 'UPDATE_PRIVACY_SETTINGS', payload: updatedSettings });

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, [state.user]);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      // NextAuth handles email verification
      dispatch({ type: 'UPDATE_PROFILE', payload: { isEmailVerified: true } });

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Use NextAuth email provider for password reset
      await signIn('email', { email, redirect: false });
    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
    try {
      // This would be handled by the custom password reset flow
      // TODO: Implement password reset confirmation
    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, []);

  const requestEducatorVerification = useCallback(async (info: EducatorInfo) => {
    try {
      if (!state.user) throw new EnhancedAuthError('NOT_AUTHENTICATED', 'User not authenticated');

      // Validate educator information
      const validation = await validateEducatorInfo(info);
      if (!validation.isValid) {
        throw new EnhancedAuthError('VALIDATION_ERROR', validation.errors[0].message);
      }

      await requestEducatorVerificationInDB(state.user.id, info);

      // Update user state to reflect pending verification
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { educatorInfo: info }
      });

    } catch (error) {
      const authError = error as EnhancedAuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError.message });
      throw error;
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    login,
    loginWithProvider,
    register,
    logout,
    updateProfile,
    updateCulturalProfile,
    updatePrivacySettings,
    verifyEmail,
    resetPassword,
    confirmPasswordReset,
    requestEducatorVerification,
    error: state.error,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Utility functions (to be implemented)
const convertToEnhancedUser = async (user: any): Promise<EnhancedUser> => {
  // Convert NextAuth user to EnhancedUser
  // This would fetch additional profile data from database
  return {
    id: user.id,
    email: user.email,
    displayName: user.name || '',
    userType: mapRoleToUserType(user.role),
    culturalProfile: await getCulturalProfile(user.id) || getDefaultCulturalProfile(),
    privacySettings: await getPrivacySettings(user.id) || getDefaultPrivacySettings(),
    isEmailVerified: Boolean(user.emailVerified),
    isEducatorVerified: user.role === 'TEACHER',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    preferences: await getUserPreferences(user.id) || getDefaultPreferences()
  };
};

const mapRoleToUserType = (role: string): UserType => {
  switch (role) {
    case 'TEACHER': return 'educator';
    case 'LEARNER': return 'student';
    case 'WRITER': return 'individual';
    default: return 'individual';
  }
};

const isMinor = (culturalProfile: CulturalProfile): boolean => {
  // Implementation would check user's age from profile
  return false; // Placeholder
};

const validateParentalConsent = async (user: EnhancedUser): Promise<void> => {
  // Implementation would validate parental consent for minors
};

const validateRegistrationData = async (data: RegisterData): Promise<{ isValid: boolean; errors: any[] }> => {
  // Implementation would validate registration data
  return { isValid: true, errors: [] };
};

const verifyAge = (birthDate: Date): { requiresParentalConsent: boolean } => {
  const age = new Date().getFullYear() - birthDate.getFullYear();
  return { requiresParentalConsent: age < 13 };
};

const validatePrivacySettings = async (settings: Partial<PrivacySettings>, user: EnhancedUser): Promise<PrivacySettings> => {
  // Implementation would validate privacy settings
  return { ...user.privacySettings, ...settings };
};

const validateEducatorInfo = async (info: EducatorInfo): Promise<{ isValid: boolean; errors: any[] }> => {
  // Implementation would validate educator information
  return { isValid: true, errors: [] };
};

const clearUserData = async (): Promise<void> => {
  // Implementation would clear cached user data
};

// Default data providers (to be implemented)
const getDefaultCulturalProfile = (): CulturalProfile => ({
  heritageBackgrounds: [],
  primaryLanguages: ['en'],
  secondaryLanguages: [],
  culturalRegions: [],
  storytellingExperience: 'beginner',
  culturalSensitivity: {
    level: 'medium',
    specificConcerns: [],
    contentFiltering: true
  },
  contentPreferences: {
    preferredGenres: [],
    ageAppropriate: true,
    educationalContent: true,
    traditionalStories: true,
    contemporaryStories: true,
    multimediaContent: true
  }
});

const getDefaultPrivacySettings = (): PrivacySettings => ({
  profileVisibility: 'private',
  storySharing: false,
  dataCollection: false,
  marketingEmails: false,
  analyticsTracking: false,
  parentalConsent: false,
  gdprConsent: true,
  ccpaOptOut: false
});

const getDefaultPreferences = () => ({
  theme: 'light' as const,
  language: 'en',
  notifications: {
    email: true,
    push: false,
    inApp: true,
    storyUpdates: true,
    communityActivity: true,
    educationalContent: true
  },
  accessibility: {
    fontSize: 'medium' as const,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false
  }
});

// Database operations (to be implemented)
const getCulturalProfile = async (userId: string): Promise<CulturalProfile | null> => null;
const getPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => null;
const getUserPreferences = async (userId: string) => null;
const createEnhancedProfile = async (data: RegisterData) => {};
const updateEnhancedProfile = async (userId: string, updates: Partial<EnhancedUser>) => updates;
const updateCulturalProfileInDB = async (userId: string, profile: Partial<CulturalProfile>) => profile;
const updatePrivacySettingsInDB = async (userId: string, settings: PrivacySettings) => settings;
const requestEducatorVerificationInDB = async (userId: string, info: EducatorInfo) => {};

export default EnhancedAuthProvider;