'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VocabularyHighlighter } from './VocabularyHighlighter';

interface MarkdownReaderProps {
  content: string;
  bookId: string;
  level: string;
  onWordClick: (word: string, definition: string, position: { x: number; y: number }) => void;
  fontSize?: number;
  currentPage?: number;
  pageSize?: number;
  isSimplified?: boolean;
}

export function MarkdownReader({
  content,
  bookId,
  level,
  onWordClick,
  fontSize = 18,
  currentPage = 1,
  pageSize = 500, // words per page
  isSimplified = false
}: MarkdownReaderProps) {
  const [pageContent, setPageContent] = useState<string>('');
  const [processedContent, setProcessedContent] = useState<string>('');

  // Parse markdown and split into pages
  useEffect(() => {
    // Clean up the markdown content
    const cleanContent = content
      .replace(/^#\s+/gm, '# ') // Normalize headers
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();

    // Split content into pages based on word count
    const words = cleanContent.split(/\s+/);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageWords = words.slice(startIndex, endIndex);
    
    // Reconstruct the page content, preserving markdown structure
    let currentPageContent = pageWords.join(' ');
    
    // Ensure we don't cut off in the middle of a markdown element
    // If we're in the middle of a list or paragraph, include the whole element
    if (startIndex > 0 && !currentPageContent.startsWith('\n')) {
      currentPageContent = '\n' + currentPageContent;
    }
    
    setPageContent(currentPageContent);
  }, [content, currentPage, pageSize]);

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-semibold mb-4 mt-6 text-gray-800" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }: any) => (
      <div className="mb-4 text-gray-700 leading-relaxed" {...props}>
        <VocabularyHighlighter
          text={String(children)}
          bookId={bookId}
          level={level}
          onWordClick={onWordClick}
        />
      </div>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-gray-700" {...props}>
        <span className="ml-2">{children}</span>
      </li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600" {...props}>
        {children}
      </blockquote>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-bold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    code: ({ children, ...props }: any) => (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    ),
    pre: ({ children, ...props }: any) => (
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props}>
        {children}
      </pre>
    ),
    hr: () => (
      <hr className="my-8 border-t-2 border-gray-200" />
    ),
  };

  return (
    <div 
      className="prose prose-lg max-w-none"
      style={{ fontSize: `${fontSize}px` }}
    >
      {isSimplified && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            📚 This text has been simplified for {level} level learners
          </p>
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {pageContent}
      </ReactMarkdown>
    </div>
  );
}