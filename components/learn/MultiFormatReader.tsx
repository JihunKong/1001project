'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileText, FileCode, FileType, File } from 'lucide-react';
import type { ContentFormat } from '@/lib/content-loader';

interface MultiFormatReaderProps {
  content: string;
  format: ContentFormat;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  highlightedWords?: string[];
  onWordClick?: (word: string, definition: string) => void;
}

export function MultiFormatReader({
  content,
  format,
  currentPage,
  totalPages,
  onPageChange,
  highlightedWords = [],
  onWordClick,
}: MultiFormatReaderProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Parse content into pages based on format
    if (format !== 'pdf') {
      const parsedPages = parseContentToPages(content, format);
      setPages(parsedPages);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [content, format]);

  const parseContentToPages = (text: string, fmt: ContentFormat): string[] => {
    switch (fmt) {
      case 'md':
        // Split markdown by headers
        return text.split(/\n#{1,3}\s+/).filter(Boolean);
      
      case 'html':
        // Split HTML by section tags
        return text.split(/<(?:section|article|div class="page")[^>]*>/).filter(Boolean);
      
      case 'txt':
        // Split text by word count (~300 words per page)
        const words = text.split(/\s+/);
        const pagesArray: string[] = [];
        let currentPageWords: string[] = [];
        
        for (const word of words) {
          currentPageWords.push(word);
          if (currentPageWords.length >= 300) {
            pagesArray.push(currentPageWords.join(' '));
            currentPageWords = [];
          }
        }
        
        if (currentPageWords.length > 0) {
          pagesArray.push(currentPageWords.join(' '));
        }
        
        return pagesArray;
      
      default:
        return [text];
    }
  };

  const highlightText = (text: string): React.ReactNode => {
    if (highlightedWords.length === 0) return text;

    const regex = new RegExp(`\\b(${highlightedWords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (highlightedWords.some(word => word.toLowerCase() === part.toLowerCase())) {
        return (
          <span
            key={index}
            className="bg-yellow-200 hover:bg-yellow-300 cursor-pointer transition-colors"
            onClick={() => {
              if (onWordClick) {
                // In production, fetch definition from API
                const definition = `Definition of "${part}"`;
                onWordClick(part, definition);
              }
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (format) {
      case 'pdf':
        return (
          <div className="pdf-viewer h-full">
            <Document file={content}>
              <Page 
                pageNumber={currentPage} 
                className="mx-auto"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        );

      case 'md':
        return (
          <div className="prose prose-lg max-w-none p-8">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed">
                    {highlightText(String(children))}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold mb-2">{children}</h3>
                ),
              }}
            >
              {pages[currentPage - 1] || ''}
            </ReactMarkdown>
          </div>
        );

      case 'html':
        return (
          <div 
            className="prose prose-lg max-w-none p-8"
            dangerouslySetInnerHTML={{ 
              __html: pages[currentPage - 1] || '' 
            }}
          />
        );

      case 'txt':
        return (
          <div className="p-8">
            <div className="text-lg leading-relaxed whitespace-pre-wrap">
              {highlightText(pages[currentPage - 1] || '')}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8">
            <p className="text-gray-500">Unsupported format: {format}</p>
          </div>
        );
    }
  };

  const getFormatIcon = () => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'md':
        return <FileCode className="w-5 h-5" />;
      case 'html':
        return <FileType className="w-5 h-5" />;
      case 'txt':
        return <File className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Format indicator */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {getFormatIcon()}
          <span className="font-medium uppercase">{format} Format</span>
        </div>
        <div className="text-sm text-gray-600">
          Page {currentPage} of {format === 'pdf' ? totalPages : pages.length}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto bg-white">
        {renderContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {currentPage} / {format === 'pdf' ? totalPages : pages.length}
          </span>
        </div>

        <button
          onClick={() => onPageChange(Math.min(format === 'pdf' ? totalPages : pages.length, currentPage + 1))}
          disabled={currentPage === (format === 'pdf' ? totalPages : pages.length)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}