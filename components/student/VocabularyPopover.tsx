'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, BookOpen, GripHorizontal, BookmarkPlus, Check, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VocabularyPopoverProps {
  word: string;
  context: string;
  language: string;
  position: { x: number; y: number };
  onClose: () => void;
  bookId?: string;
}

interface WordExplanation {
  word: string;
  explanation: string;
  language: string;
}

const calculateOptimalPosition = (
  clickPosition: { x: number; y: number },
  popoverWidth: number = 400,
  popoverHeight: number = 400
): { top: number; left: number } => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  };

  const PADDING = 20;

  const spaceBelow = viewport.height - (clickPosition.y - viewport.scrollY);
  const spaceAbove = clickPosition.y - viewport.scrollY;
  const spaceRight = viewport.width - (clickPosition.x - viewport.scrollX);
  const spaceLeft = clickPosition.x - viewport.scrollX;

  let top = clickPosition.y;
  let left = clickPosition.x;

  if (spaceBelow >= popoverHeight + PADDING) {
    top = clickPosition.y + 10;
    left = Math.max(
      PADDING + viewport.scrollX,
      Math.min(clickPosition.x, viewport.scrollX + viewport.width - popoverWidth - PADDING)
    );
  } else if (spaceAbove >= popoverHeight + PADDING) {
    top = clickPosition.y - popoverHeight - 10;
    left = Math.max(
      PADDING + viewport.scrollX,
      Math.min(clickPosition.x, viewport.scrollX + viewport.width - popoverWidth - PADDING)
    );
  } else if (spaceRight >= popoverWidth + PADDING) {
    top = Math.max(
      PADDING + viewport.scrollY,
      Math.min(clickPosition.y, viewport.scrollY + viewport.height - popoverHeight - PADDING)
    );
    left = clickPosition.x + 10;
  } else if (spaceLeft >= popoverWidth + PADDING) {
    top = Math.max(
      PADDING + viewport.scrollY,
      Math.min(clickPosition.y, viewport.scrollY + viewport.height - popoverHeight - PADDING)
    );
    left = clickPosition.x - popoverWidth - 10;
  } else {
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
  onClose,
  bookId
}: VocabularyPopoverProps) {
  const [explanation, setExplanation] = useState<WordExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'duplicate' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isPositionInitialized, setIsPositionInitialized] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const POPOVER_WIDTH = 400;

  useEffect(() => {
    const pos = calculateOptimalPosition(position);
    setCurrentPosition(pos);
    setIsPositionInitialized(true);
  }, [position]);

  useEffect(() => {
    fetchExplanation();
  }, [word, context, language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPosition.left,
      y: e.clientY - currentPosition.top
    });
  }, [currentPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newLeft = e.clientX - dragOffset.x;
      const newTop = e.clientY - dragOffset.y;

      const boundedLeft = Math.max(10, Math.min(newLeft, window.innerWidth - POPOVER_WIDTH - 10));
      const boundedTop = Math.max(10, Math.min(newTop, window.innerHeight - 100));

      setCurrentPosition({ left: boundedLeft, top: boundedTop });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

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

  const handleSaveToVocabulary = async () => {
    if (!explanation || saveStatus === 'saving' || saveStatus === 'saved') return;

    setSaveStatus('saving');

    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word,
          definition: explanation.explanation,
          context: context,
          sourceBookId: bookId,
        }),
      });

      if (response.status === 409) {
        setSaveStatus('duplicate');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save word');
      }

      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving word to vocabulary:', err);
      setSaveStatus('error');
    }
  };

  if (!isPositionInitialized) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className={`fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-[400px] max-h-[70vh] overflow-hidden flex flex-col vocabulary-popover ${isDragging ? 'cursor-grabbing select-none' : ''}`}
      style={{
        top: currentPosition.top,
        left: currentPosition.left,
        boxShadow: isDragging
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
    >
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 opacity-60" />
          <BookOpen className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Word Helper</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm text-gray-900 mb-1">Selected Word</div>
          <div className="text-2xl font-bold text-blue-600">{word}</div>
        </div>

        {context && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-900 mb-2">Context</div>
            <div className="text-sm text-gray-900 italic bg-gray-50 p-3 rounded-md">
              &ldquo;{context}&rdquo;
            </div>
          </div>
        )}

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

      <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200 flex-shrink-0 space-y-2">
        {!loading && !error && explanation && (
          <button
            onClick={handleSaveToVocabulary}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className={`w-full py-2 px-4 font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
              saveStatus === 'saved'
                ? 'bg-green-500 text-white cursor-default'
                : saveStatus === 'duplicate'
                ? 'bg-yellow-500 text-white cursor-default'
                : saveStatus === 'error'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-4 h-4" />
                Saved to Vocabulary!
              </>
            )}
            {saveStatus === 'duplicate' && (
              <>
                <AlertCircle className="w-4 h-4" />
                Already in Vocabulary
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4" />
                Try Again
              </>
            )}
            {saveStatus === 'idle' && (
              <>
                <BookmarkPlus className="w-4 h-4" />
                Save to Vocabulary
              </>
            )}
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
