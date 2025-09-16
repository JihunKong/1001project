'use client';

import { useState, useEffect, useRef } from 'react';
import { pdfjs } from 'react-pdf';
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
  BookOpen
} from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose?: () => void;
  isDemo?: boolean;
  maxPages?: number; // For demo mode, limit pages
}

export default function PDFViewer({ 
  pdfUrl, 
  title, 
  onClose, 
  isDemo = false,
  maxPages = 3 
}: PDFViewerProps) {
  const [pdf, setPdf] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pageRendering, setPageRendering] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Loading PDF from:', pdfUrl);
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;
        
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
        
        // Render first page
        renderPage(pdfDoc, 1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`PDF 로딩 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    };

    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl]);

  // Render specific page
  const renderPage = async (pdfDoc: any, pageNum: number) => {
    if (!canvasRef.current || pageRendering) return;
    
    setPageRendering(true);
    
    try {
      const page: any = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
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
      console.log('Page rendered:', pageNum);
    } catch (err) {
      console.error('Error rendering page:', err);
      setError(`페이지 렌더링 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setPageRendering(false);
    }
  };

  // Re-render when page, scale, or rotation changes
  useEffect(() => {
    if (pdf) {
      renderPage(pdf, currentPage);
    }
  }, [pdf, currentPage, scale, rotation]);

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= (isDemo ? Math.min(maxPages, totalPages) : totalPages)) {
      setCurrentPage(pageNum);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const effectiveMaxPages = isDemo ? Math.min(maxPages, totalPages) : totalPages;

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
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Occurred</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
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
          {isDemo && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
              Demo Mode (Max {maxPages} pages)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="font-medium text-gray-900">
              {currentPage} / {effectiveMaxPages}
            </span>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= effectiveMaxPages}
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

          {/* Download (only in full mode) */}
          {!isDemo && (
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
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 text-gray-700"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4"
      >
        <div className="relative bg-white shadow-lg">
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full ${pageRendering ? 'opacity-50' : ''}`}
          />
          
          {pageRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Demo Warning */}
      {isDemo && (
        <div className="bg-yellow-400 text-black px-4 py-3">
          <div className="flex items-center justify-center gap-3 text-sm font-medium">
            <span>🎭 Demo Mode: Preview up to {maxPages} pages only</span>
            <span>|</span>
            <span>Sign up and purchase to read the full content!</span>
          </div>
        </div>
      )}
    </div>
  );
}