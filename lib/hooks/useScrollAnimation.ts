'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

interface ScrollAnimationState {
  isVisible: boolean;
  hasTriggered: boolean;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px 0px -50px 0px',
    triggerOnce = true,
    delay = 0
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<ScrollAnimationState>({
    isVisible: false,
    hasTriggered: false
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => {
                setState(prev => ({
                  isVisible: true,
                  hasTriggered: true
                }));
              }, delay);
            } else {
              setState(prev => ({
                isVisible: true,
                hasTriggered: true
              }));
            }
          } else if (!triggerOnce) {
            setState(prev => ({
              ...prev,
              isVisible: false
            }));
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return {
    ref: elementRef,
    isVisible: state.isVisible,
    hasTriggered: state.hasTriggered
  };
}

export function useStaggeredScrollAnimation(
  itemCount: number,
  options: UseScrollAnimationOptions & { staggerDelay?: number } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px 0px -50px 0px',
    triggerOnce = true,
    staggerDelay = 100
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger staggered animations
            for (let i = 0; i < itemCount; i++) {
              setTimeout(() => {
                setVisibleItems(prev => new Set([...prev, i]));
              }, i * staggerDelay);
            }
          } else if (!triggerOnce) {
            setVisibleItems(new Set());
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [itemCount, threshold, rootMargin, triggerOnce, staggerDelay]);

  const getItemAnimationProps = (index: number) => ({
    isVisible: visibleItems.has(index),
    style: {
      transitionDelay: `${index * staggerDelay}ms`
    }
  });

  return {
    containerRef,
    getItemAnimationProps,
    isAnyVisible: visibleItems.size > 0
  };
}