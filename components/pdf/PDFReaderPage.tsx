'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  ArrowLeft,
  Book,
  FileText,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  Grid,
  X,
  Download,
} from 'lucide-react';
import PDFDownloadButton from './PDFDownloadButton';
import Link from 'next/link';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFReaderPageProps {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  hasFullAccess: boolean;
  canDownload?: boolean;
  initialPage?: number;
  onProgressUpdate?: (page: number, totalPages: number) => void;
}

export default function PDFReaderPage({
  bookId,
  bookTitle,
  bookAuthor,
  coverImage,
  hasFullAccess,
  canDownload = false,
  initialPage = 1,
  onProgressUpdate,
}: PDFReaderPageProps) {
  const [pdfType, setPdfType] = useState<'sample' | 'main'>(hasFullAccess ? 'main' : 'sample');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);
  const [fitMode, setFitMode] = useState<'height' | 'width'>('height');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showMobileThumbnails, setShowMobileThumbnails] = useState(false);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState<Set<number>>(new Set());
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pdfUrl = `/api/books/${bookId}/pdf?type=${pdfType}`;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 48;
        const height = containerRef.current.clientHeight - 48;
        setContainerWidth(Math.min(width, 1200));
        setContainerHeight(Math.max(height, 400));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }

    if (numPages && onProgressUpdate && pdfType === 'main') {
      progressSaveTimeoutRef.current = setTimeout(() => {
        onProgressUpdate(pageNumber, numPages);
      }, 2000);
    }

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
    };
  }, [pageNumber, numPages, onProgressUpdate, pdfType]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message);
    setLoading(false);
  }, []);

  const goToPrevPage = () => setPageNumber((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  const zoomIn = () => setScale((prev) => Math.min(2.0, prev + 0.25));
  const zoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.25));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleThumbnails = () => setShowThumbnails((prev) => !prev);

  const scrollThumbnailIntoView = useCallback((page: number) => {
    if (thumbnailContainerRef.current) {
      const thumbnail = thumbnailContainerRef.current.querySelector(`[data-page="${page}"]`);
      thumbnail?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (showThumbnails) {
      scrollThumbnailIntoView(pageNumber);
    }
  }, [pageNumber, showThumbnails, scrollThumbnailIntoView]);

  const goToPage = (page: number) => {
    setPageNumber(page);
  };

  const onThumbnailLoadSuccess = (page: number) => {
    setThumbnailsLoaded((prev) => new Set(prev).add(page));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && pageNumber > 1) {
        goToPrevPage();
      } else if (deltaX < 0 && pageNumber < (numPages || 1)) {
        goToNextPage();
      }
    }

    setTouchStart(null);
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= (numPages || 1)) {
      setPageNumber(value);
    }
  };

  const switchPdfType = (type: 'sample' | 'main') => {
    if (type === 'main' && !hasFullAccess) return;
    setLoading(true);
    setPdfType(type);
    setPageNumber(1);
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-gray-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Back & Book Info */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/learner"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              {coverImage && (
                <img
                  src={coverImage}
                  alt={bookTitle}
                  className="w-8 h-10 object-cover rounded shadow"
                />
              )}
              <div className="hidden md:block">
                <h1 className="text-white font-medium truncate max-w-xs">{bookTitle}</h1>
                <p className="text-gray-400 text-sm truncate max-w-xs">{bookAuthor}</p>
              </div>
            </div>
          </div>

          {/* Center: PDF Type Toggle */}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => switchPdfType('sample')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                pdfType === 'sample'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => switchPdfType('main')}
              disabled={!hasFullAccess}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                pdfType === 'main'
                  ? 'bg-green-600 text-white'
                  : hasFullAccess
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              title={!hasFullAccess ? 'Full access requires teacher assignment' : ''}
            >
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Full Book</span>
              {!hasFullAccess && <span className="text-xs">(Locked)</span>}
            </button>
          </div>

          {/* Right: Download, Thumbnails, Zoom & Fullscreen */}
          <div className="flex items-center gap-2">
            {canDownload && (
              <PDFDownloadButton
                bookId={bookId}
                bookTitle={bookTitle}
                canDownload={canDownload}
                variant="icon"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              />
            )}
            <button
              onClick={toggleThumbnails}
              className={`hidden md:flex p-2 rounded-lg transition-colors ${
                showThumbnails
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              title="Toggle Thumbnails"
            >
              {showThumbnails ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-gray-700 rounded-lg px-1 py-1">
              <button
                onClick={() => setFitMode('height')}
                className={`p-1.5 rounded transition-colors ${
                  fitMode === 'height' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
                title="Fit to Page"
              >
                <Maximize className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFitMode('width')}
                className={`p-1.5 rounded transition-colors ${
                  fitMode === 'width' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
                title="Fit to Width"
              >
                <ArrowLeft className="w-4 h-4 rotate-90" />
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
              <button
                onClick={zoomOut}
                className="p-1.5 text-gray-300 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-gray-300 text-sm min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1.5 text-gray-300 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* PDF Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnail Sidebar */}
        {showThumbnails && numPages && (
          <aside className="hidden md:flex w-48 bg-gray-800 border-r border-gray-700 flex-col">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Pages</h3>
            </div>
            <div
              ref={thumbnailContainerRef}
              className="flex-1 overflow-y-auto p-2 space-y-2"
            >
              <Document file={pdfUrl} loading={null}>
                {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    data-page={page}
                    onClick={() => goToPage(page)}
                    className={`w-full p-1 rounded-lg transition-all ${
                      pageNumber === page
                        ? 'ring-2 ring-blue-500 bg-blue-500/10'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="relative bg-gray-800 rounded overflow-hidden">
                      {!thumbnailsLoaded.has(page) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                          <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                        </div>
                      )}
                      <Page
                        pageNumber={page}
                        width={150}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={() => onThumbnailLoadSuccess(page)}
                        className="pointer-events-none"
                      />
                    </div>
                    <span className={`text-xs mt-1 block ${
                      pageNumber === page ? 'text-blue-400 font-medium' : 'text-gray-400'
                    }`}>
                      {page}
                    </span>
                  </button>
                ))}
              </Document>
            </div>
          </aside>
        )}

        {/* Main PDF Content */}
        <main
          className="flex-1 overflow-auto flex justify-center items-start p-4 sm:p-6"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {error ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Failed to Load PDF</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                  <p className="text-gray-400">Loading PDF...</p>
                </div>
              }
              className="shadow-2xl rounded-lg overflow-hidden"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                {...(fitMode === 'height'
                  ? { height: containerHeight / scale }
                  : { width: containerWidth / scale }
                )}
                className="bg-white"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          )}
        </main>
      </div>

      {/* Bottom Navigation */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
          {/* Mobile: Thumbnails Button */}
          <button
            onClick={() => setShowMobileThumbnails(true)}
            className="md:hidden p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
            title="View All Pages"
          >
            <Grid className="w-5 h-5" />
          </button>

          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || loading}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
            <span className="hidden sm:inline">Page</span>
            <input
              type="number"
              value={pageNumber}
              onChange={handlePageInput}
              min={1}
              max={numPages || 1}
              className="w-12 sm:w-16 px-1 sm:px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm sm:text-base">/ {loading ? '...' : numPages}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1) || loading}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Mobile: Zoom Controls */}
          <div className="sm:hidden flex items-center gap-1">
            <button
              onClick={zoomOut}
              className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={zoomIn}
              className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {numPages && (
          <div className="max-w-md mx-auto mt-3">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                style={{ width: `${(pageNumber / numPages) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Swipe hint for mobile */}
        <p className="md:hidden text-center text-gray-500 text-xs mt-2">
          Swipe left/right to navigate pages
        </p>
      </footer>

      {/* Mobile Thumbnail Bottom Sheet */}
      {showMobileThumbnails && numPages && (
        <div className="md:hidden fixed inset-0 bg-black/80 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-white font-medium">All Pages ({numPages})</h3>
            <button
              onClick={() => setShowMobileThumbnails(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
            <Document file={pdfUrl} loading={null}>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      goToPage(page);
                      setShowMobileThumbnails(false);
                    }}
                    className={`p-1 rounded-lg transition-all ${
                      pageNumber === page
                        ? 'ring-2 ring-blue-500 bg-blue-500/20'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="relative bg-gray-800 rounded overflow-hidden aspect-[3/4]">
                      <Page
                        pageNumber={page}
                        width={100}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="pointer-events-none"
                      />
                    </div>
                    <span className={`text-xs mt-1 block ${
                      pageNumber === page ? 'text-blue-400 font-medium' : 'text-gray-400'
                    }`}>
                      {page}
                    </span>
                  </button>
                ))}
              </div>
            </Document>
          </div>
        </div>
      )}
    </div>
  );
}
