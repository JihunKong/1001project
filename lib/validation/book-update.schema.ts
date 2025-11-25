import { z } from 'zod';

export const bookUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),

  subtitle: z.string().max(200, 'Subtitle must be less than 200 characters').optional(),

  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),

  authorName: z.string().min(1, 'Author name is required').max(100, 'Author name must be less than 100 characters').optional(),

  authorAlias: z.string().max(100, 'Author alias must be less than 100 characters').optional(),

  content: z.string().max(100000, 'Content must be less than 100000 characters').optional(),

  language: z.string().min(2).max(10).optional(),

  ageRange: z.string().max(20).optional(),

  readingLevel: z.string().max(50).optional(),

  category: z.array(z.string()).min(1, 'At least one category is required').optional(),

  genres: z.array(z.string()).optional(),

  subjects: z.array(z.string()).optional(),

  tags: z.array(z.string()).optional(),

  visibility: z.enum(['PUBLIC', 'RESTRICTED', 'CLASSROOM', 'PRIVATE']).optional(),

  isPremium: z.boolean().optional(),

  price: z.number().min(0).optional(),

  pageLayout: z.enum(['single', 'double']).optional(),

  previewPages: z.number().int().min(0).optional(),

  removeCoverImage: z.boolean().optional(),

  removePdf: z.boolean().optional(),
});

export type BookUpdateInput = z.infer<typeof bookUpdateSchema>;
