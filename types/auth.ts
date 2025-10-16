export interface EnhancedUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  userType: UserType;
  culturalProfile: CulturalProfile;
  privacySettings: PrivacySettings;
  isEmailVerified: boolean;
  isEducatorVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  educatorInfo?: EducatorInfo;
}

export type UserType =
  | 'individual'
  | 'educator'
  | 'student'
  | 'organization'
  | 'guardian';

export interface CulturalProfile {
  heritageBackgrounds: string[];
  primaryLanguages: string[];
  secondaryLanguages: string[];
  culturalRegions: string[];
  storytellingExperience: StorytellingExperience;
  culturalSensitivity: CulturalSensitivity;
  contentPreferences: ContentPreferences;
}

export type StorytellingExperience =
  | 'beginner'
  | 'intermediate'
  | 'experienced'
  | 'expert'
  | 'professional';

export interface CulturalSensitivity {
  level: 'low' | 'medium' | 'high';
  specificConcerns: string[];
  contentFiltering: boolean;
}

export interface ContentPreferences {
  preferredGenres: string[];
  ageAppropriate: boolean;
  educationalContent: boolean;
  traditionalStories: boolean;
  contemporaryStories: boolean;
  multimediaContent: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  storySharing: boolean;
  dataCollection: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  parentalConsent: boolean; // For COPPA compliance
  gdprConsent: boolean;
  ccpaOptOut: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilitySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  storyUpdates: boolean;
  communityActivity: boolean;
  educationalContent: boolean;
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface AuthProvider {
  id: string;
  name: string;
  type: 'google' | 'apple' | 'facebook' | 'email' | 'microsoft' | 'twitter';
  isEnabled: boolean;
  icon: string;
  scope?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  captchaToken?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  userType: UserType;
  birthDate: Date;
  culturalProfile: Partial<CulturalProfile>;
  privacySettings: PrivacySettings;
  parentalConsent?: boolean;
  termsAccepted: boolean;
  educatorInfo?: EducatorInfo;
}

export interface EducatorInfo {
  institution: string;
  institutionEmail?: string;
  role: EducatorRole;
  gradeLevel?: string[];
  subjects?: string[];
  yearsExperience: number;
  certifications?: string[];
  institutionDomain?: string;
  verificationDocuments?: File[];
}

export type EducatorRole =
  | 'teacher'
  | 'professor'
  | 'librarian'
  | 'administrator'
  | 'counselor'
  | 'specialist'
  | 'substitute'
  | 'tutor'
  | 'researcher';

export interface AuthContextType {
  user: EnhancedUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithProvider: (provider: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<EnhancedUser>) => Promise<void>;
  updateCulturalProfile: (profile: Partial<CulturalProfile>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  requestEducatorVerification: (info: EducatorInfo) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface SocialAuthResult {
  user: EnhancedUser;
  isNewUser: boolean;
  needsProfileCompletion: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export interface AgeVerification {
  birthDate: Date;
  isMinor: boolean;
  requiresParentalConsent: boolean;
  coppaCompliant: boolean;
}

export interface InstitutionVerification {
  domain: string;
  isEducationalDomain: boolean;
  institution?: {
    name: string;
    type: 'K-12' | 'university' | 'college' | 'library' | 'other';
    location: string;
    verified: boolean;
  };
}

export interface CulturalHeritage {
  id: string;
  name: string;
  region: string;
  languages: string[];
  description: string;
  subcategories: string[];
}

export interface Language {
  code: string; // ISO 639-1
  name: string;
  nativeName: string;
  region: string;
  direction: 'ltr' | 'rtl';
  isSupported: boolean;
}

export interface Region {
  id: string;
  name: string;
  continent: string;
  countries: string[];
  culturalGroups: string[];
}

// Form validation schemas
export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Authentication state management
export interface AuthState {
  user: EnhancedUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  authProviders: AuthProvider[];
  registrationStep: number;
  culturalSetupComplete: boolean;
  educatorVerificationStatus: 'pending' | 'approved' | 'rejected' | 'none';
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: EnhancedUser }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<EnhancedUser> }
  | { type: 'UPDATE_CULTURAL_PROFILE'; payload: Partial<CulturalProfile> }
  | { type: 'UPDATE_PRIVACY_SETTINGS'; payload: Partial<PrivacySettings> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REGISTRATION_STEP'; payload: number };