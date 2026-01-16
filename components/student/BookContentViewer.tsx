'use client';

import { useState, useEffect, MouseEvent } from 'react';
import VocabularyPopover from './VocabularyPopover';

interface BookContentViewerProps {
  content: string;
  language: string;
  enableVocabularyPopup?: boolean;
  bookId?: string;
}

interface SelectedWord {
  word: string;
  context: string;
  position: { x: number; y: number };
}

export default function BookContentViewer({
  content,
  language,
  enableVocabularyPopup = true,
  bookId
}: BookContentViewerProps) {
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);

  useEffect(() => {
    if (!enableVocabularyPopup) return;

    // Add word selection listener
    const container = document.getElementById('book-content');
    if (!container) return;

    const handleTextSelection = (event: MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();

      // Only trigger for single words (not phrases)
      if (selectedText && selectedText.split(/\s+/).length === 1 && selectedText.length > 2) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Get surrounding context (sentence)
        const context = getSurroundingContext(range);

        setSelectedWord({
          word: selectedText,
          context,
          position: {
            x: rect.left + window.scrollX,
            y: rect.bottom + window.scrollY + 10
          }
        });

        // Clear selection
        selection.removeAllRanges();
      }
    };

    container.addEventListener('mouseup', handleTextSelection as any);

    return () => {
      container.removeEventListener('mouseup', handleTextSelection as any);
    };
  }, [enableVocabularyPopup]);

  const getSurroundingContext = (range: Range): string => {
    try {
      const container = range.startContainer;
      const textNode = container.nodeType === Node.TEXT_NODE ? container : container.firstChild;

      if (!textNode || !textNode.textContent) return '';

      const fullText = textNode.textContent;
      const selectedStart = range.startOffset;
      const selectedEnd = range.endOffset;

      // Find sentence boundaries
      const beforeText = fullText.slice(0, selectedStart);
      const afterText = fullText.slice(selectedEnd);

      // Look for sentence start (. ! ? or beginning of text)
      const sentenceStartMatch = beforeText.match(/[.!?]\s+([^.!?]*)$/);
      const sentenceStart = sentenceStartMatch
        ? beforeText.length - sentenceStartMatch[1].length
        : Math.max(0, selectedStart - 100);

      // Look for sentence end (. ! ? or end of text)
      const sentenceEndMatch = afterText.match(/^([^.!?]*)[.!?]/);
      const sentenceEnd = sentenceEndMatch
        ? selectedEnd + sentenceEndMatch[1].length
        : Math.min(fullText.length, selectedEnd + 100);

      return fullText.slice(sentenceStart, sentenceEnd).trim();
    } catch (error) {
      console.error('Error getting context:', error);
      return '';
    }
  };

  const closePopover = () => {
    setSelectedWord(null);
  };

  return (
    <>
      <div
        id="book-content"
        data-reading-interface
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-900"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          cursor: 'text',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text'
        }}
      />

      {enableVocabularyPopup && selectedWord && (
        <VocabularyPopover
          word={selectedWord.word}
          context={selectedWord.context}
          language={language}
          position={selectedWord.position}
          onClose={closePopover}
          bookId={bookId}
        />
      )}
    </>
  );
}
