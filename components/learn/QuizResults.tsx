'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Clock, 
  Star,
  Award,
  TrendingUp,
  BookOpen,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { Quiz, QuizQuestion } from '@/types/learning';

interface QuizResultsProps {
  results: {
    quiz: Quiz;
    score: number;
    correctCount: number;
    totalQuestions: number;
    results: Array<{
      questionIndex: number;
      userAnswer: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  };
  quiz: Quiz;
  onClose: () => void;
}

export function QuizResults({ results, quiz, onClose }: QuizResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score === 100) return 'Perfect Score! Outstanding work!';
    if (score >= 90) return 'Excellent! You have mastered this material!';
    if (score >= 80) return 'Great job! You understand the content well!';
    if (score >= 70) return 'Good work! Keep practicing to improve!';
    if (score >= 60) return 'Not bad! Review the material to strengthen your understanding.';
    return 'Keep practicing! Review the reading and try again.';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = quiz.questions as QuizQuestion[];

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="text-center py-8"
      >
        <div className="relative inline-block">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className={`text-7xl font-bold ${getScoreColor(results.score)}`}
          >
            {results.score}%
          </motion.div>
          {results.score === 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -top-4 -right-4"
            >
              <Trophy className="w-12 h-12 text-yellow-500" />
            </motion.div>
          )}
        </div>
        
        <p className="text-xl font-semibold text-gray-800 mt-4">
          {getScoreMessage(results.score)}
        </p>
        
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-2xl font-bold text-gray-800">
                {results.correctCount}/{results.totalQuestions}
              </span>
            </div>
            <span className="text-sm text-gray-600">Correct Answers</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-2xl font-bold text-gray-800">
                {formatTime(quiz.timeSpent || 0)}
              </span>
            </div>
            <span className="text-sm text-gray-600">Time Spent</span>
          </div>
        </div>
      </motion.div>

      {/* Achievement Badges */}
      {results.score >= 70 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Achievements Earned</h3>
          <div className="flex flex-wrap gap-3">
            {results.score === 100 && (
              <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Perfect Score</span>
              </div>
            )}
            {results.score >= 90 && (
              <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                <Star className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Quiz Master</span>
              </div>
            )}
            {(quiz.timeSpent || 0) < 300 && results.score >= 80 && (
              <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Speed Reader</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Question Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Review Your Answers</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {results.results.map((result, index) => {
            const question = questions[result.questionIndex];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-lg border ${
                  result.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      Q{index + 1}: {question.question}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">
                        Your answer: <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {result.userAnswer}
                        </span>
                      </p>
                      {!result.isCorrect && (
                        <p className="text-gray-600">
                          Correct answer: <span className="text-green-700">
                            {question.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                    {!result.isCorrect && (
                      <p className="text-xs text-gray-500 italic">
                        {result.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          <span>Continue Reading</span>
        </button>
        
        <div className="flex items-center space-x-3">
          {results.score < 80 && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retake Quiz
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {results.score >= 80 ? 'Next Chapter' : 'Close'}
          </button>
        </div>
      </div>

      {/* XP Earned */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"
      >
        <div className="flex items-center justify-center space-x-2">
          <Award className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">
            You earned <span className="font-bold text-orange-600">+{Math.round(results.score * 0.5)} XP</span> for this quiz!
          </span>
        </div>
      </motion.div>
    </div>
  );
}