'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Book,
  FileText,
  ShoppingCart,
  Eye,
  Crown,
  Lock
} from 'lucide-react';

// Simple PDF.js worker configuration
let workerConfigured = false;

type ViewMode = 'single' | 'spread';

interface PDFViewerProps {
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

export default function EnhancedPDFViewer({ 
  pdfUrl, 
  title, 
  onClose, 
  isDemo = false,
  maxPages = 10,
  pageLayout = 'single',
  isAuthenticated = false,
  isSample = false,
  isPremium = false,
  bookId,
  price = 0,
  onPurchase,
  canAccessFull = false
}: PDFViewerProps) {
  const router = useRouter();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pageRendering, setPageRendering] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(pageLayout === 'double' ? 'spread' : 'single');
  
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const renderTaskRef = useRef<any>(null);

  // No page restrictions - show full PDF
  const effectiveMaxPages = totalPages;

  // Component lifecycle and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing loading
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null;
      }
    };
  }, []);

  // Simple PDF loading without complex deduplication
  const loadPDF = useCallback(async (url: string) => {
    if (!isMountedRef.current) return;
    
    // Cancel any previous loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError('');
    setPdf(null);
    
    try {
      console.log('Loading PDF from:', url);
      
      if (typeof window === 'undefined') {
        throw new Error('PDF viewer must be rendered on client side');
      }

      // Import pdfjs-dist 
      const pdfLib = await import('pdfjs-dist/build/pdf.mjs');
      
      // Configure worker once
      if (!workerConfigured) {
        pdfLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        workerConfigured = true;
        console.log('PDF.js worker configured');
      }
        
      // First, check if the URL returns a valid PDF response
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/pdf,*/*'
        },
        credentials: 'include',
      });

      // Handle HTTP errors before attempting PDF parsing
      if (!response.ok) {
        let errorMessage = 'Failed to load PDF';
        
        if (response.status === 401) {
          errorMessage = 'Sign in required to access this content';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You may need to purchase this content.';
        } else if (response.status === 404) {
          errorMessage = 'PDF file not found';
        } else {
          errorMessage = `PDF loading failed (HTTP ${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/pdf')) {
        throw new Error('The requested content is not a valid PDF file');
      }

      // Load PDF document
      const loadingTask = pdfLib.getDocument({
        url,
        httpHeaders: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/pdf,*/*'
        },
        withCredentials: true,
      });
        
      const pdfDoc = await loadingTask.promise;
        
      if (!isMountedRef.current) {
        console.log('Component unmounted during PDF loading');
        return;
      }
        
      if (!pdfDoc || typeof pdfDoc.numPages !== 'number' || pdfDoc.numPages <= 0) {
        throw new Error('Invalid PDF document');
      }
        
      setPdf(pdfDoc);
      setTotalPages(pdfDoc.numPages);
      console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
        
      // Render first page(s)
      if (isMountedRef.current) {
        if (viewMode === 'spread') {
          await renderSpread(pdfDoc, 1);
        } else {
          await renderSinglePage(pdfDoc, 1);
        }
      }
        
    } catch (err) {
      if (!isMountedRef.current) return;
        
      console.error('Error loading PDF:', err);
      
      let errorMessage = 'Failed to load PDF';
      if (err instanceof Error) {
        // Use the error message as-is since we now handle HTTP errors above
        errorMessage = err.message;
      }
        
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [viewMode]);

  // Load PDF when URL changes
  useEffect(() => {
    if (pdfUrl && isMountedRef.current) {
      loadPDF(pdfUrl);
    }
  }, [pdfUrl, loadPDF]);

  // Render single page
  const renderSinglePage = async (pdfDoc: PDFDocumentProxy, pageNum: number) => {
    if (!singleCanvasRef.current) return;
    
    // Cancel any existing render task
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTaskRef.current = null;
    }
    
    setPageRendering(true);
    
    try {
      const page: PDFPageProxy = await pdfDoc.getPage(pageNum);
      const canvas = singleCanvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }

      const viewport = page.getViewport({ scale, rotation });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        canvas: canvas,
        viewport: viewport,
      };

      // Store render task reference
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
      console.log('Single page rendered:', pageNum);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering single page:', err);
        setError(`Page rendering failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setPageRendering(false);
    }
  };

  // Render page spread (two pages side by side)
  const renderSpread = async (pdfDoc: PDFDocumentProxy, startPage: number) => {
    if ((!leftCanvasRef.current || !rightCanvasRef.current) || pageRendering) return;
    
    setPageRendering(true);
    
    try {
      // For spread view, we show even pages on left, odd on right
      // But for single-page PDFs that should be displayed as spreads,
      // we show consecutive pages side by side
      const leftPageNum = startPage;
      const rightPageNum = startPage + 1;

      // Render left page
      if (leftPageNum <= effectiveMaxPages && leftCanvasRef.current) {
        await renderPageOnCanvas(pdfDoc, leftPageNum, leftCanvasRef.current);
      } else if (leftCanvasRef.current) {
        // Clear canvas if no page to show
        const ctx = leftCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, leftCanvasRef.current.width, leftCanvasRef.current.height);
        }
      }

      // Render right page
      if (rightPageNum <= effectiveMaxPages && rightCanvasRef.current) {
        await renderPageOnCanvas(pdfDoc, rightPageNum, rightCanvasRef.current);
      } else if (rightCanvasRef.current) {
        // Clear canvas if no page to show
        const ctx = rightCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, rightCanvasRef.current.width, rightCanvasRef.current.height);
        }
      }

      console.log('Spread rendered:', leftPageNum, rightPageNum);
    } catch (err) {
      console.error('Error rendering spread:', err);
      setError(`Spread rendering failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPageRendering(false);
    }
  };

  // Helper function to render a page on a specific canvas
  const renderPageOnCanvas = async (pdfDoc: PDFDocumentProxy, pageNum: number, canvas: HTMLCanvasElement) => {
    const page: PDFPageProxy = await pdfDoc.getPage(pageNum);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas context not available');
    }

    const viewport = page.getViewport({ scale, rotation });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      canvas: canvas,
      viewport: viewport,
    };

    try {
      const renderTask = page.render(renderContext);
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        throw err;
      }
    }
  };

  // Re-render when page, scale, rotation, or view mode changes
  useEffect(() => {
    if (pdf) {
      if (viewMode === 'spread') {
        renderSpread(pdf, currentPage);
      } else {
        renderSinglePage(pdf, currentPage);
      }
    }
  }, [pdf, currentPage, scale, rotation, viewMode, effectiveMaxPages]);

  // Navigation functions
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= effectiveMaxPages) {
      setCurrentPage(pageNum);
    }
  };

  const goToPrevious = () => {
    if (viewMode === 'spread') {
      // In spread mode, go back by 2 pages
      const newPage = Math.max(1, currentPage - 2);
      setCurrentPage(newPage);
    } else {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (viewMode === 'spread') {
      // In spread mode, go forward by 2 pages
      const newPage = Math.min(effectiveMaxPages - 1, currentPage + 2);
      setCurrentPage(newPage);
    } else {
      goToPage(currentPage + 1);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'spread' : 'single');
  };

  // Calculate page display info
  const getPageDisplayInfo = () => {
    if (viewMode === 'spread') {
      const leftPage = currentPage;
      const rightPage = currentPage + 1;
      const showingRightPage = rightPage <= effectiveMaxPages;
      
      return {
        display: showingRightPage ? `${leftPage}-${rightPage}` : `${leftPage}`,
        total: effectiveMaxPages,
        canGoPrev: currentPage > 1,
        canGoNext: showingRightPage ? (rightPage < effectiveMaxPages) : false
      };
    } else {
      return {
        display: `${currentPage}`,
        total: effectiveMaxPages,
        canGoPrev: currentPage > 1,
        canGoNext: currentPage < effectiveMaxPages
      };
    }
  };

  const pageInfo = getPageDisplayInfo();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading PDF...</h3>
            <p className="text-gray-600">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isCorruptedError = error.includes('corrupted or missing');
    const isNetworkError = error.includes('network issues');
    const isNotFoundError = error.includes('not found');
    const isAuthError = error.includes('Authentication required') || error.includes('Access denied');

    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isAuthError ? 'Access Required' : 
               isNotFoundError ? 'Book Not Available' :
               isNetworkError ? 'Connection Issue' :
               'PDF Loading Error'}
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            
            {/* Helpful suggestions based on error type */}
            {isCorruptedError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                <p className="font-medium mb-1">What you can try:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Refresh the page and try again</li>
                  <li>Check if other books load properly</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
            )}
            
            {isNetworkError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Connection troubleshooting:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Wait a moment and try again</li>
                </ul>
              </div>
            )}
            
            {isAuthError && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-sm text-purple-800">
                <p className="font-medium mb-1">To access this book:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Sign in to your account</li>
                  <li>Purchase the book or subscribe</li>
                  <li>Check if you have the required permissions</li>
                </ul>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isAuthError ? 'Go Back' : 'Close'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isNetworkError ? 'Try Again' : 'Retry'}
              </button>
              {isAuthError && (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 truncate">{title}</h2>
          
          {/* Sample Mode Indicator */}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <button
            onClick={toggleViewMode}
            className="p-2 rounded hover:bg-gray-100 text-gray-700"
            title={`Switch to ${viewMode === 'single' ? 'spread' : 'single'} view`}
          >
            {viewMode === 'single' ? <Book className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Page Navigation */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={goToPrevious}
              disabled={!pageInfo.canGoPrev}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="font-medium min-w-[4rem] text-center">
              {pageInfo.display} / {pageInfo.total}
            </span>
            
            <button
              onClick={goToNext}
              disabled={!pageInfo.canGoNext}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-medium min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={rotate}
            className="p-2 rounded hover:bg-gray-100 text-gray-700"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Purchase Button (for sample mode) */}
          {isSample && isPremium && bookId && onPurchase && (
            <button
              onClick={() => onPurchase(bookId)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title={`Buy full book for $${Number(price || 0).toFixed(2)}`}
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Full Book $${Number(price || 0).toFixed(2)}
            </button>
          )}

          {/* Download (only if authenticated and not demo and not sample) */}
          {!isDemo && isAuthenticated && !isSample && (
            <a
              href={pdfUrl}
              download={`${title}.pdf`}
              className="p-2 rounded hover:bg-gray-100 text-gray-700"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Close */}
          <button
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('Close button clicked, onClose:', onClose);
              }
              if (onClose) {
                onClose();
              } else {
                // Fallback navigation using Next.js router
                console.warn('PDF Viewer: onClose not provided, using fallback navigation');
                router.push('/library');
              }
            }}
            className="p-2 rounded hover:bg-gray-100 text-gray-700"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4"
      >
        {viewMode === 'single' ? (
          // Single page view
          <div className="relative bg-white shadow-lg">
            <canvas
              ref={singleCanvasRef}
              className={`max-w-full max-h-full ${pageRendering ? 'opacity-50' : ''}`}
            />
            
            {pageRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          // Spread view
          <div className="flex gap-2">
            <div className="relative bg-white shadow-lg">
              <canvas
                ref={leftCanvasRef}
                className={`max-w-full max-h-full ${pageRendering ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative bg-white shadow-lg">
              <canvas
                ref={rightCanvasRef}
                className={`max-w-full max-h-full ${pageRendering ? 'opacity-50' : ''}`}
              />
            </div>
            
            {pageRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      
    </div>
  );
}