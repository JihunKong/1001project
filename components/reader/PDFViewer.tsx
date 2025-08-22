'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  RotateCw,
  Download,
  BookOpen,
  Eye,
  Lock,
  AlertCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  storyId: string;
  title: string;
  accessLevel: 'preview' | 'full';
  maxPreviewPages?: number;
  onPageChange?: (page: number, total: number) => void;
  onProgress?: (progress: number) => void;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

export default function PDFViewer({
  pdfUrl,
  storyId,
  title,
  accessLevel,
  maxPreviewPages = 3,
  onPageChange,
  onProgress,
  watermark
}: PDFViewerProps) {
  const { data: session } = useSession();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [documentLoaded, setDocumentLoaded] = useState<boolean>(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Calculate maximum accessible pages based on access level
  const maxAccessiblePages = accessLevel === 'full' ? numPages : Math.min(maxPreviewPages, numPages);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setDocumentLoaded(true);
    setError(null);
    
    // Track initial progress
    if (onProgress) {
      onProgress(accessLevel === 'full' ? 0 : (maxPreviewPages / numPages) * 100);
    }
  }, [accessLevel, maxPreviewPages, onProgress]);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document. Please try again.');
    setLoading(false);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= maxAccessiblePages) {
      setPageNumber(newPage);
      
      if (onPageChange) {
        onPageChange(newPage, numPages);
      }
      
      if (onProgress && accessLevel === 'full') {
        const progress = (newPage / numPages) * 100;
        onProgress(progress);
        
        // Track reading progress via API
        if (session?.user?.id) {
          updateReadingProgress(newPage, progress);
        }
      }
    }
  }, [maxAccessiblePages, numPages, onPageChange, onProgress, accessLevel, session?.user?.id]);

  // Update reading progress on backend
  const updateReadingProgress = useCallback(async (currentPage: number, progress: number) => {
    try {
      await fetch(`/api/library/stories/${storyId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPage,
          percentComplete: progress,
          totalPages: numPages
        })
      });
    } catch (error) {
      console.error('Failed to update reading progress:', error);
    }
  }, [storyId, numPages]);

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  // Rotation control
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen && viewerRef.current) {
      viewerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!documentLoaded) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handlePageChange(pageNumber - 1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          handlePageChange(pageNumber + 1);
          break;
        case 'Home':
          e.preventDefault();
          handlePageChange(1);
          break;
        case 'End':
          e.preventDefault();
          handlePageChange(maxAccessiblePages);
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [documentLoaded, pageNumber, maxAccessiblePages, isFullscreen, handlePageChange]);

  // Prevent right-click on PDF for basic content protection
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Watermark component
  const WatermarkOverlay = () => {
    if (!watermark || !session?.user) return null;
    
    const getPositionClasses = () => {
      switch (watermark.position) {
        case 'top-left':
          return 'top-4 left-4';
        case 'top-right':
          return 'top-4 right-4';
        case 'bottom-left':
          return 'bottom-4 left-4';
        case 'bottom-right':
          return 'bottom-4 right-4';
        case 'center':
        default:
          return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      }
    };
    
    return (
      <div 
        className={`absolute ${getPositionClasses()} pointer-events-none select-none z-10`}
        style={{ opacity: watermark.opacity || 0.3 }}
      >
        <div className="bg-gray-900 text-white px-2 py-1 text-xs rounded">
          {watermark.text}
        </div>
      </div>
    );
  };

  // Access restriction overlay
  const AccessRestrictionOverlay = () => {
    if (accessLevel === 'full' || pageNumber <= maxAccessiblePages) return null;
    
    return (
      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
        <div className="text-center text-white p-8 max-w-md">
          <Lock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">Premium Content</h3>
          <p className="mb-4">
            This page is part of premium content. Subscribe or purchase to continue reading.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
            <button className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors">
              Purchase
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading PDF</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={viewerRef}
      className={`relative bg-gray-100 rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900 truncate max-w-xs">
            {title}
          </span>
          {accessLevel === 'preview' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              <Eye className="w-3 h-3" />
              Preview
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
              {pageNumber} / {maxAccessiblePages}
              {accessLevel === 'preview' && numPages > maxAccessiblePages && (
                <span className="text-gray-500 ml-1">
                  (of {numPages})
                </span>
              )}
            </span>
            
            <button
              onClick={() => handlePageChange(pageNumber + 1)}
              disabled={pageNumber >= maxAccessiblePages}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l pl-2">
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          {/* Other controls */}
          <div className="flex items-center gap-1 border-l pl-2">
            <button
              onClick={rotate}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative overflow-auto h-96 lg:h-[600px] flex items-center justify-center">
        {loading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading PDF...</span>
          </div>
        )}
        
        <div 
          ref={pageRef}
          className="relative"
          onContextMenu={handleContextMenu}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${pageNumber}-${scale}-${rotation}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
                
                <WatermarkOverlay />
                <AccessRestrictionOverlay />
              </motion.div>
            </AnimatePresence>
          </Document>
        </div>
      </div>

      {/* Progress indicator for preview mode */}
      {accessLevel === 'preview' && numPages > 0 && (
        <div className="p-4 bg-yellow-50 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-800">
              Preview: {maxPreviewPages} of {numPages} pages
            </span>
            <div className="w-32 bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${(pageNumber / maxPreviewPages) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}