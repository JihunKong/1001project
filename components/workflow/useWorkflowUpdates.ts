'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseWorkflowUpdatesOptions {
  enabled?: boolean;
  interval?: number; // ms
  onUpdate?: () => void;
}

export function useWorkflowUpdates({
  enabled = true,
  interval = 30000, // 30 seconds
  onUpdate
}: UseWorkflowUpdatesOptions = {}) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkForUpdates = useCallback(async () => {
    if (!enabled) return;

    setIsPolling(true);
    try {
      // Simple heartbeat to check if there are updates
      const response = await fetch('/api/text-submissions?limit=1&latest=true', {
        method: 'HEAD' // Just check headers
      });

      if (response.ok) {
        const serverTime = response.headers.get('x-last-modified');
        if (serverTime) {
          const serverDate = new Date(serverTime);
          if (!lastUpdated || serverDate > lastUpdated) {
            setLastUpdated(serverDate);
            onUpdate?.();
          }
        }
      }
    } catch (error) {
      // Workflow update check failed
    } finally {
      setIsPolling(false);
    }
  }, [enabled, lastUpdated, onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForUpdates();

    // Set up polling
    const intervalId = setInterval(checkForUpdates, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, checkForUpdates]);

  // Manual refresh function
  const refresh = useCallback(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    lastUpdated,
    isPolling,
    refresh
  };
}