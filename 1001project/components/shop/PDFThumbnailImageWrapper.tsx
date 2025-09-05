'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2 } from 'lucide-react';

interface PDFThumbnailImageWrapperProps {
  bookId: string;
  title: string;
  pdfUrl?: string;
  fallbackImage?: string;
  className?: string;
  alt?: string;
  children?: React.ReactNode;
}

export default function PDFThumbnailImageWrapper({
  bookId,
  title,
  pdfUrl,
  fallbackImage,
  className = "",
  alt,
  children
}: PDFThumbnailImageWrapperProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      setIsLoading(true);
      
      // Use fallback image if available
      if (fallbackImage) {
        setThumbnailUrl(fallbackImage);
        setIsLoading(false);
        return;
      }
      
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
        // Continue to placeholder
      }
      
      setIsLoading(false);
    };

    loadThumbnail();
  }, [bookId, fallbackImage]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (thumbnailUrl) {
    return (
      <div className={className}>
        <Image
          src={thumbnailUrl}
          alt={alt || title}
          fill
          className="object-cover"
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${className}`}>
      <BookOpen className="w-16 h-16 text-blue-300" />
      {children}
    </div>
  );
}