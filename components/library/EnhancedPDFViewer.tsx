'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
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

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

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
  price?: number;
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

  // Calculate effective max pages (authentication + demo limitations)
  const effectiveMaxPages = isDemo 
    ? Math.min(maxPages, totalPages) 
    : (!isAuthenticated ? Math.min(10, totalPages) : totalPages);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Loading PDF from:', pdfUrl);
        const loadingTask = getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;
        
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
        
        // Render first page(s)
        if (viewMode === 'spread') {
          await renderSpread(pdfDoc, 1);
        } else {
          await renderSinglePage(pdfDoc, 1);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        
        // Enhanced error handling with specific messages
        let errorMessage = 'PDF loading failed';
        if (err instanceof Error) {
          const message = err.message.toLowerCase();
          if (message.includes('invalid root reference')) {
            errorMessage = 'PDF file appears to be corrupted or missing. Please try refreshing the page or contact support if the issue persists.';
          } else if (message.includes('network error') || message.includes('fetch')) {
            errorMessage = 'Unable to load PDF due to network issues. Please check your connection and try again.';
          } else if (message.includes('unexpected server response') && message.includes('404')) {
            errorMessage = 'PDF file not found on server. The book may not be available yet.';
          } else if (message.includes('unexpected server response') && message.includes('401')) {
            errorMessage = 'Authentication required. Please sign in to access this content.';
          } else if (message.includes('unexpected server response') && message.includes('403')) {
            errorMessage = 'Access denied. This book may require a subscription or purchase.';
          } else {
            errorMessage = `PDF loading failed: ${err.message}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl, viewMode]);

  // Render single page
  const renderSinglePage = async (pdfDoc: PDFDocumentProxy, pageNum: number) => {
    if (!singleCanvasRef.current || pageRendering) return;
    
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

      await page.render(renderContext).promise;
      console.log('Single page rendered:', pageNum);
    } catch (err) {
      console.error('Error rendering single page:', err);
      setError(`Page rendering failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

    await page.render(renderContext).promise;
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
          {isSample && isPremium && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
              <Eye className="w-3 h-3" />
              Sample Preview
            </div>
          )}
          
          {/* Premium Book Indicator */}
          {isPremium && !isSample && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
          
          {/* Legacy Demo/Preview indicators */}
          {(isDemo || (!isAuthenticated && !isSample)) && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
              {isDemo ? `Demo Mode (Max ${maxPages} pages)` : `Preview (Max 10 pages)`}
            </span>
          )}
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

      {/* Warning Banner */}
      {(isSample && isPremium) && (
        <div className="bg-purple-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Lock className="w-4 h-4" />
              <span>📖 Sample Preview: This is a preview of the book</span>
              <span>|</span>
              <span>Purchase the full book to read the complete content!</span>
            </div>
            {bookId && onPurchase && (
              <button
                onClick={() => onPurchase(bookId)}
                className="bg-white text-purple-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Buy Now $${Number(price || 0).toFixed(2)}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Legacy Warning Banner */}
      {(isDemo || (!isAuthenticated && !isSample)) && (
        <div className="bg-yellow-400 text-black px-4 py-3">
          <div className="flex items-center justify-center gap-3 text-sm font-medium">
            <span>
              {isDemo 
                ? `🎭 Demo Mode: Preview up to ${maxPages} pages only`
                : '📖 Preview Mode: Only first 10 pages available'
              }
            </span>
            <span>|</span>
            <span>Sign up and purchase to read the full content!</span>
          </div>
        </div>
      )}
    </div>
  );
}