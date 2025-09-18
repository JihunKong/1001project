import { UserRole } from '@prisma/client';

export const PERMISSIONS = {
  // Book Access
  BOOK_VIEW_ALL: 'book:view:all',
  BOOK_VIEW_ASSIGNED: 'book:view:assigned',
  BOOK_ASSIGN: 'book:assign',
  BOOK_CREATE: 'book:create',
  BOOK_EDIT: 'book:edit',
  BOOK_DELETE: 'book:delete',
  
  // Content Management
  CONTENT_SUBMIT: 'content:submit',
  CONTENT_REVIEW_STORY: 'content:review:story',
  CONTENT_REVIEW_FORMAT: 'content:review:format',
  CONTENT_APPROVE_FINAL: 'content:approve:final',
  CONTENT_EDIT_ANY: 'content:edit:any',
  CONTENT_VIEW_QUEUE: 'content:view:queue',
  
  // Class Management
  CLASS_CREATE: 'class:create',
  CLASS_JOIN: 'class:join',
  CLASS_MANAGE_OWN: 'class:manage:own',
  CLASS_MANAGE_ALL: 'class:manage:all',
  CLASS_VIEW_PROGRESS: 'class:view:progress',
  
  // Student Management
  STUDENT_VIEW_OWN: 'student:view:own',
  STUDENT_VIEW_CLASS: 'student:view:class',
  STUDENT_VIEW_ALL: 'student:view:all',
  STUDENT_MANAGE: 'student:manage',
  
  // AI Features
  AI_USE_CHAT: 'ai:use:chat',
  AI_USE_TTS: 'ai:use:tts',
  AI_GENERATE_IMAGE: 'ai:generate:image',
  AI_PARSE_CONTENT: 'ai:parse:content',
  AI_MANAGE: 'ai:manage',
  
  // Vocabulary
  VOCABULARY_VIEW_OWN: 'vocabulary:view:own',
  VOCABULARY_VIEW_CLASS: 'vocabulary:view:class',
  VOCABULARY_MANAGE: 'vocabulary:manage',
  
  // Book Club
  BOOKCLUB_CREATE: 'bookclub:create',
  BOOKCLUB_JOIN: 'bookclub:join',
  BOOKCLUB_MANAGE_OWN: 'bookclub:manage:own',
  BOOKCLUB_MANAGE_ALL: 'bookclub:manage:all',
  
  // Analytics
  ANALYTICS_VIEW_OWN: 'analytics:view:own',
  ANALYTICS_VIEW_CLASS: 'analytics:view:class',
  ANALYTICS_VIEW_ALL: 'analytics:view:all',
  
  // System
  SYSTEM_ADMIN: 'system:admin',
  USER_MANAGE: 'user:manage',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CUSTOMER]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOKCLUB_JOIN,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.VOCABULARY_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
  ],
  
  [UserRole.LEARNER]: [
    PERMISSIONS.BOOK_VIEW_ASSIGNED,
    PERMISSIONS.CONTENT_SUBMIT,
    PERMISSIONS.CLASS_JOIN,
    PERMISSIONS.BOOKCLUB_CREATE,
    PERMISSIONS.BOOKCLUB_JOIN,
    PERMISSIONS.BOOKCLUB_MANAGE_OWN,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.VOCABULARY_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
  ],
  
  [UserRole.TEACHER]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOK_ASSIGN,
    PERMISSIONS.CONTENT_SUBMIT,
    PERMISSIONS.CLASS_CREATE,
    PERMISSIONS.CLASS_MANAGE_OWN,
    PERMISSIONS.CLASS_VIEW_PROGRESS,
    PERMISSIONS.STUDENT_VIEW_CLASS,
    PERMISSIONS.BOOKCLUB_CREATE,
    PERMISSIONS.BOOKCLUB_JOIN,
    PERMISSIONS.BOOKCLUB_MANAGE_OWN,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.AI_PARSE_CONTENT,
    PERMISSIONS.VOCABULARY_VIEW_OWN,
    PERMISSIONS.VOCABULARY_VIEW_CLASS,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_CLASS,
  ],
  
  [UserRole.INSTITUTION]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOK_ASSIGN,
    PERMISSIONS.CLASS_CREATE,
    PERMISSIONS.CLASS_MANAGE_ALL,
    PERMISSIONS.CLASS_VIEW_PROGRESS,
    PERMISSIONS.STUDENT_VIEW_ALL,
    PERMISSIONS.STUDENT_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
    PERMISSIONS.USER_MANAGE,
  ],
  
  [UserRole.VOLUNTEER]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.CONTENT_SUBMIT,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.VOCABULARY_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
  ],
  
  [UserRole.EDITOR]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOK_EDIT,
    PERMISSIONS.CONTENT_SUBMIT,
    PERMISSIONS.CONTENT_EDIT_ANY,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.AI_GENERATE_IMAGE,
    PERMISSIONS.AI_PARSE_CONTENT,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
  ],
  
  [UserRole.PUBLISHER]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOK_CREATE,
    PERMISSIONS.BOOK_EDIT,
    PERMISSIONS.BOOK_DELETE,
    PERMISSIONS.CONTENT_EDIT_ANY,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.AI_GENERATE_IMAGE,
    PERMISSIONS.AI_PARSE_CONTENT,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
  ],
  
  [UserRole.STORY_MANAGER]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.CONTENT_REVIEW_STORY,
    PERMISSIONS.CONTENT_EDIT_ANY,
    PERMISSIONS.CONTENT_VIEW_QUEUE,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.AI_PARSE_CONTENT,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
  ],
  
  [UserRole.BOOK_MANAGER]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOK_CREATE,
    PERMISSIONS.BOOK_EDIT,
    PERMISSIONS.CONTENT_REVIEW_FORMAT,
    PERMISSIONS.CONTENT_VIEW_QUEUE,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.AI_GENERATE_IMAGE,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
  ],
  
  [UserRole.CONTENT_ADMIN]: [
    PERMISSIONS.BOOK_VIEW_ALL,
    PERMISSIONS.BOOK_CREATE,
    PERMISSIONS.BOOK_EDIT,
    PERMISSIONS.BOOK_DELETE,
    PERMISSIONS.CONTENT_APPROVE_FINAL,
    PERMISSIONS.CONTENT_EDIT_ANY,
    PERMISSIONS.CONTENT_VIEW_QUEUE,
    PERMISSIONS.AI_USE_CHAT,
    PERMISSIONS.AI_USE_TTS,
    PERMISSIONS.AI_GENERATE_IMAGE,
    PERMISSIONS.AI_PARSE_CONTENT,
    PERMISSIONS.AI_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
  ],
  
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user can access a specific book
 * This requires additional context like assignments
 */
