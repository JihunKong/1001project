'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Share2, BookmarkPlus, Eye, Lock, AlertCircle, Loader2, Grid, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookAccess, AccessLevel } from '@/lib/book-access';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFReaderProps {
  bookId: string;
  pdfUrl: string;
  title: string;
  authorName: string;
  accessResult: AccessLevel;
  className?: string;
  onPageChange?: (page: number) => void;
  onAccessUpgrade?: () => void;
}

interface PageThumbnail {
  pageNumber: number;
  thumbnailUrl: string | null;
  isLoading: boolean;
  error?: string;
}

export default function PDFReaderWithThumbnails({
  bookId,
  pdfUrl,
  title,
  authorName,
  accessResult,
  className = "",
  onPageChange,
  onAccessUpgrade
}: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Thumbnail management
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [thumbnailsGenerated, setThumbnailsGenerated] = useState<boolean>(false);

  // UI state
  const [showControls, setShowControls] = useState<boolean>(true);
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailGridRef = useRef<HTMLDivElement>(null);

  // Check if user can access this page
  const canAccessPage = useCallback((page: number): boolean => {
    if (accessResult.level === BookAccess.FREE || 
        accessResult.level === BookAccess.PURCHASED || 
        accessResult.level === BookAccess.SUBSCRIBED) {
      return true;
    }
    
    if (accessResult.level === BookAccess.PREVIEW) {
      return page <= accessResult.previewPages;
    }
    
    return false;
  }, [accessResult]);

  // Generate thumbnails for accessible pages
  const generateThumbnails = useCallback(async () => {
    if (!numPages || thumbnailsGenerated) return;

    setThumbnailsGenerated(true);
    const maxThumbnails = Math.min(numPages, 50); // Limit thumbnail generation

    // Initialize thumbnail state
    const initialThumbnails: PageThumbnail[] = Array.from({ length: maxThumbnails }, (_, i) => ({
      pageNumber: i + 1,
      thumbnailUrl: null,
      isLoading: false
    }));

    setThumbnails(initialThumbnails);

    // Generate thumbnails in batches
    const batchSize = 5;
    for (let i = 0; i < maxThumbnails; i += batchSize) {
      const batch = initialThumbnails.slice(i, i + batchSize);
      
      // Generate thumbnails for this batch
      const batchPromises = batch.map(async (thumbnail) => {
        const { pageNumber } = thumbnail;
        
        // Only generate thumbnails for accessible pages
        if (!canAccessPage(pageNumber)) {
          return {
            ...thumbnail,
            thumbnailUrl: null,
            error: 'Access restricted'
          };
        }

        try {
          setThumbnails(prev => prev.map(t => 
            t.pageNumber === pageNumber 
              ? { ...t, isLoading: true } 
              : t
          ));

          const response = await fetch('/api/thumbnails/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId,
              type: 'book_content',
              pageNumber,
              width: 150,
              height: 200,
              quality: 70,
              force: false
            })
          });

          const result = await response.json();
          
          return {
            ...thumbnail,
            thumbnailUrl: result.success ? result.thumbnailPath : null,
            isLoading: false,
            error: result.success ? undefined : result.error
          };

        } catch (error) {
          return {
            ...thumbnail,
            thumbnailUrl: null,
            isLoading: false,
            error: 'Failed to generate thumbnail'
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Update thumbnails state
      setThumbnails(prev => {
        const updated = [...prev];
        batchResults.forEach(result => {
          const index = updated.findIndex(t => t.pageNumber === result.pageNumber);
          if (index !== -1) {
            updated[index] = result;
          }
        });
        return updated;
      });

      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < maxThumbnails) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [bookId, numPages, canAccessPage, thumbnailsGenerated]);

  // Document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
  }, []);

  // Document load error
  const onDocumentLoadError = useCallback((error: any) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  }, []);

  // Page navigation
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      onPageChange?.(page);
    }
  }, [numPages, onPageChange]);

  const goToPreviousPage = useCallback(() => {
    goToPage(pageNumber - 1);
  }, [pageNumber, goToPage]);

  const goToNextPage = useCallback(() => {
    if (canAccessPage(pageNumber + 1)) {
      goToPage(pageNumber + 1);
    } else if (onAccessUpgrade) {
      onAccessUpgrade();
    }
  }, [pageNumber, goToPage, canAccessPage, onAccessUpgrade]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.2);
  }, []);

  // Rotation
  const rotateClockwise = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          goToPreviousPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case '=':
        case '+':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey) {
            event.preventDefault();
            resetZoom();
          }
          break;
        case 'r':
          if (event.ctrlKey) {
            event.preventDefault();
            rotateClockwise();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPreviousPage, goToNextPage, zoomIn, zoomOut, resetZoom, rotateClockwise]);

  // Generate thumbnails when document loads
  useEffect(() => {
    if (numPages > 0 && !thumbnailsGenerated) {
      generateThumbnails();
    }
  }, [numPages, generateThumbnails, thumbnailsGenerated]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetTimer();
    
    resetTimer();
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const isPageRestricted = !canAccessPage(pageNumber);
  const hasNextPage = pageNumber < numPages;
  const hasPreviousPage = pageNumber > 1;
  const canGoNext = hasNextPage && canAccessPage(pageNumber + 1);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-gray-900 overflow-hidden",
        fullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-20 bg-black bg-opacity-75 text-white p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            <p className="text-sm text-gray-300">by {authorName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            
            {accessResult.level === BookAccess.PREVIEW && (
              <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded">
                Preview ({accessResult.previewPages} pages)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar for Thumbnails */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 z-10 bg-gray-800 border-r border-gray-700 transition-transform duration-300",
        showThumbnails ? "translate-x-0" : "-translate-x-full",
        "w-48"
      )}>
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-white font-medium text-sm">Pages</h3>
        </div>
        
        <div 
          ref={thumbnailGridRef}
          className="p-2 space-y-2 max-h-full overflow-y-auto"
        >
          {thumbnails.map((thumbnail) => {
            const isCurrentPage = thumbnail.pageNumber === pageNumber;
            const isAccessible = canAccessPage(thumbnail.pageNumber);
            
            return (
              <div
                key={thumbnail.pageNumber}
                className={cn(
                  "relative cursor-pointer border-2 rounded transition-colors",
                  isCurrentPage 
                    ? "border-blue-500 bg-blue-500 bg-opacity-20" 
                    : "border-gray-600 hover:border-gray-400",
                  !isAccessible && "opacity-50"
                )}
                onClick={() => {
                  if (isAccessible) {
                    goToPage(thumbnail.pageNumber);
                  } else if (onAccessUpgrade) {
                    onAccessUpgrade();
                  }
                }}
              >
                <div className="aspect-[3/4] bg-gray-700 rounded overflow-hidden">
                  {thumbnail.isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  ) : thumbnail.thumbnailUrl ? (
                    <img
                      src={thumbnail.thumbnailUrl}
                      alt={`Page ${thumbnail.pageNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : isAccessible ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Page {thumbnail.pageNumber}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 text-center">
                  {thumbnail.pageNumber}
                </div>
                
                {!isAccessible && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "w-full h-full flex items-center justify-center transition-all duration-300",
        showThumbnails && "ml-48"
      )}>
        {loading && (
          <div className="text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="text-white text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="relative">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              {isPageRestricted ? (
                <div className="bg-gray-800 text-white p-8 rounded-lg text-center max-w-md">
                  <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Page Restricted</h3>
                  <p className="text-gray-300 mb-4">
                    This page is not available in the preview. 
                    {accessResult.level === BookAccess.PREVIEW && (
                      ` Pages 1-${accessResult.previewPages} are available for free.`
                    )}
                  </p>
                  {onAccessUpgrade && (
                    <button
                      onClick={onAccessUpgrade}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      {accessResult.upgradeOptions?.purchase ? 'Purchase Book' : 'Get Full Access'}
                    </button>
                  )}
                </div>
              ) : (
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  loading={
                    <div className="bg-gray-800 text-white p-8 rounded">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  }
                  error={
                    <div className="bg-red-900 text-white p-4 rounded">
                      Failed to load page
                    </div>
                  }
                />
              )}
            </Document>

            {/* Watermark for preview pages */}
            {accessResult.level === BookAccess.PREVIEW && !isPageRestricted && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                PREVIEW
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-20 bg-black bg-opacity-75 text-white p-4 transition-opacity duration-300",
        showThumbnails && "ml-48",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={cn(
                "p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors",
                showThumbnails && "bg-blue-600"
              )}
              title="Toggle thumbnails"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-sm px-2">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={rotateClockwise}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Center navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousPage}
              disabled={!hasPreviousPage}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (canAccessPage(page)) {
                    goToPage(page);
                  }
                }}
                className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center text-sm"
              />
              <span className="text-sm">of {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={canGoNext ? "Next page" : "Next page (requires upgrade)"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {accessResult.canDownload && (
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: title,
                    text: `Check out "${title}" by ${authorName}`,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Access upgrade prompt */}
      {!canGoNext && hasNextPage && (
        <div className="absolute bottom-20 right-4 bg-amber-600 text-white p-4 rounded-lg max-w-sm">
          <h4 className="font-semibold mb-2">Continue Reading</h4>
          <p className="text-sm mb-3">
            You've reached the end of the preview. Get full access to continue reading.
          </p>
          {onAccessUpgrade && (
            <button
              onClick={onAccessUpgrade}
              className="bg-white text-amber-600 px-4 py-2 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              {accessResult.upgradeOptions?.purchase ? `Buy for $${accessResult.upgradeOptions.purchase.price}` : 'Get Full Access'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}