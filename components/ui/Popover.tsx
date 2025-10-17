'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  className?: string;
}

export default function Popover({
  isOpen,
  onClose,
  anchorElement,
  children,
  placement = 'bottom',
  offset = 8,
  className = ''
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !anchorElement || !popoverRef.current) return;

    const updatePosition = () => {
      if (!anchorElement || !popoverRef.current) return;

      const anchorRect = anchorElement.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = anchorRect.top - popoverRect.height - offset;
          left = anchorRect.left + (anchorRect.width - popoverRect.width) / 2;
          break;
        case 'bottom':
          top = anchorRect.bottom + offset;
          left = anchorRect.left + (anchorRect.width - popoverRect.width) / 2;
          break;
        case 'left':
          top = anchorRect.top + (anchorRect.height - popoverRect.height) / 2;
          left = anchorRect.left - popoverRect.width - offset;
          break;
        case 'right':
          top = anchorRect.top + (anchorRect.height - popoverRect.height) / 2;
          left = anchorRect.right + offset;
          break;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 8) left = 8;
      if (left + popoverRect.width > viewportWidth - 8) {
        left = viewportWidth - popoverRect.width - 8;
      }
      if (top < 8) top = 8;
      if (top + popoverRect.height > viewportHeight - 8) {
        top = viewportHeight - popoverRect.height - 8;
      }

      setPosition({ top, left });
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, anchorElement, placement, offset]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorElement &&
        !anchorElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorElement]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`fixed z-50 bg-white rounded-lg shadow-lg border border-[#E5E5EA] ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '400px',
        minWidth: '280px'
      }}
    >
      {children}
    </div>,
    document.body
  );
}
