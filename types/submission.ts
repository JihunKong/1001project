export interface TextSubmissionData {
  id?: string;
  title: string;
  summary?: string;
  ageGroup: string;
  language: string;
  category: string;
  tags?: string[];
  content: string;
  submissionType: 'individual' | 'classroom';
  isClassroomSubmission?: boolean;
  attachments?: File[];
  status?: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'EDITING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  message?: string;
}

export interface StoryMetadata {
  category: string;
  ageGroup: string;
  language: string;
  tags?: string[];
  wordCount?: number;
}

export interface SubmissionFormProps {
  initialData?: Partial<TextSubmissionData>;
  onSaveDraft?: (data: TextSubmissionData) => Promise<void>;
  onSubmit: (data: TextSubmissionData) => Promise<void>;
  userRole: 'LEARNER' | 'TEACHER' | 'VOLUNTEER';
  allowClassroomSubmission?: boolean;
  isLoading?: boolean;
  draftId?: string;
  mode?: 'create' | 'edit';
}

export const STORY_CATEGORIES = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'family', label: 'Family' },
  { value: 'education', label: 'Education' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'real-life', label: 'Real Life' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'inspirational', label: 'Inspirational' }
] as const;

export const STORY_AGE_GROUPS = [
  { value: '3-6', label: '3-6 years (Preschool)' },
  { value: '7-9', label: '7-9 years (Early Elementary)' },
  { value: '10-12', label: '10-12 years (Elementary)' },
  { value: '13-15', label: '13-15 years (Middle School)' },
  { value: '16-18', label: '16-18 years (High School)' }
] as const;

export const STORY_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt', label: 'Portuguese' }
] as const;

export type StoryCategoryValue = typeof STORY_CATEGORIES[number]['value'];
export type StoryAgeGroupValue = typeof STORY_AGE_GROUPS[number]['value'];
export type StoryLanguageValue = typeof STORY_LANGUAGES[number]['value'];

// API Types for Text Submissions
import { UserRole, PublishingWorkflowStatus } from '@prisma/client';

export interface TextSubmissionApiRequest {
  title: string;
  contentMd: string;
  chaptersJson?: string;
  source?: 'individual' | 'classroom';
  classId?: string;
  language?: string;
  ageRange?: string;
  category?: string[];
  tags?: string[];
  summary?: string;
}

export interface TextSubmissionApiResponse {
  id: string;
  title: string;
  status: PublishingWorkflowStatus;
  source: string;
  language: string;
  ageRange?: string;
  category: string[];
  tags: string[];
  summary?: string;
  revisionNo: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
  };
  class?: {
    id: string;
    name: string;
  };
}

export interface TextSubmissionDetailResponse extends TextSubmissionApiResponse {
  contentMd: string;
  chaptersJson?: string;
  reviewNotes?: string;
  lastReviewedAt?: string;
  transitions: WorkflowTransition[];
  transitionCount: number;
}

export interface WorkflowTransition {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  createdAt: string;
  performedBy: {
    id: string;
    name?: string;
    role: UserRole;
  };
}

export interface TextSubmissionListResponse {
  success: boolean;
  submissions: TextSubmissionApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DraftApiRequest {
  id?: string;
  title: string;
  contentMd: string;
  chaptersJson?: string;
  source?: 'individual' | 'classroom';
  classId?: string;
  language?: string;
  ageRange?: string;
  category?: string[];
  tags?: string[];
  summary?: string;
  autoSave?: boolean;
}

export interface DraftApiResponse {
  id: string;
  title: string;
  source: string;
  language: string;
  ageRange?: string;
  category: string[];
  tags: string[];
  summary?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
  };
  class?: {
    id: string;
    name: string;
  };
}

export interface SubmitForReviewRequest {
  message?: string;
  requestedReviewers?: string[];
}

export interface SubmitForReviewResponse {
  success: boolean;
  submission: TextSubmissionApiResponse;
  notifications: {
    sent: boolean;
    count: number;
    error?: string;
  };
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: any;
}

// Utility types
export type TextSubmissionStatus = 'DRAFT' | 'PENDING' | 'NEEDS_REVISION' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface SubmissionAccessInfo {
  hasAccess: boolean;
  error?: string;
  submission?: any;
}

// Form validation types
export interface SubmissionValidationError {
  field: string;
  message: string;
}