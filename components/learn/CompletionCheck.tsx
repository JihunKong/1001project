'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Award, ChevronRight } from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { markAsCompleted } from '@/lib/api/learning-api';
import { XP_REWARDS } from '@/types/learning';

interface CompletionCheckProps {
  bookId: string;
  onComplete?: () => void;
  onQuizStart?: () => void;
}

export function CompletionCheck({ 
  bookId, 
  onComplete,
  onQuizStart 
}: CompletionCheckProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const { progress, markAsCompleted: markComplete, updateXP } = useLearningStore();
  
  const isCompleted = progress?.isCompleted || false;

  const handleComplete = async () => {
    if (isCompleted || isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      const response = await markAsCompleted(bookId);
      
      if (response.success) {
        markComplete();
        updateXP(XP_REWARDS.BOOK_COMPLETED);
        setShowRewards(true);
        onComplete?.();
        
        // Hide rewards after 3 seconds
        setTimeout(() => {
          setShowRewards(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Reading Completion
        </h3>
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {!isCompleted ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Finished reading this book? Mark it as complete to earn XP and unlock the quiz!
          </p>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Mark as Complete</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Book Completed!
                </p>
                <p className="text-xs text-green-700">
                  You earned {XP_REWARDS.BOOK_COMPLETED} XP
                </p>
              </div>
            </div>
          </div>
          
          {onQuizStart && (
            <button
              onClick={onQuizStart}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Take Comprehension Quiz</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* XP Reward Animation */}
      <AnimatePresence>
        {showRewards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-yellow-400 text-yellow-900 font-bold text-2xl px-6 py-3 rounded-full shadow-lg">
              +{XP_REWARDS.BOOK_COMPLETED} XP!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}