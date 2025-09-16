import { prisma } from '@/lib/prisma';
import { UserRole, AuditAction } from '@prisma/client';

export interface AuditEventData {
  timestamp: Date;
  userId?: string;
  action: string; // We'll use string for now since enum needs to be extended
  resource: string;
  ip: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, any>;
  entityType?: string;
  entityId?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
}

export async function logAuditEvent(event: AuditEventData): Promise<void> {
  try {
    // For now, we'll log to console and database if possible
    console.log('[AUDIT]', JSON.stringify({
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      ip: event.ip,
      success: event.success,
      metadata: event.metadata
    }));

    // Try to save to database if we have user ID and valid action
    if (event.userId && isValidAuditAction(event.action)) {
      try {
        await prisma.auditEvent.create({
          data: {
            entityType: event.entityType || 'UPLOAD',
            entityId: event.entityId || event.resource,
            actorId: event.userId,
            actorRole: await getUserRole(event.userId),
            action: mapActionToEnum(event.action),
            previousState: event.previousState,
            newState: event.newState,
            metadata: {
              ...event.metadata,
              ip: event.ip,
              userAgent: event.userAgent,
              resource: event.resource,
              success: event.success
            },
            timestamp: event.timestamp
          }
        });
      } catch (dbError) {
        console.error('[AUDIT] Failed to save to database:', dbError);
        // Continue with console logging as fallback
      }
    }
  } catch (error) {
    console.error('[AUDIT] Logging failed:', error);
  }
}

function isValidAuditAction(action: string): boolean {
  const validActions = [
    'CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 
    'PUBLISHED', 'EDITED', 'ASSIGNED', 'VIEWED', 'DOWNLOADED'
  ];
  return validActions.includes(action) || action.includes('UPLOAD');
}

function mapActionToEnum(action: string): AuditAction {
  // Map upload-specific actions to existing enum values
  switch (action) {
    case 'UPLOAD_INIT':
    case 'UPLOAD_COMMIT_SUCCESS':
      return AuditAction.CREATED;
    case 'UPLOAD_COMMIT_FAILURE':
    case 'UPLOAD_COMMIT_SYSTEM_ERROR':
    case 'INVALID_PDF_UPLOAD':
      return AuditAction.REJECTED;
    case 'UPLOAD_DUPLICATE_DETECTED':
      return AuditAction.VIEWED;
    default:
      // Try to match existing actions
      const enumValue = Object.values(AuditAction).find(
        val => val === action
      );
      return enumValue || AuditAction.CREATED;
  }
}

async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    return user?.role || UserRole.LEARNER;
  } catch {
    return UserRole.LEARNER;
  }
}

// Specialized audit loggers for common events
export const auditLogger = {
  // Upload related events
  uploadInit: async (userId: string, uploadId: string, fileName: string, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action: 'UPLOAD_INIT',
      resource: `/api/uploads/init`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: true,
      entityType: 'UPLOAD',
      entityId: uploadId,
      metadata: {
        uploadId,
        fileName,
        fileSize: metadata.fileSize,
        expectedSHA256: metadata.expectedSHA256,
        idempotencyKey: metadata.idempotencyKey
      }
    });
  },

  uploadChunk: async (userId: string, uploadId: string, partNumber: number, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action: 'UPLOAD_CHUNK',
      resource: `/api/uploads/${uploadId}/part/${partNumber}`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: metadata.success,
      entityType: 'UPLOAD',
      entityId: uploadId,
      metadata: {
        uploadId,
        partNumber,
        chunkSize: metadata.chunkSize,
        chunkHash: metadata.chunkHash
      }
    });
  },

  uploadCommitSuccess: async (userId: string, uploadId: string, result: Record<string, any>, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action: 'UPLOAD_COMMIT_SUCCESS',
      resource: `/api/uploads/${uploadId}/commit`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: true,
      entityType: 'FILE',
      entityId: result.finalSHA256,
      metadata: {
        uploadId,
        sha256: result.finalSHA256,
        size: result.size,
        isDuplicate: result.isDuplicate,
        storagePath: result.storagePath,
        fileName: metadata.fileName,
        duration: metadata.duration
      }
    });
  },

  uploadCommitFailure: async (userId: string, uploadId: string, error: string, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action: 'UPLOAD_COMMIT_FAILURE',
      resource: `/api/uploads/${uploadId}/commit`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: false,
      entityType: 'UPLOAD',
      entityId: uploadId,
      metadata: {
        uploadId,
        error,
        duration: metadata.duration
      }
    });
  },

  // Book management events
  bookCreate: async (userId: string, bookId: string, bookData: Record<string, any>, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action: 'CREATED',
      resource: `/api/admin/books`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: true,
      entityType: 'BOOK',
      entityId: bookId,
      newState: bookData,
      metadata: {
        bookId,
        title: bookData.title,
        authorName: bookData.authorName,
        status: bookData.status
      }
    });
  },

  bookUpdate: async (userId: string, bookId: string, previousData: Record<string, any>, newData: Record<string, any>, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action: 'EDITED',
      resource: `/api/admin/books/${bookId}`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: true,
      entityType: 'BOOK',
      entityId: bookId,
      previousState: previousData,
      newState: newData,
      metadata: {
        bookId,
        changes: getChangedFields(previousData, newData)
      }
    });
  },

  bookStatusChange: async (userId: string, bookId: string, oldStatus: string, newStatus: string, metadata: Record<string, any>) => {
    const action = newStatus === 'PUBLISHED' ? 'PUBLISHED' : 
                  newStatus === 'APPROVED' ? 'APPROVED' :
                  newStatus === 'REJECTED' ? 'REJECTED' : 'EDITED';

    await logAuditEvent({
      timestamp: new Date(),
      userId,
      action,
      resource: `/api/admin/books/${bookId}/status`,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: true,
      entityType: 'BOOK',
      entityId: bookId,
      previousState: { status: oldStatus },
      newState: { status: newStatus },
      metadata: {
        bookId,
        statusTransition: `${oldStatus} -> ${newStatus}`,
        reason: metadata.reason
      }
    });
  },

  // Security events
  unauthorizedAccess: async (userId: string | null, resource: string, metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      userId: userId || undefined,
      action: 'UNAUTHORIZED_ACCESS',
      resource,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || '',
      success: false,
      entityType: 'SECURITY',
      entityId: resource,
      metadata: {
        reason: metadata.reason || 'Access denied',
        attemptedRole: metadata.attemptedRole
      }
    });
  },

  // System events
  virusScanResult: async (sha256: string, result: 'CLEAN' | 'INFECTED' | 'ERROR', metadata: Record<string, any>) => {
    await logAuditEvent({
      timestamp: new Date(),
      action: result === 'CLEAN' ? 'APPROVED' : 'REJECTED',
      resource: `/security/virus-scan/${sha256}`,
      ip: 'system',
      userAgent: 'antivirus-scanner',
      success: result !== 'ERROR',
      entityType: 'FILE',
      entityId: sha256,
      metadata: {
        sha256,
        scanResult: result,
        scanEngine: metadata.scanEngine || 'unknown',
        threatName: metadata.threatName,
        duration: metadata.duration
      }
    });
  }
};

// Helper function to detect changed fields
function getChangedFields(oldData: Record<string, any>, newData: Record<string, any>): string[] {
  const changes: string[] = [];
  
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changes.push(key);
    }
  }
  
  return changes;
}

// Export types for use in other modules
export type { AuditEventData };