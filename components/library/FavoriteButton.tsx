'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
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
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
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
        transition-all duration-200 shadow-md
        ${buttonSizeClasses[size]}
        ${isFavorited
          ? 'text-yellow-500 hover:text-yellow-600 bg-white hover:bg-yellow-50 border-2 border-yellow-400'
          : 'text-gray-500 hover:text-yellow-500 bg-white hover:bg-gray-50 border border-gray-200'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorited ? t('library.favorite.remove') : t('library.favorite.add')}
      aria-label={isFavorited ? t('library.favorite.remove') : t('library.favorite.add')}
    >
      <Star
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
