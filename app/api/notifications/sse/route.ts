import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { connections, sendSSEEvent, SSEEvent } from '@/lib/sse-notifications';
import { logger } from '@/lib/logger';

// GET /api/notifications/sse - Server-Sent Events endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Create connection ID
    const connectionId = `${user.id}-${Date.now()}`;

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        sendSSEEvent(controller, {
          type: 'HEARTBEAT',
          data: {
            message: 'Connected to notification stream',
            timestamp: new Date().toISOString()
          }
        });

        // Set up heartbeat
        const heartbeatInterval = setInterval(() => {
          sendSSEEvent(controller, {
            type: 'HEARTBEAT',
            data: {
              message: 'ping',
              timestamp: new Date().toISOString()
            }
          });
        }, 30000); // 30 seconds

        // Store connection
        connections.set(connectionId, {
          userId: user.id,
          userRole: user.role,
          controller,
          heartbeatInterval
        });

        logger.info('SSE connection established', {
          userId: user.id,
          userName: user.name,
          userRole: user.role
        });
      },

      cancel() {
        // Clean up connection
        const connection = connections.get(connectionId);
        if (connection) {
          clearInterval(connection.heartbeatInterval);
          connections.delete(connectionId);
          logger.info('SSE connection closed', { userId: user.id });
        }
      }
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    logger.error('SSE endpoint error', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}