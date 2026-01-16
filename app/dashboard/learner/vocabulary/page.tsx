'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Star,
  Trash2,
  RefreshCw,
  Sparkles,
  BookMarked,
  GraduationCap,
  X,
  Check,
} from 'lucide-react';

interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  partOfSpeech?: string;
  pronunciation?: string;
  audioUrl?: string;
  context?: string;
  sourceBookId?: string;
  masteryLevel: number;
  reviewCount: number;
  nextReviewAt?: string;
  createdAt: string;
  sourceBook?: {
    id: string;
    title: string;
    coverImage?: string;
  };
}

interface VocabularyStats {
  total: number;
  learning: number;
  reviewing: number;
  mastered: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function VocabularyPage() {
  const router = useRouter();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({ total: 0, learning: 0, reviewing: 0, mastered: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardWords, setFlashcardWords] = useState<VocabularyWord[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [totalDue, setTotalDue] = useState(0);

  const fetchVocabulary = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.set('search', search);
      if (masteryFilter) params.set('masteryLevel', masteryFilter);

      const res = await fetch(`/api/vocabulary?${params}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.words);
        setStats(data.stats);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, masteryFilter]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  useEffect(() => {
    const fetchDueCount = async () => {
      try {
        const res = await fetch('/api/vocabulary/review?limit=1');
        if (res.ok) {
          const data = await res.json();
          setTotalDue(data.totalDue);
        }
      } catch (error) {
        console.error('Error fetching due count:', error);
      }
    };
    fetchDueCount();
  }, []);

  const startFlashcardReview = async (mode: 'due' | 'random' | 'weak') => {
    try {
      const res = await fetch(`/api/vocabulary/review?mode=${mode}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.words.length > 0) {
          setFlashcardWords(data.words);
          setCurrentFlashcardIndex(0);
          setShowAnswer(false);
          setIsFlashcardMode(true);
        }
      }
    } catch (error) {
      console.error('Error starting flashcard review:', error);
    }
  };

  const handleFlashcardAnswer = async (correct: boolean) => {
    const currentWord = flashcardWords[currentFlashcardIndex];
    try {
      await fetch('/api/vocabulary/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.id, correct }),
      });

      if (currentFlashcardIndex < flashcardWords.length - 1) {
        setCurrentFlashcardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setIsFlashcardMode(false);
        fetchVocabulary();
      }
    } catch (error) {
      console.error('Error recording answer:', error);
    }
  };

  const deleteWord = async (wordId: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      const res = await fetch(`/api/vocabulary/${wordId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVocabulary();
        setSelectedWord(null);
      }
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  const getMasteryColor = (level: number) => {
    if (level <= 1) return 'text-red-500';
    if (level <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getMasteryLabel = (level: number) => {
    if (level === 0) return 'New';
    if (level <= 1) return 'Learning';
    if (level <= 3) return 'Reviewing';
    if (level <= 4) return 'Known';
    return 'Mastered';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/learner')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Vocabulary</h1>
          <p className="text-gray-600 mt-2">Track and review words you&apos;re learning</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-gray-600 mt-2">Total Words</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <Sparkles className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.learning}</span>
            </div>
            <p className="text-gray-600 mt-2">Learning</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <RefreshCw className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.reviewing}</span>
            </div>
            <p className="text-gray-600 mt-2">Reviewing</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <GraduationCap className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-gray-900">{stats.mastered}</span>
            </div>
            <p className="text-gray-600 mt-2">Mastered</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4">Flashcard Review</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => startFlashcardReview('due')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={totalDue === 0}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Review Due ({totalDue})
            </button>
            <button
              onClick={() => startFlashcardReview('weak')}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              disabled={stats.learning === 0}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Practice Weak Words
            </button>
            <button
              onClick={() => startFlashcardReview('random')}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              disabled={stats.total === 0}
            >
              <BookMarked className="w-5 h-5 mr-2" />
              Random Review
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search words..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={masteryFilter}
                  onChange={(e) => {
                    setMasteryFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="0">New</option>
                  <option value="1">Learning</option>
                  <option value="2">Reviewing</option>
                  <option value="3">Reviewing+</option>
                  <option value="4">Known</option>
                  <option value="5">Mastered</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4">Loading vocabulary...</p>
            </div>
          ) : words.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">No words yet</h3>
              <p className="text-gray-500 mt-2">
                Start reading books and save words to build your vocabulary!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {words.map((word) => (
                <div
                  key={word.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedWord(word)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
                        {word.partOfSpeech && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded">
                            {word.partOfSpeech}
                          </span>
                        )}
                        <div className={`flex items-center ${getMasteryColor(word.masteryLevel)}`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < word.masteryLevel ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1 line-clamp-2">{word.definition}</p>
                      {word.sourceBook && (
                        <p className="text-sm text-gray-400 mt-2">
                          From: {word.sourceBook.title}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      word.masteryLevel <= 1 ? 'bg-red-100 text-red-700' :
                      word.masteryLevel <= 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {getMasteryLabel(word.masteryLevel)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} words
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedWord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedWord.word}</h2>
              <button
                onClick={() => setSelectedWord(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {selectedWord.partOfSpeech && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {selectedWord.partOfSpeech}
                  </span>
                )}
                {selectedWord.pronunciation && (
                  <span className="text-gray-500">/{selectedWord.pronunciation}/</span>
                )}
                {selectedWord.audioUrl && (
                  <button
                    onClick={() => new Audio(selectedWord.audioUrl).play()}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Definition</h3>
                <p className="text-gray-900">{selectedWord.definition}</p>
              </div>
              {selectedWord.context && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Context</h3>
                  <p className="text-gray-700 italic">&ldquo;{selectedWord.context}&rdquo;</p>
                </div>
              )}
              {selectedWord.sourceBook && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Source</h3>
                  <p className="text-gray-700">{selectedWord.sourceBook.title}</p>
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Mastery Level</h3>
                <div className={`flex items-center gap-1 ${getMasteryColor(selectedWord.masteryLevel)}`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < selectedWord.masteryLevel ? 'fill-current' : ''}`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600">
                    {getMasteryLabel(selectedWord.masteryLevel)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Reviewed {selectedWord.reviewCount} times
                </span>
                <button
                  onClick={() => deleteWord(selectedWord.id)}
                  className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFlashcardMode && flashcardWords.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-gray-600">
                Card {currentFlashcardIndex + 1} of {flashcardWords.length}
              </span>
              <button
                onClick={() => setIsFlashcardMode(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {flashcardWords[currentFlashcardIndex].word}
                </h2>
                {flashcardWords[currentFlashcardIndex].partOfSpeech && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {flashcardWords[currentFlashcardIndex].partOfSpeech}
                  </span>
                )}
              </div>
              {showAnswer ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <p className="text-lg text-gray-900 text-center">
                      {flashcardWords[currentFlashcardIndex].definition}
                    </p>
                    {flashcardWords[currentFlashcardIndex].context && (
                      <p className="text-gray-500 italic text-center mt-4">
                        &ldquo;{flashcardWords[currentFlashcardIndex].context}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleFlashcardAnswer(false)}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Didn&apos;t Know
                    </button>
                    <button
                      onClick={() => handleFlashcardAnswer(true)}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Got It!
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-lg font-medium"
                >
                  Show Answer
                </button>
              )}
            </div>
            <div className="px-4 pb-4">
              <div className="bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentFlashcardIndex + 1) / flashcardWords.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
