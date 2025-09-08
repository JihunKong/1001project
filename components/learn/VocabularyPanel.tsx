'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  Search, 
  Filter,
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  Volume2
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { getVocabulary, updateVocabularyMastery } from '@/lib/api/learning-api';
import type { Vocabulary } from '@/types/learning';

interface VocabularyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: string;
}

export function VocabularyPanel({ isOpen, onClose, bookId }: VocabularyPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'mastery'>('recent');
  const [selectedWord, setSelectedWord] = useState<Vocabulary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { vocabulary, updateVocabularyMastery: updateMastery } = useLearningStore();

  useEffect(() => {
    if (isOpen) {
      loadVocabulary();
    }
  }, [isOpen, bookId]);

  const loadVocabulary = async () => {
    setIsLoading(true);
    try {
      const response = await getVocabulary(bookId);
      if (response.success && response.data) {
        // Update store with fetched vocabulary
        response.data.forEach(word => {
          useLearningStore.getState().addVocabulary(word);
        });
      }
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasteryUpdate = async (wordId: string, correct: boolean) => {
    try {
      const response = await updateVocabularyMastery(wordId, correct);
      if (response.success) {
        updateMastery(wordId, correct);
      }
    } catch (error) {
      console.error('Error updating mastery:', error);
    }
  };

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const filteredVocabulary = vocabulary
    .filter(word => {
      if (searchTerm && !word.word.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterLevel !== null && word.masteryLevel !== filterLevel) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        case 'mastery':
          return b.masteryLevel - a.masteryLevel;
        case 'recent':
        default:
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
    });

  const getMasteryColor = (level: number) => {
    const colors = [
      'bg-gray-200',
      'bg-red-200',
      'bg-orange-200',
      'bg-yellow-200',
      'bg-green-200',
      'bg-blue-200',
    ];
    return colors[level] || colors[0];
  };

  const getMasteryLabel = (level: number) => {
    const labels = ['New', 'Learning', 'Familiar', 'Known', 'Mastered', 'Expert'];
    return labels[level] || labels[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">My Vocabulary</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search words..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <select
                    value={filterLevel || ''}
                    onChange={(e) => setFilterLevel(e.target.value ? parseInt(e.target.value) : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    {[0, 1, 2, 3, 4, 5].map(level => (
                      <option key={level} value={level}>
                        {getMasteryLabel(level)}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Recent</option>
                    <option value="alphabetical">A-Z</option>
                    <option value="mastery">Mastery</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {vocabulary.length}
                  </div>
                  <div className="text-xs text-gray-600">Total Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {vocabulary.filter(w => w.masteryLevel >= 3).length}
                  </div>
                  <div className="text-xs text-gray-600">Mastered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {vocabulary.filter(w => w.timesSeen > 0).length}
                  </div>
                  <div className="text-xs text-gray-600">Practiced</div>
                </div>
              </div>
            </div>
            
            {/* Word List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : filteredVocabulary.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No vocabulary words yet.</p>
                  <p className="text-sm mt-2">Click on highlighted words while reading to add them!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVocabulary.map((word) => (
                    <motion.div
                      key={word.id}
                      layout
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedWord(word)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {word.word}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakWord(word.word);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Volume2 className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {word.definition}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Seen {word.timesSeen}x
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {Math.round((word.timesCorrect / Math.max(1, word.timesSeen)) * 100)}% correct
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getMasteryColor(word.masteryLevel)}`}>
                            {getMasteryLabel(word.masteryLevel)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Mastery Stars */}
                      <div className="flex items-center mt-2">
                        {[0, 1, 2, 3, 4].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star < word.masteryLevel
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Word Detail */}
            {selectedWord && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedWord.word}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedWord.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {selectedWord.contexts && selectedWord.contexts.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Example:
                    </h4>
                    <p className="text-sm text-gray-600 italic">
                      "{selectedWord.contexts[0].sentence}"
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleMasteryUpdate(selectedWord.id, false);
                      setSelectedWord(null);
                    }}
                    className="flex-1 py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Need Practice
                  </button>
                  <button
                    onClick={() => {
                      handleMasteryUpdate(selectedWord.id, true);
                      setSelectedWord(null);
                    }}
                    className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    I Know This
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}