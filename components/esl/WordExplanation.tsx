'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Volume2, 
  BookOpen, 
  Globe, 
  Lightbulb,
  Star,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface WordExplanationProps {
  word: string;
  position: { x: number; y: number };
  language: string;
  onClose: () => void;
}

interface WordDefinition {
  word: string;
  pronunciation?: string;
  phonetic?: string;
  definitions: {
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonyms?: string[];
  }[];
  etymology?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'common' | 'uncommon' | 'rare';
}

export default function WordExplanation({ word, position, language, onClose }: WordExplanationProps) {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const popupRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    fetchWordDefinition();
    checkIfWordSaved();
  }, [word]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      if (speechRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [onClose]);

  const fetchWordDefinition = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/esl/word-definition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word.toLowerCase(),
          language
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDefinition(data.definition);
      } else {
        setError('Unable to fetch definition');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkIfWordSaved = async () => {
    try {
      const response = await fetch(`/api/esl/vocabulary/check?word=${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.isSaved);
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const toggleSaveWord = async () => {
    try {
      const response = await fetch('/api/esl/vocabulary', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word.toLowerCase(),
          definition: definition?.definitions[0]?.definition || '',
          pronunciation: definition?.pronunciation || definition?.phonetic || '',
          partOfSpeech: definition?.definitions[0]?.partOfSpeech || '',
          example: definition?.definitions[0]?.example || ''
        }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error('Error saving/removing word:', err);
    }
  };

  const pronounceWord = () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = language === 'en' ? 'en-US' : language;
    utterance.rate = 0.7;
    utterance.pitch = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'common': return '⭐⭐⭐ Common';
      case 'uncommon': return '⭐⭐ Uncommon';
      case 'rare': return '⭐ Rare';
      default: return 'Unknown';
    }
  };

  // Calculate popup position to stay within viewport
  const getPopupStyle = () => {
    const popup = popupRef.current;
    if (!popup) return { left: position.x, top: position.y };

    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.x - rect.width / 2;
    let top = position.y - rect.height - 10;

    // Adjust horizontal position
    if (left < 10) left = 10;
    if (left + rect.width > viewportWidth - 10) left = viewportWidth - rect.width - 10;

    // Adjust vertical position
    if (top < 10) top = position.y + 30;

    return { left, top };
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-80"
        style={getPopupStyle()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{word}</h3>
            <button
              onClick={pronounceWord}
              className={`p-1 rounded transition-colors ${
                isPlaying ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
              }`}
              title="Pronounce word"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading definition...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <BookOpen className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-gray-600 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-2">
                Try checking the spelling or try a different word
              </p>
            </div>
          ) : definition ? (
            <div className="space-y-4">
              {/* Pronunciation */}
              {(definition.pronunciation || definition.phonetic) && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Pronunciation: </span>
                  <span className="font-mono">
                    {definition.pronunciation || definition.phonetic}
                  </span>
                </div>
              )}

              {/* Difficulty and Frequency */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(definition.difficulty)}`}>
                  {definition.difficulty.charAt(0).toUpperCase() + definition.difficulty.slice(1)}
                </span>
                <span className="text-xs text-gray-500">
                  {getFrequencyLabel(definition.frequency)}
                </span>
              </div>

              {/* Definitions */}
              <div className="space-y-3">
                {definition.definitions.map((def, index) => (
                  <div key={index} className="border-l-2 border-blue-100 pl-3">
                    <div className="text-xs font-medium text-blue-600 uppercase mb-1">
                      {def.partOfSpeech}
                    </div>
                    <div className="text-sm text-gray-800 mb-2">
                      {def.definition}
                    </div>
                    {def.example && (
                      <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                        <span className="font-medium">Example: </span>
                        {def.example}
                      </div>
                    )}
                    {def.synonyms && def.synonyms.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        <span className="font-medium">Synonyms: </span>
                        {def.synonyms.slice(0, 3).join(', ')}
                        {def.synonyms.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Etymology */}
              {definition.etymology && (
                <div className="text-xs text-gray-600 bg-amber-50 p-2 rounded">
                  <span className="font-medium">Etymology: </span>
                  {definition.etymology}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {definition && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={toggleSaveWord}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSaved
                  ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200'
                  : 'text-gray-600 bg-white hover:bg-gray-100'
              }`}
            >
              <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save Word'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`https://www.google.com/search?q=define+${encodeURIComponent(word)}`, '_blank')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Search online"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Learning Tip */}
        <div className="px-4 pb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <div className="font-medium mb-1">Learning Tip</div>
                <div>Try using this word in your own sentence to help remember it!</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}