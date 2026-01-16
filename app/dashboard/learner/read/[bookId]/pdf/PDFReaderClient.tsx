'use client';

import { useCallback } from 'react';
import PDFReaderPage from '@/components/pdf/PDFReaderPage';

interface PDFReaderClientProps {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  hasFullAccess: boolean;
  canDownload?: boolean;
  initialPage: number;
  userId: string;
}

export default function PDFReaderClient({
  bookId,
  bookTitle,
  bookAuthor,
  coverImage,
  hasFullAccess,
  canDownload = false,
  initialPage,
}: PDFReaderClientProps) {
  const handleProgressUpdate = useCallback(async (currentPage: number, totalPages: number) => {
    try {
      const percentComplete = Math.round((currentPage / totalPages) * 100);

      await fetch('/api/reading-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          currentPage,
          totalPages,
          percentComplete,
        }),
      });
    } catch (error) {
      console.error('Failed to save reading progress:', error);
    }
  }, [bookId]);

  return (
    <PDFReaderPage
      bookId={bookId}
      bookTitle={bookTitle}
      bookAuthor={bookAuthor}
      coverImage={coverImage}
      hasFullAccess={hasFullAccess}
      canDownload={canDownload}
      initialPage={initialPage}
      onProgressUpdate={handleProgressUpdate}
    />
  );
}
