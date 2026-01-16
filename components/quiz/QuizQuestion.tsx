'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer?: number;
  explanation?: string;
  isSubmitted: boolean;
  onSelectAnswer: (answerIndex: number) => void;
}

export default function QuizQuestion({
  questionNumber,
  totalQuestions,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  explanation,
  isSubmitted,
  onSelectAnswer,
}: QuizQuestionProps) {
  const getOptionStyle = (index: number) => {
    if (!isSubmitted) {
      if (selectedAnswer === index) {
        return 'border-blue-500 bg-blue-50 ring-2 ring-blue-500';
      }
      return 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50';
    }

    if (index === correctAnswer) {
      return 'border-green-500 bg-green-50';
    }

    if (selectedAnswer === index && index !== correctAnswer) {
      return 'border-red-500 bg-red-50';
    }

    return 'border-gray-200 opacity-60';
  };

  const getIcon = (index: number) => {
    if (!isSubmitted) {
      if (selectedAnswer === index) {
        return <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>;
      }
      return <Circle className="w-5 h-5 text-gray-400" />;
    }

    if (index === correctAnswer) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }

    if (selectedAnswer === index && index !== correctAnswer) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }

    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-blue-600">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < questionNumber ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-6">{question}</h3>

      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isSubmitted && onSelectAnswer(index)}
            disabled={isSubmitted}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${getOptionStyle(index)} ${
              !isSubmitted ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            {getIcon(index)}
            <span className="font-medium text-gray-500 mr-2">
              {optionLabels[index]}.
            </span>
            <span className="flex-1 text-left text-gray-700">{option}</span>
          </button>
        ))}
      </div>

      {isSubmitted && explanation && (
        <div className={`mt-6 p-4 rounded-lg ${
          selectedAnswer === correctAnswer
            ? 'bg-green-50 border border-green-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
          <p className="text-sm text-gray-600">{explanation}</p>
        </div>
      )}
    </div>
  );
}
