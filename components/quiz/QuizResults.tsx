'use client';

import { Trophy, Target, Clock, RotateCcw, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface QuizResultsProps {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  passingScore: number;
  timeSpent?: number;
  bestScore?: number;
  isNewBest?: boolean;
  bookId: string;
  bookTitle: string;
  onRetry: () => void;
}

export default function QuizResults({
  score,
  passed,
  correctCount,
  totalQuestions,
  passingScore,
  timeSpent,
  bestScore,
  isNewBest,
  bookId,
  bookTitle,
  onRetry,
}: QuizResultsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= passingScore) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    if (passed) return 'from-green-500 to-emerald-600';
    return 'from-amber-500 to-orange-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${getScoreBackground()} p-8 text-white text-center`}>
        <div className="mb-4">
          {passed ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              <Target className="w-10 h-10" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {passed ? 'Congratulations!' : 'Keep Practicing!'}
        </h2>
        <p className="text-white/80">
          {passed
            ? 'You passed the comprehension quiz!'
            : `You need ${passingScore}% to pass. Try again!`}
        </p>

        {isNewBest && (
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-100 px-4 py-2 rounded-full text-sm font-medium">
            <Trophy className="w-4 h-4" />
            New Personal Best!
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold ${getScoreColor()} mb-2`}>
            {score}%
          </div>
          <p className="text-gray-500">Your Score</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{correctCount}</span>
            </div>
            <p className="text-sm text-gray-500">Correct Answers</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">
                {totalQuestions - correctCount}
              </span>
            </div>
            <p className="text-sm text-gray-500">Incorrect Answers</p>
          </div>

          {timeSpent && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {formatTime(timeSpent)}
                </span>
              </div>
              <p className="text-sm text-gray-500">Time Spent</p>
            </div>
          )}

          {bestScore !== undefined && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{bestScore}%</span>
              </div>
              <p className="text-sm text-gray-500">Best Score</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href={`/dashboard/learner/read/${bookId}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Read Again
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/dashboard/learner"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
