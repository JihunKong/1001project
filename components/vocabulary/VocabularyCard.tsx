'use client';

import { useState } from 'react';
import { Star, BookOpen, Trash2, Volume2 } from 'lucide-react';

interface VocabularyCardProps {
  id: string;
  word: string;
  definition: string;
  partOfSpeech?: string;
  context?: string;
  masteryLevel: number;
  sourceBook?: {
    id: string;
    title: string;
    coverImage?: string;
  };
  onDelete?: (id: string) => void;
  onUpdateMastery?: (id: string, level: number) => void;
}

export default function VocabularyCard({
  id,
  word,
  definition,
  partOfSpeech,
  context,
  masteryLevel,
  sourceBook,
  onDelete,
  onUpdateMastery,
}: VocabularyCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      onDelete(id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const getMasteryColor = () => {
    if (masteryLevel >= 4) return 'text-green-500';
    if (masteryLevel >= 2) return 'text-yellow-500';
    return 'text-gray-300';
  };

  const getMasteryLabel = () => {
    if (masteryLevel >= 4) return 'Mastered';
    if (masteryLevel >= 2) return 'Learning';
    return 'New';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900">{word}</h3>
            <button
              onClick={handleSpeak}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Listen to pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          {partOfSpeech && (
            <span className="text-sm text-gray-500 italic">{partOfSpeech}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              onClick={() => onUpdateMastery?.(id, i + 1)}
              className="p-0.5"
            >
              <Star
                className={`w-4 h-4 ${
                  i < masteryLevel ? getMasteryColor() : 'text-gray-200'
                } ${i < masteryLevel ? 'fill-current' : ''}`}
              />
            </button>
          ))}
        </div>
      </div>

      <p className="text-gray-700 mb-3">{definition}</p>

      {context && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-600 italic">&ldquo;{context}&rdquo;</p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {sourceBook && (
            <div className="flex items-center gap-1 text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{sourceBook.title}</span>
            </div>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            masteryLevel >= 4
              ? 'bg-green-100 text-green-700'
              : masteryLevel >= 2
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {getMasteryLabel()}
          </span>
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete word"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
