'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2, Lock, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookThumbnails {
  frontCover?: string;
  backCover?: string;
  mainPage?: string;
  pages?: string[];
}

interface EnhancedPDFThumbnailProps {
  bookId: string;
  title: string;
  thumbnails?: BookThumbnails;
  isPremium?: boolean;
  hasAccess?: boolean;
  previewPages?: number;
  className?: string;
  alt?: string;
  showAccessBadge?: boolean;
  lazy?: boolean;
  onClick?: () => void;
  onPreviewClick?: () => void;
  onPurchaseClick?: () => void;
}

export default function EnhancedPDFThumbnail({
  bookId,
  title,
  thumbnails,
  isPremium = false,
  hasAccess = false,
  previewPages = 10,
  className = "",
  alt,
  showAccessBadge = true,
  lazy = true,
  onClick,
  onPreviewClick,
  onPurchaseClick
}: EnhancedPDFThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      // Priority order: frontCover > mainPage > fallback generation
      let targetUrl = '';

      if (thumbnails?.frontCover) {
        targetUrl = thumbnails.frontCover;
      } else if (thumbnails?.mainPage) {
        targetUrl = thumbnails.mainPage;
      } else {
        // Try to find generated thumbnail
        const possibleUrls = [
          `/thumbnails/${bookId}/cover_front-page-1.png`,
          `/thumbnails/${bookId}/book_content-page-1.png`,
          `/books/${bookId}/cover.png`,
        ];

        for (const url of possibleUrls) {
          try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
            if (response.ok) {
              targetUrl = url;
              break;
            }
          } catch {
            // Continue trying other URLs
          }
        }
      }

      if (targetUrl) {
        setThumbnailUrl(targetUrl);
      } else {
        // Last resort: generate thumbnail on demand
        await generateThumbnail();
      }
    };

    loadThumbnail();
  }, [bookId, thumbnails]);

  const generateThumbnail = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/thumbnails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          type: 'cover_front',
          pageNumber: 1,
          force: false // Don't force if exists
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setThumbnailUrl(result.thumbnailPath);
      } else {
        // Try generating from main PDF
        const fallbackResponse = await fetch('/api/thumbnails/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId,
            type: 'book_content',
            pageNumber: 1,
            force: false
          })
        });

        const fallbackResult = await fallbackResponse.json();
        if (fallbackResult.success) {
          setThumbnailUrl(fallbackResult.thumbnailPath);
        } else {
          setError('Failed to generate thumbnail');
        }
      }
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      setError('Failed to load thumbnail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    if (!isLoading && !error) {
      generateThumbnail();
    }
  };

  const handleThumbnailClick = () => {
    if (onClick) {
      onClick();
    } else if (hasAccess) {
      // Open full reader
      window.open(`/library/books/${bookId}`, '_blank');
    } else if (onPreviewClick) {
      onPreviewClick();
    } else {
      // Open preview
      window.open(`/library/books/${bookId}?preview=true`, '_blank');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn(
        "relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden",
        className
      )}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-600">Loading thumbnail...</p>
          </div>
        </div>
        {showAccessBadge && isPremium && (
          <div className="absolute top-2 right-2">
            <Lock className="w-4 h-4 text-amber-600 bg-white rounded-full p-1" />
          </div>
        )}
      </div>
    );
  }

  // Render thumbnail if available
  if (thumbnailUrl && !imageError) {
    return (
      <div 
        className={cn(
          "relative w-full h-full rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 group",
          className
        )}
        onClick={handleThumbnailClick}
      >
        <Image
          src={thumbnailUrl}
          alt={alt || title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          priority={!lazy}
          onError={handleImageError}
        />
        
        {/* Overlay for hover effects */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
        
        {/* Access badges */}
        {showAccessBadge && (
          <div className="absolute top-2 right-2 space-y-1">
            {isPremium && !hasAccess && (
              <div className="bg-amber-100 text-amber-800 rounded-full p-1">
                <Lock className="w-3 h-3" />
              </div>
            )}
            {isPremium && hasAccess && (
              <div className="bg-green-100 text-green-800 rounded-full p-1">
                <Download className="w-3 h-3" />
              </div>
            )}
            {!isPremium && (
              <div className="bg-blue-100 text-blue-800 rounded-full p-1">
                <BookOpen className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* Action buttons on hover */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-1">
            {hasAccess ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/library/books/${bookId}`, '_blank');
                }}
                className="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Read Now
              </button>
            ) : (
              <>
                {previewPages > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPreviewClick) {
                        onPreviewClick();
                      } else {
                        window.open(`/library/books/${bookId}?preview=true`, '_blank');
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                )}
                {isPremium && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPurchaseClick) {
                        onPurchaseClick();
                      } else {
                        window.open(`/shop/${bookId}`, '_blank');
                      }
                    }}
                    className="flex-1 bg-amber-600 text-white text-xs py-1 px-2 rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Buy
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preview indicator */}
        {!hasAccess && previewPages > 0 && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {previewPages} pages free
          </div>
        )}
      </div>
    );
  }

  // Fallback placeholder
  return (
    <div 
      className={cn(
        "relative w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden cursor-pointer hover:from-blue-200 hover:to-purple-200 transition-colors group",
        className
      )}
      onClick={handleThumbnailClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <BookOpen className="w-16 h-16 text-blue-600 opacity-50 group-hover:opacity-70 transition-opacity" />
      </div>
      
      {error && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <p className="text-xs text-red-600 bg-white bg-opacity-80 rounded px-2 py-1">
            {error}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              generateThumbnail();
            }}
            className="text-xs text-blue-600 underline mt-1"
          >
            Retry
          </button>
        </div>
      )}

      {showAccessBadge && (
        <div className="absolute top-2 right-2 space-y-1">
          {isPremium && !hasAccess && (
            <div className="bg-amber-100 text-amber-800 rounded-full p-1">
              <Lock className="w-3 h-3" />
            </div>
          )}
          {isPremium && hasAccess && (
            <div className="bg-green-100 text-green-800 rounded-full p-1">
              <Download className="w-3 h-3" />
            </div>
          )}
          {!isPremium && (
            <div className="bg-blue-100 text-blue-800 rounded-full p-1">
              <BookOpen className="w-3 h-3" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}