export async function canAccessBook(
  userId: string,
  bookId: string,
  role: UserRole,
  prisma: any
): Promise<boolean> {
  // Admin and content managers can access all books
  if ([UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.PUBLISHER].includes(role)) {
    return true;
  }
  
  // Teachers, editors, and managers can view all published books
  if ([UserRole.TEACHER, UserRole.EDITOR, UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER].includes(role)) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { isPublished: true }
    });
    return book?.isPublished || false;
  }
  
  // Learners can only access assigned books
  if (role === UserRole.LEARNER) {
    const assignment = await prisma.bookAssignment.findFirst({
      where: {
        bookId,
        OR: [
          {
            // Individual assignment
            studentId: userId
          },
          {
            // Class assignment
            class: {
              enrollments: {
                some: {
                  studentId: userId,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ]
      }
    });
    return !!assignment;
  }
  
  // Default: check if book is published
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { isPublished: true, isPremium: true }
  });
  
  return book?.isPublished && !book?.isPremium || false;
}

/**
 * Check if a user can manage a class
 */
export async function canManageClass(
  userId: string,
  classId: string,
  role: UserRole,
  prisma: any
): Promise<boolean> {
  // Admin and institution can manage all classes
  if ([UserRole.ADMIN, UserRole.INSTITUTION].includes(role)) {
    return true;
  }
  
  // Teachers can only manage their own classes
  if (role === UserRole.TEACHER) {
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true }
    });
    return classRecord?.teacherId === userId;
  }
  
  return false;
}

/**
 * Get the appropriate review queue for a role
 */
export function getReviewQueueStatuses(role: UserRole): string[] {
  switch (role) {
    case UserRole.STORY_MANAGER:
      return ['PENDING_REVIEW', 'REVIEWED'];
    case UserRole.BOOK_MANAGER:
      return ['APPROVED_COORDINATOR', 'PENDING_COORDINATOR'];
    case UserRole.CONTENT_ADMIN:
      return ['PENDING_ADMIN'];
    case UserRole.ADMIN:
      return ['PENDING_REVIEW', 'REVIEWED', 'PENDING_COORDINATOR', 'APPROVED_COORDINATOR', 'PENDING_ADMIN'];
    default:
      return [];
  }
}