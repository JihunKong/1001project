'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Check, X, Volume2, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';

interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  partOfSpeech?: string;
  context?: string;
  masteryLevel: number;
}

interface FlashcardReviewProps {
  words: VocabularyWord[];
  onUpdateMastery: (id: string, level: number) => void;
  onClose: () => void;
}

export default function FlashcardReview({
  words,
  onUpdateMastery,
  onClose,
}: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedWords, setReviewedWords] = useState<Set<string>>(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<VocabularyWord[]>([]);

  useEffect(() => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
  }, [words]);

  const currentWord = shuffledWords[currentIndex];
  const isComplete = reviewedWords.size === shuffledWords.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window && currentWord) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const handleKnew = () => {
    if (!currentWord) return;

    const newLevel = Math.min(currentWord.masteryLevel + 1, 5);
    onUpdateMastery(currentWord.id, newLevel);
    setReviewedWords((prev) => new Set(prev).add(currentWord.id));
    setCorrectCount((prev) => prev + 1);
    goToNext();
  };

  const handleDidntKnow = () => {
    if (!currentWord) return;

    const newLevel = Math.max(currentWord.masteryLevel - 1, 0);
    onUpdateMastery(currentWord.id, newLevel);
    setReviewedWords((prev) => new Set(prev).add(currentWord.id));
    goToNext();
  };

  const goToNext = () => {
    setIsFlipped(false);
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    setShuffledWords([...shuffledWords].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedWords(new Set());
    setCorrectCount(0);
  };

  if (shuffledWords.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <p className="text-gray-600 mb-6">No words to review!</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = Math.round((correctCount / shuffledWords.length) * 100);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Complete!</h2>
          <p className="text-gray-600 mb-6">
            You reviewed {shuffledWords.length} words with {accuracy}% accuracy.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-gray-600">Knew</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-600">
                {shuffledWords.length - correctCount}
              </div>
              <div className="text-sm text-gray-600">Need Practice</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleShuffle}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <RotateCcw className="w-5 h-5" />
              Review Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Flashcard Review</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShuffle}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Shuffle cards"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{
                  width: `${((currentIndex + 1) / shuffledWords.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm">
              {currentIndex + 1} / {shuffledWords.length}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div
            onClick={handleFlip}
            className="relative h-64 cursor-pointer perspective-1000"
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex flex-col items-center justify-center p-6 backface-hidden border-2 border-blue-200"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="text-sm text-blue-600 mb-2">Word</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {currentWord?.word}
                </h3>
                {currentWord?.partOfSpeech && (
                  <span className="text-sm text-gray-500 italic">
                    {currentWord.partOfSpeech}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak();
                  }}
                  className="mt-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Volume2 className="w-5 h-5 text-blue-600" />
                </button>
                <p className="text-sm text-gray-400 mt-4">Tap to flip</p>
              </div>

              <div
                className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex flex-col items-center justify-center p-6 border-2 border-green-200"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <span className="text-sm text-green-600 mb-2">Definition</span>
                <p className="text-lg text-gray-700 text-center mb-4">
                  {currentWord?.definition}
                </p>
                {currentWord?.context && (
                  <p className="text-sm text-gray-500 italic text-center">
                    &ldquo;{currentWord.context}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex gap-4">
              <button
                onClick={handleDidntKnow}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                Still Learning
              </button>
              <button
                onClick={handleKnew}
                className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
              >
                <Check className="w-5 h-5" />
                Got It!
              </button>
            </div>

            <button
              onClick={goToNext}
              disabled={currentIndex === shuffledWords.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
