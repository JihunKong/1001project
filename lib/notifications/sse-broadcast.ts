import { logger } from '@/lib/logger';

// Map to track active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>();

export { connections };

// Function to broadcast notification to user (called from other parts of the app)
export function broadcastNotification(userId: string, notification: any) {
  // Find all connections for this user
  const userConnections = Array.from(connections.entries())
    .filter(([connectionId]) => connectionId.startsWith(userId));

  if (userConnections.length === 0) {
    // No active connections to broadcast to
    return;
  }

  userConnections.forEach(([connectionId, controller]) => {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      logger.error(`Error broadcasting notification to connection ${connectionId}`, error);
      connections.delete(connectionId);
    }
  });
}

// Function to broadcast status change to user
export function broadcastStatusChange(userId: string, submissionId: string, oldStatus: string, newStatus: string, details?: any) {
  // Find all connections for this user
  const userConnections = Array.from(connections.entries())
    .filter(([connectionId]) => connectionId.startsWith(userId));

  if (userConnections.length === 0) {
    // No active connections to broadcast to
    return;
  }

  userConnections.forEach(([connectionId, controller]) => {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'status_change',
        data: {
          submissionId,
          oldStatus,
          newStatus,
          details,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      logger.error(`Error broadcasting status change to connection ${connectionId}`, error);
      connections.delete(connectionId);
    }
  });
}