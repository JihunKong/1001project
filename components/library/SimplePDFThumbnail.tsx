'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    // Use existing image if available and not a PDF
    if (existingImage && !existingImage.endsWith('.pdf')) {
      setThumbnailUrl(existingImage);
      return;
    }

    // Check for PNG cover first
    const pngCoverUrl = `/books/${bookId}/cover.png`;
    const checkPngCover = async () => {
      try {
        const response = await fetch(pngCoverUrl, { method: 'HEAD' });
        if (response.ok) {
          setThumbnailUrl(pngCoverUrl);
        } else if (pdfUrl) {
          // If PNG doesn't exist and we have PDF, show PDF
          setShowPdf(true);
        }
      } catch (error) {
        if (pdfUrl) {
          setShowPdf(true);
        }
      }
    };

    checkPngCover();
  }, [bookId, existingImage, pdfUrl]);

  const onDocumentLoadSuccess = () => {
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    setShowPdf(false);
  };

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

  // Show PDF thumbnail using react-pdf
  if (showPdf && pdfUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center bg-gray-100 w-full h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          }
        >
          <Page
            pageNumber={1}
            width={200}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="rounded-lg"
          />
        </Document>
      </div>
    );
  }

  // Show PNG thumbnail if available
  if (thumbnailUrl) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <Image
          src={thumbnailUrl}
          alt={alt || title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover rounded-lg"
          priority={false}
          onError={() => {
            setThumbnailUrl('');
            if (pdfUrl) {
              setShowPdf(true);
            }
          }}
        />
      </div>
    );
  }

  // Fallback placeholder
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <BookOpen className="w-16 h-16 text-blue-600 opacity-50" />
      </div>
    </div>
  );
}