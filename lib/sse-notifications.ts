import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// SSE Event Types
export interface SSEEvent {
  type: 'STATUS_UPDATE' | 'NEW_SUBMISSION' | 'FEEDBACK_RECEIVED' | 'HEARTBEAT';
  submissionId?: string;
  data: {
    id?: string;
    status?: string;
    title?: string;
    authorId?: string;
    timestamp: string;
    [key: string]: any;
  };
}

// Store active connections
export const connections = new Map<string, {
  userId: string;
  userRole: UserRole;
  controller: ReadableStreamDefaultController;
  heartbeatInterval: NodeJS.Timeout;
}>();

// Helper function to send SSE event
export function sendSSEEvent(controller: ReadableStreamDefaultController, event: SSEEvent) {
  try {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(new TextEncoder().encode(data));
  } catch (error) {
    console.error('Error sending SSE event:', error);
  }
}

// Helper function to broadcast event to relevant users
export function broadcastSSEEvent(event: SSEEvent, targetUserId?: string, targetRole?: UserRole) {
  connections.forEach((connection, connectionId) => {
    try {
      // Send to specific user
      if (targetUserId && connection.userId === targetUserId) {
        sendSSEEvent(connection.controller, event);
        return;
      }

      // Send to users with specific role
      if (targetRole && connection.userRole === targetRole) {
        sendSSEEvent(connection.controller, event);
        return;
      }

      // Send to all if no specific targeting
      if (!targetUserId && !targetRole) {
        sendSSEEvent(connection.controller, event);
      }
    } catch (error) {
      console.error(`Error broadcasting to connection ${connectionId}:`, error);
      // Remove broken connection
      clearInterval(connection.heartbeatInterval);
      connections.delete(connectionId);
    }
  });
}

// Helper function to send notification when submission status changes
export async function notifySubmissionStatusChange(submissionId: string, newStatus: string, authorId: string) {
  try {
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    if (!submission) return;

    const event: SSEEvent = {
      type: 'STATUS_UPDATE',
      submissionId,
      data: {
        id: submissionId,
        status: newStatus,
        title: submission.title,
        authorId: submission.authorId,
        timestamp: new Date().toISOString()
      }
    };

    // Send to submission author
    broadcastSSEEvent(event, authorId);

    // Send to relevant managers based on status
    switch (newStatus) {
      case 'PENDING':
      case 'STORY_REVIEW':
        broadcastSSEEvent(event, undefined, UserRole.STORY_MANAGER);
        break;
      case 'STORY_APPROVED':
      case 'FORMAT_REVIEW':
        broadcastSSEEvent(event, undefined, UserRole.BOOK_MANAGER);
        break;
      case 'FORMAT_APPROVED':
        broadcastSSEEvent(event, undefined, UserRole.CONTENT_ADMIN);
        break;
    }

    // Also send to admins
    broadcastSSEEvent(event, undefined, UserRole.ADMIN);
    broadcastSSEEvent(event, undefined, UserRole.CONTENT_ADMIN);

  } catch (error) {
    console.error('Error notifying submission status change:', error);
  }
}

// Helper function to send notification for new submissions
export async function notifyNewSubmission(submissionId: string) {
  try {
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    if (!submission) return;

    const event: SSEEvent = {
      type: 'NEW_SUBMISSION',
      submissionId,
      data: {
        id: submissionId,
        title: submission.title,
        authorId: submission.authorId,
        authorName: submission.author.name,
        timestamp: new Date().toISOString()
      }
    };

    // Notify story managers and admins about new submissions
    broadcastSSEEvent(event, undefined, UserRole.STORY_MANAGER);
    broadcastSSEEvent(event, undefined, UserRole.ADMIN);
    broadcastSSEEvent(event, undefined, UserRole.CONTENT_ADMIN);

  } catch (error) {
    console.error('Error notifying new submission:', error);
  }
}

// Helper function to send notification when feedback is received
export async function notifyFeedbackReceived(submissionId: string, reviewerRole: UserRole, authorId: string) {
  try {
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, title: true, authorId: true }
    });

    if (!submission) return;

    const event: SSEEvent = {
      type: 'FEEDBACK_RECEIVED',
      submissionId,
      data: {
        id: submissionId,
        title: submission.title,
        reviewerRole,
        timestamp: new Date().toISOString()
      }
    };

    // Send to submission author
    broadcastSSEEvent(event, authorId);

  } catch (error) {
    console.error('Error notifying feedback received:', error);
  }
}