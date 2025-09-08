'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Volume2, 
  Star, 
  Plus,
  X,
  Globe,
  BookMarked
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { addVocabulary } from '@/lib/api/learning-api';

interface WordDefinitionPopupProps {
  word: string;
  definition: string;
  position: { x: number; y: number };
  bookId?: string;
  onClose: () => void;
  onAddToVocabulary?: () => void;
}

export function WordDefinitionPopup({
  word,
  definition,
  position,
  bookId,
  onClose,
  onAddToVocabulary
}: WordDefinitionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { addVocabulary: addToStore, vocabulary } = useLearningStore();
  
  const isInVocabulary = vocabulary.some(v => v.word === word.toLowerCase());

  useEffect(() => {
    // Adjust position if popup goes off screen
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (rect.right > viewportWidth) {
        popupRef.current.style.left = `${viewportWidth - rect.width - 20}px`;
      }
      if (rect.bottom > viewportHeight) {
        popupRef.current.style.top = `${position.y - rect.height - 10}px`;
      }
    }
  }, [position]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleAddToVocabulary = async () => {
    if (isAdding || isInVocabulary) return;
    
    setIsAdding(true);
    try {
      const response = await addVocabulary({
        word: word.toLowerCase(),
        definition,
        bookId,
        translations,
        contexts: [],
        masteryLevel: 0,
        timesSeen: 1,
        timesCorrect: 0,
        lastSeen: new Date(),
        userId: '',
        id: '',
      });
      
      if (response.success && response.data) {
        addToStore(response.data);
        onAddToVocabulary?.();
      }
    } catch (error) {
      console.error('Error adding to vocabulary:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const getTranslation = async (targetLang: string) => {
    // In production, this would call a translation API
    // For now, we'll use placeholder translations
    const placeholderTranslations: Record<string, Record<string, string>> = {
      ko: { 
        'example': '예시',
        'difficult': '어려운',
        'vocabulary': '어휘'
      },
      es: {
        'example': 'ejemplo',
        'difficult': 'difícil',
        'vocabulary': 'vocabulario'
      },
      zh: {
        'example': '例子',
        'difficult': '困难',
        'vocabulary': '词汇'
      }
    };
    
    const translation = placeholderTranslations[targetLang]?.[word.toLowerCase()] 
      || `[${targetLang}] ${word}`;
    
    setTranslations(prev => ({ ...prev, [targetLang]: translation }));
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 max-w-sm"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {word}
            </h3>
            <button
              onClick={speakWord}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pronounce"
            >
              <Volume2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Definition */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {definition}
          </p>
        </div>
        
        {/* Translations */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Translations:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['ko', 'es', 'zh'].map(lang => (
              <button
                key={lang}
                onClick={() => getTranslation(lang)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                {translations[lang] || lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors"
                title={`Difficulty: ${star}`}
              />
            ))}
          </div>
          
          {isInVocabulary ? (
            <div className="flex items-center space-x-1 text-green-600">
              <BookMarked className="w-4 h-4" />
              <span className="text-sm font-medium">In Vocabulary</span>
            </div>
          ) : (
            <button
              onClick={handleAddToVocabulary}
              disabled={isAdding}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  <span className="text-sm">Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add to Vocabulary</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Tip */}
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 Tip: Click on any highlighted word to learn its meaning and add it to your personal vocabulary!
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}