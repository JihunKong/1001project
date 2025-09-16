/**
 * Status Transitions Module for Dual-Mode Publishing Workflow System
 * Implements SIMPLE and STANDARD workflow modes with comprehensive validation
 */

import { UserRole } from '@prisma/client';

export enum WorkflowMode {
  SIMPLE = 'SIMPLE',
  STANDARD = 'STANDARD'
}

export enum PublishingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  NEEDS_REVISION = 'NEEDS_REVISION',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export type TransitionAction = 
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_REVISION'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'RESUBMIT';

export interface TransitionRule {
  from: PublishingStatus;
  to: PublishingStatus;
  action: TransitionAction;
  allowedRoles: UserRole[];
  requiredFields?: string[];
  conditions?: TransitionCondition[];
  mode?: WorkflowMode[];
}

export interface TransitionCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan';
  value?: any;
}

export interface TransitionContext {
  actorRole: UserRole;
  bookData: any;
  mode: WorkflowMode;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive transition rules for both SIMPLE and STANDARD modes
 */
export const TRANSITION_RULES: TransitionRule[] = [
  // DRAFT transitions (both modes)
  {
    from: PublishingStatus.DRAFT,
    to: PublishingStatus.PENDING,
    action: 'SUBMIT',
    allowedRoles: [UserRole.LEARNER, UserRole.TEACHER, UserRole.VOLUNTEER],
    requiredFields: ['title', 'authorName', 'content'],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  },
  
  // PENDING transitions - SIMPLE mode (direct to PUBLISHED)
  {
    from: PublishingStatus.PENDING,
    to: PublishingStatus.PUBLISHED,
    action: 'APPROVE',
    allowedRoles: [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN],
    requiredFields: ['title', 'authorName', 'content', 'summary'],
    mode: [WorkflowMode.SIMPLE]
  },
  
  // PENDING transitions - STANDARD mode (to APPROVED first)
  {
    from: PublishingStatus.PENDING,
    to: PublishingStatus.APPROVED,
    action: 'APPROVE',
    allowedRoles: [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER],
    requiredFields: ['title', 'authorName', 'content', 'summary'],
    mode: [WorkflowMode.STANDARD]
  },
  
  // APPROVED to PUBLISHED (STANDARD mode only)
  {
    from: PublishingStatus.APPROVED,
    to: PublishingStatus.PUBLISHED,
    action: 'PUBLISH',
    allowedRoles: [UserRole.CONTENT_ADMIN, UserRole.ADMIN],
    requiredFields: ['pdfPath', 'pageCount', 'checksum'],
    conditions: [
      { field: 'pageCount', operator: 'greaterThan', value: 0 },
      { field: 'checksum', operator: 'exists' }
    ],
    mode: [WorkflowMode.STANDARD]
  },
  
  // Revision requests (both modes)
  {
    from: PublishingStatus.PENDING,
    to: PublishingStatus.NEEDS_REVISION,
    action: 'REQUEST_REVISION',
    allowedRoles: [UserRole.STORY_MANAGER, UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN],
    requiredFields: ['revisionReason'],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  },
  {
    from: PublishingStatus.APPROVED,
    to: PublishingStatus.NEEDS_REVISION,
    action: 'REQUEST_REVISION',
    allowedRoles: [UserRole.CONTENT_ADMIN, UserRole.ADMIN],
    requiredFields: ['revisionReason'],
    mode: [WorkflowMode.STANDARD]
  },
  
  // Resubmission from revision
  {
    from: PublishingStatus.NEEDS_REVISION,
    to: PublishingStatus.PENDING,
    action: 'RESUBMIT',
    allowedRoles: [UserRole.LEARNER, UserRole.TEACHER, UserRole.VOLUNTEER],
    requiredFields: ['title', 'authorName', 'content'],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  },
  
  // Archive transitions (from any status except ARCHIVED)
  {
    from: PublishingStatus.DRAFT,
    to: PublishingStatus.ARCHIVED,
    action: 'ARCHIVE',
    allowedRoles: [UserRole.ADMIN, UserRole.CONTENT_ADMIN],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  },
  {
    from: PublishingStatus.PENDING,
    to: PublishingStatus.ARCHIVED,
    action: 'ARCHIVE',
    allowedRoles: [UserRole.ADMIN, UserRole.CONTENT_ADMIN],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  },
  {
    from: PublishingStatus.NEEDS_REVISION,
    to: PublishingStatus.ARCHIVED,
    action: 'ARCHIVE',
    allowedRoles: [UserRole.ADMIN, UserRole.CONTENT_ADMIN],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  },
  {
    from: PublishingStatus.APPROVED,
    to: PublishingStatus.ARCHIVED,
    action: 'ARCHIVE',
    allowedRoles: [UserRole.ADMIN, UserRole.CONTENT_ADMIN],
    mode: [WorkflowMode.STANDARD]
  },
  {
    from: PublishingStatus.PUBLISHED,
    to: PublishingStatus.ARCHIVED,
    action: 'ARCHIVE',
    allowedRoles: [UserRole.ADMIN],
    mode: [WorkflowMode.SIMPLE, WorkflowMode.STANDARD]
  }
];

/**
 * Validates if a status transition is allowed
 */
export function validateTransition(
  from: PublishingStatus,
  to: PublishingStatus,
  action: TransitionAction,
  context: TransitionContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find applicable rule
  const rule = TRANSITION_RULES.find(r => 
    r.from === from && 
    r.to === to && 
    r.action === action &&
    (!r.mode || r.mode.includes(context.mode))
  );

  if (!rule) {
    errors.push(`Transition from ${from} to ${to} with action ${action} is not allowed in ${context.mode} mode`);
    return { valid: false, errors, warnings };
  }

  // Check role permissions
  if (!rule.allowedRoles.includes(context.actorRole)) {
    errors.push(`Role ${context.actorRole} is not authorized to perform ${action}`);
  }

  // Validate required fields
  if (rule.requiredFields) {
    for (const field of rule.requiredFields) {
      if (!context.bookData[field]) {
        errors.push(`Required field '${field}' is missing or empty`);
      }
    }
  }

  // Validate conditions
  if (rule.conditions) {
    for (const condition of rule.conditions) {
      const fieldValue = context.bookData[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          if (fieldValue !== condition.value) {
            errors.push(`Field '${condition.field}' must equal ${condition.value}`);
          }
          break;
        case 'notEquals':
          if (fieldValue === condition.value) {
            errors.push(`Field '${condition.field}' must not equal ${condition.value}`);
          }
          break;
        case 'exists':
          if (fieldValue === undefined || fieldValue === null) {
            errors.push(`Field '${condition.field}' must exist`);
          }
          break;
        case 'notExists':
          if (fieldValue !== undefined && fieldValue !== null) {
            errors.push(`Field '${condition.field}' must not exist`);
          }
          break;
        case 'greaterThan':
          if (fieldValue <= condition.value) {
            errors.push(`Field '${condition.field}' must be greater than ${condition.value}`);
          }
          break;
        case 'lessThan':
          if (fieldValue >= condition.value) {
            errors.push(`Field '${condition.field}' must be less than ${condition.value}`);
          }
          break;
      }
    }
  }

  // Business logic validations
  validateBusinessRules(from, to, context, errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Additional business rule validations
 */
function validateBusinessRules(
  from: PublishingStatus,
  to: PublishingStatus,
  context: TransitionContext,
  errors: string[],
  warnings: string[]
): void {
  // Prevent backward transitions (except for revision workflows)
  const backwardTransitions = [
    [PublishingStatus.PUBLISHED, PublishingStatus.APPROVED],
    [PublishingStatus.PUBLISHED, PublishingStatus.PENDING],
    [PublishingStatus.APPROVED, PublishingStatus.PENDING],
  ];

  for (const [fromStatus, toStatus] of backwardTransitions) {
    if (from === fromStatus && to === toStatus) {
      errors.push(`Backward transition from ${from} to ${to} is not allowed`);
    }
  }

  // Archive state validations
  if (to === PublishingStatus.ARCHIVED && from === PublishingStatus.ARCHIVED) {
    errors.push('Content is already archived');
  }

  if (from === PublishingStatus.ARCHIVED && to !== PublishingStatus.DRAFT) {
    errors.push('Archived content can only be restored to DRAFT status');
  }

  // Metadata requirements for specific transitions
  if (to === PublishingStatus.NEEDS_REVISION && !context.metadata?.rejectionTemplateId) {
    warnings.push('Consider using a rejection template for consistent feedback');
  }

  // Version control validation
  if (context.bookData.version && context.metadata?.expectedVersion) {
    if (context.bookData.version !== context.metadata.expectedVersion) {
      errors.push('Version mismatch detected. Please refresh and try again.');
    }
  }
}

/**
 * Gets all valid transitions from a given status for a specific role and mode
 */
export function getValidTransitions(
  from: PublishingStatus,
  actorRole: UserRole,
  mode: WorkflowMode
): TransitionRule[] {
  return TRANSITION_RULES.filter(rule => 
    rule.from === from &&
    rule.allowedRoles.includes(actorRole) &&
    (!rule.mode || rule.mode.includes(mode))
  );
}

/**
 * Checks if a specific transition is valid without full validation
 */
export function isTransitionAllowed(
  from: PublishingStatus,
  to: PublishingStatus,
  action: TransitionAction,
  actorRole: UserRole,
  mode: WorkflowMode
): boolean {
  return TRANSITION_RULES.some(rule => 
    rule.from === from &&
    rule.to === to &&
    rule.action === action &&
    rule.allowedRoles.includes(actorRole) &&
    (!rule.mode || rule.mode.includes(mode))
  );
}

/**
 * Gets the workflow steps for a given mode
 */
export function getWorkflowSteps(mode: WorkflowMode): PublishingStatus[] {
  switch (mode) {
    case WorkflowMode.SIMPLE:
      return [
        PublishingStatus.DRAFT,
        PublishingStatus.PENDING,
        PublishingStatus.PUBLISHED
      ];
    case WorkflowMode.STANDARD:
      return [
        PublishingStatus.DRAFT,
        PublishingStatus.PENDING,
        PublishingStatus.APPROVED,
        PublishingStatus.PUBLISHED
      ];
    default:
      throw new Error(`Unknown workflow mode: ${mode}`);
  }
}

/**
 * Generates transition invariant checks
 */
export function checkInvariants(context: TransitionContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check data consistency
  if (context.bookData.publishedAt && context.bookData.status !== PublishingStatus.PUBLISHED) {
    errors.push('Book has publishedAt date but status is not PUBLISHED');
  }

  if (context.bookData.status === PublishingStatus.PUBLISHED && !context.bookData.publishedAt) {
    errors.push('Published book must have publishedAt timestamp');
  }

  // Check role-specific invariants
  if (context.actorRole === UserRole.LEARNER && context.bookData.status === PublishingStatus.PUBLISHED) {
    warnings.push('Learner attempting to publish content - verify permissions');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * StatusTransitions helper class for backward compatibility
 */
export const StatusTransitions = {
  canTransition: (
    role: UserRole,
    from: string,
    to: string,
    mode: string = 'STANDARD'
  ): boolean => {
    return isTransitionAllowed(
      from as PublishingStatus,
      to as PublishingStatus,
      'APPROVE', // Default action, adjust as needed
      role,
      mode as WorkflowMode
    );
  },
  
  validateInvariants: (targetStatus: string, book: any): string[] => {
    const context: TransitionContext = {
      actorRole: UserRole.ADMIN,
      bookData: { ...book, status: targetStatus },
      mode: WorkflowMode.STANDARD
    };
    const result = checkInvariants(context);
    return result.errors;
  }
};
