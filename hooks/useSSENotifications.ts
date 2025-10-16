'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SSEEvent } from '@/types/api';

interface UseSSENotificationsOptions {
  onStatusUpdate?: (event: SSEEvent) => void;
  onNewSubmission?: (event: SSEEvent) => void;
  onFeedbackReceived?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useSSENotifications(options: UseSSENotificationsOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 5;

  const {
    onStatusUpdate,
    onNewSubmission,
    onFeedbackReceived,
    onError,
    enabled = true
  } = options;

  const connect = () => {
    if (!session?.user?.id || !enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/notifications/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setError(null);
        retryCount.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);

          // Handle different event types
          switch (data.type) {
            case 'STATUS_UPDATE':
              onStatusUpdate?.(data);
              break;
            case 'NEW_SUBMISSION':
              onNewSubmission?.(data);
              break;
            case 'FEEDBACK_RECEIVED':
              onFeedbackReceived?.(data);
              break;
            case 'HEARTBEAT':
              // Just keep connection alive
              console.log('SSE heartbeat received');
              break;
            default:
              console.log('Unknown SSE event type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        setIsConnected(false);

        const errorMessage = 'Connection to notification service lost';
        setError(errorMessage);
        onError?.(new Error(errorMessage));

        // Implement exponential backoff for reconnection
        if (retryCount.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
          retryTimeoutRef.current = setTimeout(() => {
            retryCount.current++;
            console.log(`Attempting SSE reconnection (${retryCount.current}/${maxRetries})`);
            connect();
          }, delay);
        } else {
          setError('Failed to connect to notification service after multiple attempts');
        }
      };

    } catch (err) {
      console.error('Failed to create SSE connection:', err);
      setError('Failed to create notification connection');
      onError?.(err as Error);
    }
  };

  const disconnect = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setError(null);
    retryCount.current = 0;
  };

  const reconnect = () => {
    disconnect();
    retryCount.current = 0;
    connect();
  };

  useEffect(() => {
    if (session?.user?.id && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user?.id, enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    error,
    reconnect,
    disconnect
  };
}