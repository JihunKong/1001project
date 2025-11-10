'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSSENotifications } from '@/hooks/useSSENotifications';
import toast from 'react-hot-toast';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session } = useSession();

  const { isConnected } = useSSENotifications({
    enabled: !!session?.user?.id,
    onStatusUpdate: (event) => {
      if (event.data) {
        toast.success(
          `${event.data.title}`,
          {
            duration: 5000,
            icon: '📝',
            position: 'top-right',
          }
        );
      }
    },
    onNewSubmission: (event) => {
      if (event.data) {
        const userRole = session?.user?.role;
        const isReviewer = userRole && ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(userRole);

        if (isReviewer) {
          toast(
            `New Submission: ${event.data.title || 'Untitled'}`,
            {
              duration: 6000,
              icon: '📨',
              position: 'top-right',
            }
          );
        }
      }
    },
    onFeedbackReceived: (event) => {
      if (event.data) {
        toast.success(
          `New Feedback: ${event.data.reviewerName || 'Reviewer'} commented on your story`,
          {
            duration: 6000,
            icon: '💬',
            position: 'top-right',
          }
        );
      }
    },
  });

  useEffect(() => {
    if (session?.user?.id) {
      console.log('[NotificationProvider] SSE connection status:', isConnected);
    }
  }, [isConnected, session?.user?.id]);

  return <>{children}</>;
}
