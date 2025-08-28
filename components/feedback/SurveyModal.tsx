"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react'

interface SurveyQuestion {
  id: string
  type: 'text' | 'rating' | 'choice' | 'multiChoice' | 'scale' | 'boolean'
  question: string
  required?: boolean
  options?: string[]
  scale?: { min: number; max: number; minLabel?: string; maxLabel?: string }
}

interface Survey {
  id: string
  name: string
  description?: string
  questions: SurveyQuestion[]
  trigger: string
  targetPage?: string
  targetRole?: string[]
  displayType: string
  position: string
  delay: number
}

interface SurveyModalProps {
  survey: Survey
  onClose: () => void
  onComplete: () => void
  className?: string
}

interface Answer {
  questionId: string
  answer: string | string[] | number | boolean
}

export default function SurveyModal({ survey, onClose, onComplete, className }: SurveyModalProps) {
  const { data: session } = useSession()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(Date.now())
  
  const currentQuestion = survey.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0
  
  // Get current answer for the question
  const getCurrentAnswer = () => {
    return answers.find(a => a.questionId === currentQuestion.id)?.answer
  }
  
  // Update answer for current question
  const updateAnswer = (answer: string | string[] | number | boolean) => {
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === currentQuestion.id)
      if (existing >= 0) {
        const newAnswers = [...prev]
        newAnswers[existing] = { questionId: currentQuestion.id, answer }
        return newAnswers
      } else {
        return [...prev, { questionId: currentQuestion.id, answer }]
      }
    })
  }
  
  // Check if current question can proceed
  const canProceed = () => {
    const answer = getCurrentAnswer()
    if (currentQuestion.required) {
      if (currentQuestion.type === 'multiChoice') {
        return Array.isArray(answer) && answer.length > 0
      }
      return answer !== undefined && answer !== '' && answer !== null
    }
    return true
  }
  
  // Handle next question or submit
  const handleNext = async () => {
    if (isLastQuestion) {
      await handleSubmit()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  // Handle previous question
  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }
  
  // Submit survey responses
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const completionTime = Math.floor((Date.now() - startTime) / 1000)
    const responseData = {
      surveyId: survey.id,
      answers: answers.reduce((acc, answer) => {
        acc[answer.questionId] = answer.answer
        return acc
      }, {} as any),
      completionTime,
      isComplete: true,
      userRole: session?.user?.role,
      page: window.location.pathname,
      userAgent: navigator.userAgent
    }
    
    try {
      const response = await fetch('/api/surveys/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      })
      
      if (response.ok) {
        onComplete()
      } else {
        console.error('Failed to submit survey response')
        onClose()
      }
    } catch (error) {
      console.error('Error submitting survey response:', error)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Render question input based on type
  const renderQuestionInput = () => {
    const answer = getCurrentAnswer()
    
    switch (currentQuestion.type) {
      case 'text':
        return (
          <textarea
            value={answer as string || ''}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder="Type your response..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        )
      
      case 'rating':
        const ratingOptions = currentQuestion.options || ['1', '2', '3', '4', '5']
        return (
          <div className="flex justify-center space-x-2">
            {ratingOptions.map((option, index) => (
              <button
                key={option}
                onClick={() => updateAnswer(parseInt(option))}
                className={`w-10 h-10 rounded-full border-2 transition-colors ${
                  answer === parseInt(option)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )
      
      case 'choice':
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => updateAnswer(option)}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  answer === option
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    answer === option ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`} />
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        )
      
      case 'multiChoice':
        const multiAnswers = (answer as string[]) || []
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => {
                  if (multiAnswers.includes(option)) {
                    updateAnswer(multiAnswers.filter(a => a !== option))
                  } else {
                    updateAnswer([...multiAnswers, option])
                  }
                }}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  multiAnswers.includes(option)
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded border-2 transition-colors ${
                    multiAnswers.includes(option) 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {multiAnswers.includes(option) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      </div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        )
      
      case 'scale':
        const scale = currentQuestion.scale || { min: 1, max: 10 }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{scale.minLabel || `${scale.min}`}</span>
              <span>{scale.maxLabel || `${scale.max}`}</span>
            </div>
            <input
              type="range"
              min={scale.min}
              max={scale.max}
              value={answer as number || scale.min}
              onChange={(e) => updateAnswer(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-center">
              <span className="text-lg font-medium text-blue-600">
                {answer || scale.min}
              </span>
            </div>
          </div>
        )
      
      case 'boolean':
        return (
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => updateAnswer(true)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                answer === true
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => updateAnswer(false)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                answer === false
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-gray-300 hover:border-red-400'
              }`}
            >
              No
            </button>
          </div>
        )
      
      default:
        return <div>Unsupported question type</div>
    }
  }
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-medium">{survey.name}</h3>
            {survey.description && (
              <p className="text-sm text-gray-600">{survey.description}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close survey"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
            <span>{Math.round((currentQuestionIndex / survey.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Question content */}
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-lg font-medium mb-4">
              {currentQuestion.question}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            
            {renderQuestionInput()}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isFirstQuestion
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              !canProceed() || isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                {isLastQuestion ? <Send className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span>{isLastQuestion ? 'Submit' : 'Next'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}