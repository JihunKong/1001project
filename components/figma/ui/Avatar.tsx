'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl'
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-12 h-12'
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  shape = 'circle',
  className,
  onClick
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = fallback ? getInitials(fallback) : null;

  const baseClasses = cn(
    'relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden',
    'bg-gradient-to-br from-purple-100 to-purple-200',
    'font-medium text-figma-black',
    sizeClasses[size],
    shape === 'circle' ? 'rounded-full' : 'rounded-lg',
    onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
    className
  );

  const showImage = src && !imageError;
  const showInitials = !showImage && initials;
  const showIcon = !showImage && !initials;

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={alt}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes={
            size === 'xs'
              ? '24px'
              : size === 'sm'
              ? '32px'
              : size === 'md'
              ? '40px'
              : size === 'lg'
              ? '48px'
              : size === 'xl'
              ? '64px'
              : '96px'
          }
        />
      ) : showInitials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <User className={iconSizeClasses[size]} aria-hidden="true" />
      )}
    </div>
  );
}
