'use client';

import { useState } from 'react';
import { Download, Loader2, Lock, AlertCircle } from 'lucide-react';

interface PDFDownloadButtonProps {
  bookId: string;
  bookTitle: string;
  canDownload: boolean;
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
}

export default function PDFDownloadButton({
  bookId,
  bookTitle,
  canDownload,
  variant = 'primary',
  className = '',
}: PDFDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!canDownload || isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/books/${bookId}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${bookTitle}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={!canDownload || isDownloading}
        className={`p-2 rounded-lg transition-colors ${
          canDownload
            ? 'text-blue-600 hover:bg-blue-50'
            : 'text-gray-400 cursor-not-allowed'
        } ${className}`}
        title={canDownload ? 'Download PDF' : 'PDF download not available'}
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : canDownload ? (
          <Download className="w-5 h-5" />
        ) : (
          <Lock className="w-5 h-5" />
        )}
      </button>
    );
  }

  const baseClasses =
    'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed';

  const variantClasses =
    variant === 'primary'
      ? canDownload
        ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300'
        : 'bg-gray-200 text-gray-500'
      : canDownload
      ? 'border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:border-blue-300 disabled:text-blue-300'
      : 'border border-gray-300 text-gray-400';

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={!canDownload || isDownloading}
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Downloading...
          </>
        ) : canDownload ? (
          <>
            <Download className="w-5 h-5" />
            Download PDF
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Download Restricted
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!canDownload && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          Teachers and admins can download PDFs
        </p>
      )}
    </div>
  );
}
