'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2 } from 'lucide-react';

interface EnhancedPDFThumbnailWrapperProps {
  bookId: string;
  title: string;
  className?: string;
  alt?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
}

export default function EnhancedPDFThumbnailWrapper({
  bookId,
  title,
  className = "",
  alt,
  children,
  width = 300,
  height = 400
}: EnhancedPDFThumbnailWrapperProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const fallbackUrls = [
    `/books/${bookId}/cover.png`,
    `/books/${bookId}/front.png`,
    `/books/${bookId}/cover.jpg`,
    `/api/covers/${bookId}`
  ];

  useEffect(() => {
    // Reset state for new bookId
    setFailedUrls(new Set());
    setThumbnailUrl(fallbackUrls[0]);
  }, [bookId]);

  const handleImageError = () => {
    const currentIndex = fallbackUrls.indexOf(thumbnailUrl);
    const nextIndex = currentIndex + 1;
    
    // Mark current URL as failed
    setFailedUrls(prev => new Set(prev).add(thumbnailUrl));
    
    // Try next URL if available
    if (nextIndex < fallbackUrls.length) {
      setThumbnailUrl(fallbackUrls[nextIndex]);
    } else {
      // All URLs failed, show fallback
      setThumbnailUrl('');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width, height }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (thumbnailUrl) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src={thumbnailUrl}
          alt={alt || title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover rounded"
          priority={false}
          onError={handleImageError}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${className}`} style={{ width, height }}>
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-2" />
        <p className="text-xs text-gray-700 font-medium px-2">{title}</p>
      </div>
      {children}
    </div>
  );
}