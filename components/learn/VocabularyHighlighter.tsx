'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { analyzeText, addVocabulary } from '@/lib/api/learning-api';
import { BookOpen, Loader2 } from 'lucide-react';

interface VocabularyHighlighterProps {
  text: string;
  bookId: string;
  level?: string;
  onWordClick?: (word: string, definition: string) => void;
}

export function VocabularyHighlighter({ 
  text, 
  bookId,
  level = 'B1',
  onWordClick 
}: VocabularyHighlighterProps) {
  const [difficultWords, setDifficultWords] = useState<string[]>([]);
  const [definitions, setDefinitions] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  
  const { 
    highlightedWords, 
    setHighlightedWords, 
    addVocabulary: addToStore,
    selectWord 
  } = useLearningStore();

  useEffect(() => {
    analyzeTextContent();
  }, [text, level]);

  useEffect(() => {
    // Close popup when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedWord(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const analyzeTextContent = async () => {
    if (!text || text.length < 50) return;
    
    setIsAnalyzing(true);
    try {
      const response = await analyzeText(text, level);
      if (response.success && response.data) {
        setDifficultWords(response.data.difficultWords || []);
        setDefinitions(response.data.definitions || {});
        setHighlightedWords(response.data.difficultWords || []);
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Set popup position
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
    
    setSelectedWord(cleanWord);
    
    // Get or generate definition
    let definition = definitions[cleanWord];
    if (!definition) {
      // Simple fallback definition
      definition = `A word meaning related to "${cleanWord}"`;
    }
    
    // Notify parent component
    onWordClick?.(cleanWord, definition);
    selectWord(cleanWord, definition, { x: rect.left, y: rect.bottom });
    
    // Add to vocabulary
    try {
      await addVocabulary({
        word: cleanWord,
        definition,
        bookId,
        contexts: [{
          sentence: getSentenceContainingWord(text, cleanWord),
          bookId,
          pageNumber: 1,
        }],
        masteryLevel: 0,
        timesSeen: 1,
        timesCorrect: 0,
        lastSeen: new Date(),
        userId: '', // Will be set by API
        id: '', // Will be set by API
      });
      
      addToStore({
        id: crypto.randomUUID(),
        userId: '',
        word: cleanWord,
        definition,
        bookId,
        contexts: [{
          sentence: getSentenceContainingWord(text, cleanWord),
          bookId,
          pageNumber: 1,
        }],
        masteryLevel: 0,
        timesSeen: 1,
        timesCorrect: 0,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error('Error adding vocabulary:', error);
    }
  };

  const getSentenceContainingWord = (text: string, word: string): string => {
    const sentences = text.split(/[.!?]+/);
    const sentence = sentences.find(s => 
      s.toLowerCase().includes(word.toLowerCase())
    );
    return sentence?.trim() || '';
  };

  const highlightText = () => {
    if (!text) return null;
    
    if (difficultWords.length === 0) {
      return <span>{text}</span>;
    }
    
    // Create regex pattern for all difficult words
    const pattern = new RegExp(
      `\\b(${difficultWords.join('|')})\\b`,
      'gi'
    );
    
    const parts = text.split(pattern);
    
    return parts.map((part, index) => {
      const isHighlighted = difficultWords.some(
        word => word.toLowerCase() === part.toLowerCase()
      );
      
      if (isHighlighted) {
        return (
          <span
            key={index}
            className="relative inline-block"
          >
            <span
              className="bg-yellow-200 hover:bg-yellow-300 cursor-pointer px-0.5 rounded transition-colors duration-200 border-b-2 border-yellow-400"
              onClick={(e) => handleWordClick(part, e)}
            >
              {part}
            </span>
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="relative">
      {isAnalyzing && (
        <div className="absolute top-0 right-0 flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analyzing vocabulary...</span>
        </div>
      )}
      
      <div className="text-lg leading-relaxed text-gray-800">
        {highlightText()}
      </div>
      
      {/* Word Definition Popup */}
      {selectedWord && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-start space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedWord}
              </h3>
              <p className="text-sm text-gray-600">
                {definitions[selectedWord] || 'Definition loading...'}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Added to vocabulary
                </span>
                <span className="text-xs text-gray-500">
                  Tap anywhere to close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Bar */}
      {difficultWords.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {difficultWords.length} challenging words identified
          </span>
          <span className="text-blue-600 font-medium">
            Level: {level}
          </span>
        </div>
      )}
    </div>
  );
}