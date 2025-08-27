'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2 } from 'lucide-react';
// Use dynamic import to avoid SSR issues
const loadPDFJS = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Set worker path
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    return pdfjs;
  } catch (error) {
    console.warn('Failed to load PDF.js:', error);
    return null;
  }
};

interface SimplePDFThumbnailProps {
  bookId: string;
  title: string;
  pdfUrl?: string;
  existingImage?: string;
  className?: string;
  alt?: string;
}

export default function SimplePDFThumbnail({
  bookId,
  title,
  pdfUrl,
  existingImage,
  className = "",
  alt
}: SimplePDFThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(''); // Force regeneration v3
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateThumbnail = async () => {
      // Use existing image if available and not a PDF
      if (existingImage && !existingImage.endsWith('.pdf')) {
        setThumbnailUrl(existingImage);
        return;
      }

      // Check for PNG cover first
      const pngCoverUrl = `/books/${bookId}/cover.png?v=3`;
      try {
        const response = await fetch(pngCoverUrl, { method: 'HEAD', cache: 'no-cache' });
        if (response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Using PNG cover for ${bookId}:`, pngCoverUrl);
          }
          setThumbnailUrl(pngCoverUrl);
          return;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`PNG not found for ${bookId}, status:`, response.status);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`PNG fetch error for ${bookId}:`, error);
        }
      }

      // Skip if no PDF URL
      if (!pdfUrl) {
        setError('No PDF source available');
        return;
      }

      // Force regeneration by clearing existing thumbnail
      if (isLoading) return;

      setIsLoading(true);
      setError('');

      try {
        // Load PDF.js dynamically
        const pdfjs = await loadPDFJS();
        if (!pdfjs) {
          setError('PDF.js not available');
          return;
        }
        
        // Load PDF
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        // Get first page
        const page = await pdf.getPage(1);
        
        // Calculate scale to fit thumbnail frame (assuming 3:4 aspect ratio card)
        const originalViewport = page.getViewport({ scale: 1.0 });
        const targetWidth = 300; // Target thumbnail width
        const targetHeight = 400; // Target thumbnail height (3:4 ratio)
        
        // Calculate scale to fill the frame while maintaining aspect ratio
        const scaleX = targetWidth / originalViewport.width;
        const scaleY = targetHeight / originalViewport.height;
        const scale = Math.min(Math.max(scaleX, scaleY), 2.0); // Use max to fill the frame, cap at 2x
        
        const viewport = page.getViewport({ scale });
        
        // Create canvas with calculated size
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }

        // Set canvas size to fit the frame
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render page
        const renderContext = {
          canvasContext: context,
          canvas: canvas,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnailUrl(dataUrl);
        
        console.log('Simple thumbnail generated for', bookId);
        
      } catch (err) {
        console.error('Error generating simple thumbnail:', err);
        setError('Failed to generate thumbnail');
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnail();
  }, [bookId, pdfUrl, existingImage]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show thumbnail if available
  if (thumbnailUrl) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={thumbnailUrl}
          alt={alt || title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          priority={false}
        />
      </div>
    );
  }

  // Fallback placeholder with consistent BookOpen icon
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <BookOpen className="w-16 h-16 text-blue-600 opacity-50" />
      </div>
    </div>
  );
}