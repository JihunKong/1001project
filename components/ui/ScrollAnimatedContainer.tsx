'use client';

import { forwardRef, HTMLAttributes, ReactNode, useRef, useEffect } from 'react';
import { useScrollAnimation, useStaggeredScrollAnimation } from '@/lib/hooks/useScrollAnimation';

interface ScrollAnimatedContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ref'> {
  children: ReactNode;
  animationType?: 'slideUp' | 'fadeIn' | 'scaleIn' | 'slideInLeft' | 'slideInRight';
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
  staggered?: boolean;
  staggerDelay?: number;
  itemCount?: number;
}

const ScrollAnimatedContainer = forwardRef<HTMLDivElement, ScrollAnimatedContainerProps>(
  ({
    children,
    className = '',
    animationType = 'slideUp',
    delay = 0,
    duration = 600,
    threshold = 0.1,
    triggerOnce = true,
    staggered = false,
    staggerDelay = 100,
    itemCount = 1,
    ...divProps
  }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const { ref: singleRef, isVisible: singleVisible } = useScrollAnimation({
      threshold,
      delay,
      triggerOnce
    });

    const { containerRef, getItemAnimationProps, isAnyVisible } = useStaggeredScrollAnimation(
      itemCount,
      {
        threshold,
        triggerOnce,
        staggerDelay
      }
    );

    // Synchronize refs
    useEffect(() => {
      const element = forwardedRef
        ? (typeof forwardedRef === 'function' ? null : forwardedRef.current)
        : internalRef.current;

      const activeRef = staggered ? containerRef : singleRef;
      if (element && activeRef.current !== element) {
        (activeRef as React.MutableRefObject<HTMLElement | null>).current = element;
      }
    });

    const getAnimationClasses = (isVisible: boolean, index?: number) => {
      const baseDuration = duration === 600 ? 'duration-600' : `duration-[${duration}ms]`;
      const baseClasses = `transition-all ${baseDuration} ease-out`;

      if (!isVisible) {
        switch (animationType) {
          case 'slideUp':
            return `${baseClasses} opacity-0 translate-y-4`;
          case 'fadeIn':
            return `${baseClasses} opacity-0`;
          case 'scaleIn':
            return `${baseClasses} opacity-0 scale-95`;
          case 'slideInLeft':
            return `${baseClasses} opacity-0 -translate-x-4`;
          case 'slideInRight':
            return `${baseClasses} opacity-0 translate-x-4`;
          default:
            return `${baseClasses} opacity-0 translate-y-4`;
        }
      }

      return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
    };

    if (staggered) {
      return (
        <div
          ref={forwardedRef || internalRef}
          className={className}
          {...divProps}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={forwardedRef || internalRef}
        className={`${getAnimationClasses(singleVisible)} ${className}`}
        {...divProps}
      >
        {children}
      </div>
    );
  }
);

ScrollAnimatedContainer.displayName = 'ScrollAnimatedContainer';

export default ScrollAnimatedContainer;