import { z } from 'zod';

export const bookRegistrationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),

  subtitle: z.string().max(200, 'Subtitle must be less than 200 characters').optional(),

  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),

  authorName: z.string().min(1, 'Author name is required').max(100, 'Author name must be less than 100 characters'),

  authorAlias: z.string().max(100, 'Author alias must be less than 100 characters').optional(),

  coAuthors: z.array(z.string()).optional().default([]),

  authorAge: z.number().int().min(1).max(150).optional(),

  authorLocation: z.string().max(100).optional(),

  contentType: z.literal('TEXT').default('TEXT'),

  content: z.string().min(1, 'Content is required'),

  language: z.string().min(2).max(10).default('en'),

  ageRange: z.string().max(20).optional(),

  readingLevel: z.string().max(50).optional(),

  category: z.array(z.string()).min(1, 'At least one category is required'),

  genres: z.array(z.string()).optional().default([]),

  subjects: z.array(z.string()).optional().default([]),

  tags: z.array(z.string()).optional().default([]),

  visibility: z.enum(['PUBLIC', 'RESTRICTED', 'CLASSROOM']).default('PUBLIC'),

  isPremium: z.boolean().default(false),

  price: z.number().min(0).optional(),

  pageLayout: z.enum(['single', 'double']).default('single'),

  previewPages: z.number().int().min(0).default(10),
}).refine(
  (data) => {
    if (data.isPremium && !data.price) {
      return false;
    }
    return true;
  },
  {
    message: 'Price is required for premium books',
    path: ['price'],
  }
);

export type BookRegistrationInput = z.infer<typeof bookRegistrationSchema>;

export const ALLOWED_ROLES_FOR_DIRECT_REGISTRATION = [
  'STORY_MANAGER',
  'BOOK_MANAGER',
  'CONTENT_ADMIN',
  'ADMIN',
] as const;

export type AllowedRole = typeof ALLOWED_ROLES_FOR_DIRECT_REGISTRATION[number];

export function canDirectRegisterBook(role: string): boolean {
  return ALLOWED_ROLES_FOR_DIRECT_REGISTRATION.includes(role as AllowedRole);
}

export const ALLOWED_ROLES_FOR_BOOK_EDITING = [
  'STORY_MANAGER',
  'BOOK_MANAGER',
  'CONTENT_ADMIN',
  'ADMIN',
] as const;

export type AllowedEditRole = typeof ALLOWED_ROLES_FOR_BOOK_EDITING[number];

export function canEditBook(role: string): boolean {
  return ALLOWED_ROLES_FOR_BOOK_EDITING.includes(role as AllowedEditRole);
}

export function canEditAnyBook(role: string): boolean {
  return ALLOWED_ROLES_FOR_BOOK_EDITING.includes(role as AllowedEditRole);
}

export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
