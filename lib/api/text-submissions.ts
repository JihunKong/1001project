import { prisma } from '@/lib/prisma';
import { UserRole, PublishingWorkflowStatus } from '@prisma/client';
import { Session } from 'next-auth';

export interface SubmissionAccessResult {
  hasAccess: boolean;
  error?: string;
  submission?: any;
}

export async function checkTextSubmissionAccess(
  submissionId: string, 
  userId: string, 
  userRole: UserRole, 
  action: 'read' | 'write' | 'delete' | 'submit'
): Promise<SubmissionAccessResult> {
  try {
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        class: {
          select: {
            id: true,
            teacherId: true
          }
        }
      }
    });

    if (!submission) {
      return { hasAccess: false, error: 'Submission not found' };
    }

    // Managers and admins have full access
    const managerRoles = [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN];
    if (managerRoles.includes(userRole)) {
      return { hasAccess: true, submission };
    }

    // Authors have access to their own submissions
    if (submission.authorId === userId) {
      // Authors can't delete published submissions
      if (action === 'delete' && submission.status === PublishingWorkflowStatus.PUBLISHED) {
        return { hasAccess: false, error: 'Cannot delete published submissions' };
      }
      return { hasAccess: true, submission };
    }

    // Teachers can access classroom submissions from their classes
    if (userRole === UserRole.TEACHER && submission.source === 'classroom') {
      if (submission.class?.teacherId === userId) {
        // Teachers can't delete published classroom submissions
        if (action === 'delete' && submission.status === PublishingWorkflowStatus.PUBLISHED) {
          return { hasAccess: false, error: 'Cannot delete published classroom submissions' };
        }
        return { hasAccess: true, submission };
      }
    }

    return { hasAccess: false, error: 'Insufficient permissions to access this submission' };
  } catch (error) {
    console.error('Error checking submission access:', error);
    return { hasAccess: false, error: 'Failed to verify access permissions' };
  }
}

export async function validateClassroomSubmission(
  classId: string,
  teacherId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const classOwnership = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
        isActive: true
      }
    });

    if (!classOwnership) {
      return { valid: false, error: 'Class not found or you do not have permission to submit for this class' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating classroom submission:', error);
    return { valid: false, error: 'Failed to validate classroom access' };
  }
}

export function buildSubmissionWhereClause(userRole: UserRole, userId: string, teacherClassIds?: string[]) {
  switch (userRole) {
    case UserRole.LEARNER:
    case UserRole.VOLUNTEER:
      return { authorId: userId };

    case UserRole.TEACHER:
      return {
        OR: [
          { authorId: userId },
          { 
            source: 'classroom',
            classId: { in: teacherClassIds || [] }
          }
        ]
      };

    case UserRole.STORY_MANAGER:
    case UserRole.BOOK_MANAGER:
    case UserRole.CONTENT_ADMIN:
    case UserRole.ADMIN:
      return {}; // No restrictions for managers and admins

    default:
      return { id: 'impossible' }; // Return impossible condition
  }
}

export async function getTeacherClassIds(teacherId: string): Promise<string[]> {
  try {
    const classes = await prisma.class.findMany({
      where: { 
        teacherId: teacherId, 
        isActive: true 
      },
      select: { id: true }
    });
    return classes.map(c => c.id);
  } catch (error) {
    console.error('Error fetching teacher class IDs:', error);
    return [];
  }
}

export function canUserCreateSubmissions(userRole: UserRole): boolean {
  const allowedRoles = [UserRole.LEARNER, UserRole.TEACHER, UserRole.VOLUNTEER];
  return allowedRoles.includes(userRole);
}

export function canUserCreateClassroomSubmissions(userRole: UserRole): boolean {
  return userRole === UserRole.TEACHER;
}

export function validateSubmissionContent(title: string, contentMd: string): string[] {
  const errors: string[] = [];
  
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (title && title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }
  
  if (!contentMd || contentMd.trim().length < 10) {
    errors.push('Content must be at least 10 characters');
  }
  
  if (contentMd && contentMd.length > 100000) {
    errors.push('Content is too long (maximum 100,000 characters)');
  }
  
  return errors;
}

export function canSubmitForReview(status: PublishingWorkflowStatus): boolean {
  const submittableStatuses = [PublishingWorkflowStatus.DRAFT, PublishingWorkflowStatus.NEEDS_REVISION];
  return submittableStatuses.includes(status);
}

export function canEditSubmission(status: PublishingWorkflowStatus): boolean {
  const editableStatuses = [PublishingWorkflowStatus.DRAFT, PublishingWorkflowStatus.NEEDS_REVISION];
  return editableStatuses.includes(status);
}

export async function createWorkflowTransition(
  submissionId: string,
  fromStatus: string,
  toStatus: string,
  performedById: string,
  reason?: string
): Promise<void> {
  try {
    await prisma.workflowTransition.create({
      data: {
        submissionId,
        submissionType: 'TextSubmission',
        fromStatus,
        toStatus,
        performedById,
        reason: reason || `Status changed from ${fromStatus} to ${toStatus}`
      }
    });
  } catch (error) {
    console.error('Error creating workflow transition:', error);
    throw new Error('Failed to create workflow transition');
  }
}

export async function sendSubmissionNotifications(
  submissionId: string, 
  submissionTitle: string, 
  submitterName: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Find available story managers to notify
    const storyManagers = await prisma.user.findMany({
      where: { 
        role: UserRole.STORY_MANAGER,
        // Add any additional filters like active status if available
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Here you would implement your actual notification system
    // For now, we'll just log and return the count
    console.log(`Sending review notifications for submission ${submissionId} to ${storyManagers.length} story managers`);
    
    // TODO: Implement actual notification sending
    // This could be:
    // - Email notifications
    // - In-app notifications
    // - Webhook calls
    // - Push notifications
    
    return { success: true, count: storyManagers.length };
  } catch (error) {
    console.error('Error sending submission notifications:', error);
    return { success: false, count: 0, error: 'Failed to send notifications' };
  }
}

export function transformSubmissionForResponse(submission: any) {
  return {
    id: submission.id,
    title: submission.title,
    status: submission.status,
    source: submission.source,
    language: submission.language,
    ageRange: submission.ageRange,
    category: submission.category,
    tags: submission.tags,
    summary: submission.summary,
    revisionNo: submission.revisionNo,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    author: submission.author,
    class: submission.class
  };
}

export function transformDetailedSubmissionForResponse(submission: any) {
  return {
    ...transformSubmissionForResponse(submission),
    contentMd: submission.contentMd,
    chaptersJson: submission.chaptersJson,
    reviewNotes: submission.reviewNotes,
    lastReviewedAt: submission.lastReviewedAt?.toISOString() || null,
    transitions: submission.transitions?.map((t: any) => ({
      id: t.id,
      fromStatus: t.fromStatus,
      toStatus: t.toStatus,
      reason: t.reason,
      createdAt: t.createdAt.toISOString(),
      performedBy: t.performedBy
    })) || [],
    transitionCount: submission._count?.transitions || 0
  };
}

// Rate limiting and security utilities
export function isValidLanguageCode(language: string): boolean {
  const validLanguages = ['en', 'es', 'fr', 'ko', 'zh', 'ar', 'hi', 'pt'];
  return validLanguages.includes(language);
}

export function sanitizeCategories(categories: string[]): string[] {
  return categories
    .filter(cat => typeof cat === 'string' && cat.trim().length > 0)
    .map(cat => cat.trim().toLowerCase())
    .slice(0, 10); // Limit to 10 categories max
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => tag.trim().toLowerCase())
    .slice(0, 20); // Limit to 20 tags max
}