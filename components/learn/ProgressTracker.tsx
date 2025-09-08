'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Award,
  BarChart
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import type { LearningProgress } from '@/types/learning';

interface ProgressTrackerProps {
  bookId: string;
  totalPages: number;
  currentPage: number;
  onComplete?: () => void;
}

export function ProgressTracker({ 
  bookId, 
  totalPages, 
  currentPage,
  onComplete 
}: ProgressTrackerProps) {
  const { 
    progress, 
    setProgress, 
    updateProgress,
    markAsCompleted,
    isLoading 
  } = useLearningStore();
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const progressPercentage = Math.min(100, Math.round((currentPage / totalPages) * 100));
  const isCompleted = progressPercentage === 100;

  useEffect(() => {
    // Update progress when page changes
    if (progress?.bookId === bookId && currentPage > (progress.lastPageRead || 0)) {
      updateProgress({
        pagesRead: currentPage,
        lastPageRead: currentPage,
      });
    }
  }, [currentPage, bookId, progress, updateProgress]);

  useEffect(() => {
    // Check for completion
    if (isCompleted && !progress?.isCompleted) {
      setShowCompletionModal(true);
      markAsCompleted();
      onComplete?.();
    }
  }, [isCompleted, progress?.isCompleted, markAsCompleted, onComplete]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <>
      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Reading Progress
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages} pages
          </span>
        </div>
        
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {progressPercentage}% Complete
          </span>
          {isCompleted && (
            <span className="flex items-center text-xs text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Completed!
            </span>
          )}
        </div>
      </div>

      {/* Reading Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-900">
            {formatTime(progress?.readingTime || 0)}
          </div>
          <div className="text-xs text-gray-500">Time Spent</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-900">
            {Math.round((currentPage / Math.max(1, progress?.readingTime || 1)) * 60)} 
          </div>
          <div className="text-xs text-gray-500">Pages/Hour</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <BarChart className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-900">
            {progress?.metrics?.comprehension || 0}%
          </div>
          <div className="text-xs text-gray-500">Comprehension</div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCompletionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Congratulations! 🎉
            </h2>
            <p className="text-gray-600 mb-4">
              You've completed this book! You earned:
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                +200 XP
              </div>
              <div className="text-sm text-blue-700">
                Book Completion Bonus
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Continue Reading
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  // Navigate to quiz
                  window.location.href = `/learn/quiz/${bookId}`;
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Quiz
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}