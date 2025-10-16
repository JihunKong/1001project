'use client';

import { forwardRef, ImgHTMLAttributes, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';

interface AnimatedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'ref' | 'src'> {
  src?: string;
  animationType?: 'slideUp' | 'fadeIn' | 'scaleIn' | 'slideInLeft' | 'slideInRight';
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
  fallbackComponent?: React.ReactNode;
}

const AnimatedImage = forwardRef<HTMLDivElement, AnimatedImageProps>(
  ({
    src,
    alt = '',
    className = '',
    animationType = 'slideUp',
    delay = 0,
    duration = 600,
    threshold = 0.1,
    triggerOnce = true,
    fallbackComponent,
    ...imgProps
  }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const { ref: animationRef, isVisible } = useScrollAnimation({
      threshold,
      delay,
      triggerOnce
    });

    // Synchronize refs
    useEffect(() => {
      const element = forwardedRef
        ? (typeof forwardedRef === 'function' ? null : forwardedRef.current)
        : internalRef.current;

      if (element && animationRef.current !== element) {
        (animationRef as React.MutableRefObject<HTMLElement | null>).current = element;
      }
    });

    const getAnimationClasses = () => {
      const baseClasses = `transition-all duration-${duration} ease-out`;

      if (!isVisible) {
        switch (animationType) {
          case 'slideUp':
            return `${baseClasses} opacity-70 translate-y-4`;
          case 'fadeIn':
            return `${baseClasses} opacity-70`;
          case 'scaleIn':
            return `${baseClasses} opacity-70 scale-98`;
          case 'slideInLeft':
            return `${baseClasses} opacity-70 -translate-x-4`;
          case 'slideInRight':
            return `${baseClasses} opacity-70 translate-x-4`;
          default:
            return `${baseClasses} opacity-70 translate-y-4`;
        }
      }

      return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
    };

    return (
      <div
        ref={forwardedRef || internalRef}
        className={`${getAnimationClasses()} ${className}`}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          fallbackComponent
        )}
      </div>
    );
  }
);

AnimatedImage.displayName = 'AnimatedImage';

export default AnimatedImage;