'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

// Simple dynamic import with SSR disabled
const EnhancedPDFViewer = dynamic(
  () => import('./EnhancedPDFViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading PDF Viewer...</h3>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }
);

// Props interface (copied from EnhancedPDFViewer)
export interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose?: () => void;
  isDemo?: boolean;
  maxPages?: number;
  pageLayout?: 'single' | 'double';
  isAuthenticated?: boolean;
  isSample?: boolean;
  isPremium?: boolean;
  bookId?: string;
  price?: number | string;
  onPurchase?: (bookId: string) => void;
  canAccessFull?: boolean;
}

export default function SafePDFViewer(props: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simple client-side only rendering
  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading PDF Viewer...</h3>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return <EnhancedPDFViewer {...props} />;
}