import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAccordionAutoPlayOptions {
  totalItems: number;
  interval?: number;
  enabled?: boolean;
}

export function useAccordionAutoPlay({
  totalItems,
  interval = 5000,
  enabled = true
}: UseAccordionAutoPlayOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (!enabled || isPaused) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(goToNext, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, isPaused, interval, goToNext, activeIndex]);

  return {
    activeIndex,
    goToIndex,
    goToNext,
    isPaused,
    pause,
    resume
  };
}
