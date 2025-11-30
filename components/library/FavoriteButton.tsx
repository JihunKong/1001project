'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  bookId: string;
  isFavorited: boolean;
  onToggle?: (isFavorited: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function FavoriteButton({
  bookId,
  isFavorited: initialFavorited,
  onToggle,
  size = 'md',
  showLabel = false,
  className = '',
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/books/favorites/${bookId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      setIsFavorited(data.isFavorited);

      if (data.isFavorited) {
        toast.success(t('library.favorite.added'));
      } else {
        toast.success(t('library.favorite.removed'));
      }

      onToggle?.(data.isFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-1.5 rounded-full
        transition-all duration-200
        ${buttonSizeClasses[size]}
        ${isFavorited
          ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
          : 'text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorited ? t('library.favorite.remove') : t('library.favorite.add')}
      aria-label={isFavorited ? t('library.favorite.remove') : t('library.favorite.add')}
    >
      <Heart
        className={`${sizeClasses[size]} ${isFavorited ? 'fill-current' : ''}`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorited ? t('library.favorite.remove') : t('library.favorite.add')}
        </span>
      )}
    </button>
  );
}
