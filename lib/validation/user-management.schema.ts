import { z } from 'zod';
import { UserRole } from '@prisma/client';

// User role enum schema
export const userRoleSchema = z.enum([
  'LEARNER',
  'TEACHER',
  'INSTITUTION',
  'WRITER',
  'STORY_MANAGER',
  'BOOK_MANAGER',
  'CONTENT_ADMIN',
  'ADMIN'
]);

// Profile data schema
export const profileSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  organization: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
}).optional();

// Create user schema
export const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255),
  name: z.string()
    .min(1, 'Name is required')
    .max(100),
  role: userRoleSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .optional(),
  profile: profileSchema,
});

// Update user schema (all fields optional except validation rules)
export const updateUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255)
    .optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100)
    .optional(),
  role: userRoleSchema.optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .optional(),
  profile: profileSchema,
});

// Query parameters schema for list users
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  role: userRoleSchema.optional(),
  status: z.preprocess(
    (val) => val === '' || val === null ? undefined : val,
    z.string()
      .toLowerCase()
      .transform(val => val as 'active' | 'deleted')
      .pipe(z.enum(['active', 'deleted']))
      .optional()
  ),
  sortBy: z.enum(['createdAt', 'name', 'email', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
