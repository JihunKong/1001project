import { z } from 'zod';

// Base validation schema for API use
export const submissionSchema = z.object({
  // Required fields with child-friendly error messages
  title: z.string()
    .min(1, 'Please enter a title for your story')
    .max(200, 'Title must be less than 200 characters')
    .transform(s => s.trim()),

  content: z.string()
    .min(100, 'Your story needs at least 100 characters to help readers understand it')
    .max(50000, 'Your story is too long. Please keep it under 50,000 characters'),

  summary: z.string()
    .min(20, 'Please write at least 20 characters to describe your story')
    .max(1000, 'Summary must be less than 1,000 characters')
    .transform(s => s.trim()),

  authorAlias: z.string()
    .min(1, 'Please tell us what name you\'d like readers to see')
    .max(100, 'Author name must be less than 100 characters')
    .transform(s => s.trim()),

  // Optional fields
  language: z.string().default('en'),

  ageRange: z.string().optional().nullable(),

  readingLevel: z.enum(['Beginner', 'Elementary', 'Intermediate', 'Advanced']).optional().nullable(),

  category: z.array(z.string()).default([]),

  tags: z.array(z.string()).default([]),

  // Copyright and licensing
  copyrightConfirmed: z.boolean(),

  originalWork: z.boolean().default(true),

  licenseType: z.enum([
    'CC-BY',
    'CC-BY-SA',
    'CC-BY-NC',
    'CC-BY-NC-SA',
    'All Rights Reserved'
  ]).optional().nullable(),

  termsAccepted: z.boolean()
    .refine(val => val === true, 'You must accept the terms and disclosures to submit'),
});

// Form-specific schema for client-side use (without transforms for better form compatibility)
export const formSubmissionSchema = z.object({
  title: z.string()
    .min(1, 'Please enter a title for your story')
    .max(200, 'Title must be less than 200 characters'),

  content: z.string()
    .min(100, 'Your story needs at least 100 characters to help readers understand it')
    .max(50000, 'Your story is too long. Please keep it under 50,000 characters'),

  summary: z.string()
    .min(20, 'Please write at least 20 characters to describe your story')
    .max(1000, 'Summary must be less than 1,000 characters'),

  authorAlias: z.string()
    .min(1, 'Please tell us what name you\'d like readers to see')
    .max(100, 'Author name must be less than 100 characters'),

  language: z.string(),

  ageRange: z.string().nullable().optional(),

  readingLevel: z.enum(['Beginner', 'Elementary', 'Intermediate', 'Advanced']).nullable().optional(),

  category: z.array(z.string()),

  tags: z.array(z.string()),

  copyrightConfirmed: z.boolean(),

  originalWork: z.boolean(),

  licenseType: z.enum([
    'CC-BY',
    'CC-BY-SA',
    'CC-BY-NC',
    'CC-BY-NC-SA',
    'All Rights Reserved'
  ]).nullable().optional(),

  termsAccepted: z.boolean()
    .refine(val => val === true, 'You must accept the terms and disclosures to submit'),
});

// Type inference for TypeScript
export type SubmissionData = z.infer<typeof submissionSchema>;
export type FormSubmissionData = z.infer<typeof formSubmissionSchema>;

// Validation constants
export const VALIDATION_LIMITS = {
  TITLE_MAX: 200,
  CONTENT_MIN: 100,
  CONTENT_MAX: 50000,
  SUMMARY_MIN: 20,
  SUMMARY_MAX: 1000,
  AUTHOR_ALIAS_MAX: 100,
} as const;

// Age ranges for dropdowns
export const AGE_RANGES = [
  '3-5', '5-8', '8-12', '12-16', '16+'
] as const;

// Reading levels for dropdowns
export const READING_LEVELS = [
  'Beginner', 'Elementary', 'Intermediate', 'Advanced'
] as const;

// Categories for story classification
export const CATEGORIES = [
  'Adventure', 'Fantasy', 'Mystery', 'Science Fiction', 'Historical Fiction',
  'Contemporary Fiction', 'Romance', 'Fairy Tale', 'Fable', 'Biography',
  'Nature', 'Friendship', 'Family', 'School', 'Animals', 'Cultural',
  'Educational', 'Moral', 'Inspirational'
] as const;

// License types
export const LICENSE_TYPES = [
  'CC-BY',
  'CC-BY-SA',
  'CC-BY-NC',
  'CC-BY-NC-SA',
  'All Rights Reserved'
] as const;

// Helper function to validate submission data with detailed error reporting
export function validateSubmission(data: unknown): {
  success: boolean;
  data?: SubmissionData;
  errors?: string[];
} {
  try {
    const validatedData = submissionSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Helper function for server-side partial validation (for PATCH requests)
export const partialSubmissionSchema = submissionSchema.partial();
export type PartialSubmissionData = z.infer<typeof partialSubmissionSchema>;