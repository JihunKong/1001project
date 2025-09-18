'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  X, 
  Clock, 
  Award,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { generateQuiz, submitQuiz } from '@/lib/api/learning-api';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import type { Quiz, QuizQuestion as QuizQuestionType } from '@/types/learning';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookText: string;
  onComplete?: () => void;
}

export function QuizModal({ 
  isOpen, 
  onClose, 
  bookId, 
  bookText,
  onComplete 
}: QuizModalProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const { addQuizScore } = useLearningStore();

  useEffect(() => {
    if (isOpen && !quiz) {
      loadQuiz();
    }
  }, [isOpen, bookId]);

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await generateQuiz(bookId, bookText);
      if (response.success && response.data) {
        setQuiz(response.data);
        setStartTime(new Date());
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz || Object.keys(answers).length < quiz.totalQuestions) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitQuiz(quiz.id, answers, timeSpent);
      if (response.success && response.data) {
        setResults(response.data);
        addQuizScore(bookId, response.data.score);
        onComplete?.();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    if (!results && quiz && Object.keys(answers).length > 0) {
      if (!confirm('Are you sure you want to exit? Your progress will be lost.')) {
        return;
      }
    }
    setQuiz(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);
    setTimeSpent(0);
    setStartTime(null);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Comprehension Quiz</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Test your understanding of the reading
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {quiz && !results && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    Question {currentQuestionIndex + 1} of {quiz.totalQuestions}
                  </span>
                  <span className="text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(timeSpent)}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: quiz.totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentQuestionIndex
                          ? 'bg-white'
                          : answers[i]
                          ? 'bg-white/60'
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mb-4" />
                <p className="text-gray-600">Generating quiz questions...</p>
              </div>
            ) : results ? (
              <QuizResults
                results={results}
                quiz={quiz!}
                onClose={handleClose}
              />
            ) : quiz ? (
              <div>
                <QuizQuestion
                  question={(quiz.questions as QuizQuestionType[])[currentQuestionIndex]}
                  questionIndex={currentQuestionIndex}
                  selectedAnswer={answers[currentQuestionIndex]}
                  onAnswerSelect={handleAnswerSelect}
                />
                
                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>
                  
                  {currentQuestionIndex === quiz.totalQuestions - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || Object.keys(answers).length < quiz.totalQuestions}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Submit Quiz</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Failed to load quiz. Please try again.</p>
                <button
                  onClick={loadQuiz}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}