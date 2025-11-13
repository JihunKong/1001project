'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface AchievementTooltipProps {
  children: ReactNode;
  content: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}

export function AchievementTooltip({
  children,
  content,
  isOpen,
  onClose
}: AchievementTooltipProps) {
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const spaceTop = trigger.top;
    const spaceBottom = viewport.height - trigger.bottom;
    const spaceLeft = trigger.left;
    const spaceRight = viewport.width - trigger.right;

    if (spaceTop >= tooltip.height + 10) {
      setPosition('top');
    } else if (spaceBottom >= tooltip.height + 10) {
      setPosition('bottom');
    } else if (spaceRight >= tooltip.width + 10) {
      setPosition('right');
    } else if (spaceLeft >= tooltip.width + 10) {
      setPosition('left');
    } else {
      setPosition('top');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div ref={triggerRef} className="relative inline-block">
      {children}

      {isOpen && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionStyles()} transition-opacity duration-200`}
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
        >
          <div
            className="rounded-lg shadow-lg border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E5EA',
              minWidth: '240px',
              maxWidth: '320px'
            }}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
