'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Square, CheckSquare } from 'lucide-react';
import type { QuizQuestion as QuizQuestionType } from '@/types/learning';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionIndex: number;
  selectedAnswer?: string;
  onAnswerSelect: (questionIndex: number, answer: string) => void;
  showResult?: boolean;
}

export function QuizQuestion({
  question,
  questionIndex,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
}: QuizQuestionProps) {
  const handleSelect = (answer: string) => {
    if (!showResult) {
      onAnswerSelect(questionIndex, answer);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = [
      'bg-green-100 text-green-700',
      'bg-blue-100 text-blue-700',
      'bg-yellow-100 text-yellow-700',
      'bg-orange-100 text-orange-700',
      'bg-red-100 text-red-700',
    ];
    return colors[difficulty - 1] || colors[0];
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['Easy', 'Moderate', 'Medium', 'Hard', 'Expert'];
    return labels[difficulty - 1] || labels[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Question Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Question {questionIndex + 1}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(question.difficulty)}`}>
            {getDifficultyLabel(question.difficulty)}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900">
          {question.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = showResult && option === question.correctAnswer;
          const isWrong = showResult && isSelected && !isCorrect;
          
          return (
            <motion.button
              key={index}
              onClick={() => handleSelect(option)}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : isWrong
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white opacity-60'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
              disabled={showResult}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {question.type === 'multiple_choice' ? (
                    isSelected ? (
                      <CheckCircle className={`w-5 h-5 ${
                        showResult
                          ? isCorrect
                            ? 'text-green-500'
                            : 'text-red-500'
                          : 'text-blue-500'
                      }`} />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )
                  ) : (
                    isSelected ? (
                      <CheckSquare className={`w-5 h-5 ${
                        showResult
                          ? isCorrect
                            ? 'text-green-500'
                            : 'text-red-500'
                          : 'text-blue-500'
                      }`} />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )
                  )}
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${
                    showResult
                      ? isCorrect
                        ? 'text-green-700'
                        : isWrong
                        ? 'text-red-700'
                        : 'text-gray-600'
                      : isSelected
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </div>
                {showResult && isCorrect && (
                  <span className="text-green-600 text-sm font-medium">Correct</span>
                )}
                {showResult && isWrong && (
                  <span className="text-red-600 text-sm font-medium">Incorrect</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation (shown after answering) */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
          <p className="text-sm text-blue-700">{question.explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
}