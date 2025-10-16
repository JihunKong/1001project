// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Session Types
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'LEARNER' | 'TEACHER' | 'WRITER' | 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN' | 'ADMIN' | 'INSTITUTION';
  emailVerified?: Date | null;
}

export interface ExtendedSession {
  user: SessionUser;
  expires: string;
}

// Book Types
export interface Book {
  id: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  contentType: 'TEXT' | 'PDF' | 'EPUB' | 'AUDIO' | 'MULTIMEDIA' | 'INTERACTIVE';
  authorName: string;
  authorAlias?: string | null;
  language: string;
  ageRange?: string | null;
  readingLevel?: string | null;
  category: string[];
  genres: string[];
  tags: string[];
  coverImage?: string | null;
  visibility: 'PUBLIC' | 'RESTRICTED' | 'CLASSROOM' | 'PRIVATE';
  isPremium: boolean;
  isPublished: boolean;
  featured: boolean;
  price?: number | null;
  currency?: string | null;
  viewCount: number;
  rating: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string | null;
    role: string;
  };
}

// Submission Types
export interface TextSubmission {
  id: string;
  title: string;
  authorAlias: string | null;
  textContent: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  language: string;
  ageRange?: string | null;
  category: string[];
  tags: string[];
  summary: string;
  visibility: 'PUBLIC' | 'RESTRICTED';
  wordCount?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Stats Types
export interface VolunteerStats {
  submissionsTotal: number;
  submissionsApproved: number;
  submissionsPublished: number;
  readersReached: number;
  totalContributions: number;
  rank: string;
  achievements: Achievement[];
}

export interface Achievement {
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

// Form Data Types
export interface SubmissionFormData {
  title: string;
  authorAlias: string;
  textContent: string;
  summary: string;
  language: string;
  ageRange?: string;
  category: string[];
  tags: string[];
  visibility: 'PUBLIC' | 'RESTRICTED';
  targetAudience?: string;
  licenseType?: string;
}

// SSE Event Types for real-time notifications
export interface SSEEvent {
  type: 'STATUS_UPDATE' | 'NEW_SUBMISSION' | 'FEEDBACK_RECEIVED' | 'HEARTBEAT';
  submissionId?: string;
  data: {
    id?: string;
    status?: string;
    title?: string;
    authorId?: string;
    authorName?: string;
    reviewerRole?: string;
    message?: string;
    timestamp: string;
    [key: string]: any;
  };
}

// Event Handler Types
export type FormEventHandler<T = HTMLFormElement> = (event: React.FormEvent<T>) => void;
export type ChangeEventHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;
export type ClickEventHandler<T = HTMLButtonElement> = (event: React.MouseEvent<T>) => void;