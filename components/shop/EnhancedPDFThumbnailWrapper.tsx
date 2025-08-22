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

  useEffect(() => {
    const loadThumbnail = async () => {
      setIsLoading(true);
      
      // Try PNG cover first
      const pngCoverUrl = `/books/${bookId}/cover.png`;
      try {
        const response = await fetch(pngCoverUrl, { method: 'HEAD' });
        if (response.ok) {
          setThumbnailUrl(pngCoverUrl);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Fallback to placeholder
      }
      
      setIsLoading(false);
    };

    loadThumbnail();
  }, [bookId]);

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
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${className}`} style={{ width, height }}>
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-2" />
        <p className="text-xs text-gray-500 px-2">{title}</p>
      </div>
      {children}
    </div>
  );
}