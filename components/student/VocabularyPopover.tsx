'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VocabularyPopoverProps {
  word: string;
  context: string;
  language: string;
  position: { x: number; y: number };
  onClose: () => void;
}

interface WordExplanation {
  word: string;
  explanation: string;
  language: string;
}

// Helper function to calculate optimal popover position
const calculateOptimalPosition = (
  clickPosition: { x: number; y: number },
  popoverWidth: number = 400,
  popoverHeight: number = 500
): { top: number; left: number } => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  };

  const PADDING = 20; // Distance from viewport edges

  // Calculate available space in each direction
  const spaceBelow = viewport.height - (clickPosition.y - viewport.scrollY);
  const spaceAbove = clickPosition.y - viewport.scrollY;
  const spaceRight = viewport.width - (clickPosition.x - viewport.scrollX);
  const spaceLeft = clickPosition.x - viewport.scrollX;

  let top = clickPosition.y;
  let left = clickPosition.x;

  // Priority 1: Below word (preferred)
  if (spaceBelow >= popoverHeight + PADDING) {
    top = clickPosition.y + 10;
    left = Math.max(
      PADDING + viewport.scrollX,
      Math.min(clickPosition.x, viewport.scrollX + viewport.width - popoverWidth - PADDING)
    );
  }
  // Priority 2: Above word
  else if (spaceAbove >= popoverHeight + PADDING) {
    top = clickPosition.y - popoverHeight - 10;
    left = Math.max(
      PADDING + viewport.scrollX,
      Math.min(clickPosition.x, viewport.scrollX + viewport.width - popoverWidth - PADDING)
    );
  }
  // Priority 3: Right of word
  else if (spaceRight >= popoverWidth + PADDING) {
    top = Math.max(
      PADDING + viewport.scrollY,
      Math.min(clickPosition.y, viewport.scrollY + viewport.height - popoverHeight - PADDING)
    );
    left = clickPosition.x + 10;
  }
  // Priority 4: Left of word
  else if (spaceLeft >= popoverWidth + PADDING) {
    top = Math.max(
      PADDING + viewport.scrollY,
      Math.min(clickPosition.y, viewport.scrollY + viewport.height - popoverHeight - PADDING)
    );
    left = clickPosition.x - popoverWidth - 10;
  }
  // Fallback: Center of viewport
  else {
    top = viewport.scrollY + (viewport.height - popoverHeight) / 2;
    left = viewport.scrollX + (viewport.width - popoverWidth) / 2;
  }

  return { top, left };
};

export default function VocabularyPopover({
  word,
  context,
  language,
  position,
  onClose
}: VocabularyPopoverProps) {
  const [explanation, setExplanation] = useState<WordExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimalPosition, setOptimalPosition] = useState<{ top: number; left: number }>({
    top: position.y,
    left: position.x
  });

  useEffect(() => {
    // Calculate optimal position when component mounts or position changes
    const pos = calculateOptimalPosition(position);
    setOptimalPosition(pos);
  }, [position]);

  useEffect(() => {
    fetchExplanation();
  }, [word, context, language]);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/explain-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word, context, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explanation');
      }

      const data = await response.json();
      setExplanation(data);
    } catch (err) {
      console.error('Error fetching word explanation:', err);
      setError('Failed to load explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-10 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-[400px] max-h-[80vh] overflow-y-auto vocabulary-popover"
        style={{
          top: optimalPosition.top,
          left: optimalPosition.left,
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Word Helper</h3>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Selected Word */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-900 mb-1">Selected Word</div>
            <div className="text-2xl font-bold text-blue-600">{word}</div>
          </div>

          {/* Context */}
          {context && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-900 mb-2">Context</div>
              <div className="text-sm text-gray-900 italic bg-gray-50 p-3 rounded-md">
                "{context}"
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-2">
            <div className="text-sm text-gray-900 mb-2">Explanation</div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-900">Loading explanation...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                {error}
              </div>
            )}

            {!loading && !error && explanation && (
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown>
                  {explanation.explanation}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-lg border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </>
  );
}
