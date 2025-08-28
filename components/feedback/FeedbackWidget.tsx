"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, MessageCircle, Star, Send, AlertTriangle, Lightbulb, Bug } from 'lucide-react'

interface FeedbackWidgetProps {
  page?: string
  trigger?: 'manual' | 'auto' | 'exit-intent'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  onClose?: () => void
  className?: string
}

interface FeedbackData {
  feedbackType: string
  category: string
  rating?: number
  title?: string
  message: string
  page?: string
  userRole?: string
  previousRole?: string
  migrationDate?: string
  sessionDuration?: number
  clickPath?: any[]
  scrollBehavior?: any
  timeOnPage?: number
  exitIntent?: boolean
  bugReport?: boolean
  severity?: string
  screenshotUrl?: string
}

export default function FeedbackWidget({ 
  page, 
  trigger = 'manual', 
  position = 'bottom-right',
  onClose,
  className 
}: FeedbackWidgetProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState<'type' | 'details' | 'rating'>('type')
  
  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<string>('')
  const [rating, setRating] = useState<number>(0)
  const [title, setTitle] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [severity, setSeverity] = useState<string>('LOW')
  
  // Session tracking
  const [sessionStart] = useState<number>(Date.now())
  const [clickPath, setClickPath] = useState<any[]>([])
  const [scrollBehavior, setScrollBehavior] = useState<any>({})
  
  // Track user interactions
  useEffect(() => {
    const trackClick = (e: MouseEvent) => {
      setClickPath(prev => [...prev, {
        timestamp: Date.now(),
        x: e.clientX,
        y: e.clientY,
        target: (e.target as HTMLElement)?.tagName,
        className: (e.target as HTMLElement)?.className
      }].slice(-20)) // Keep last 20 clicks
    }
    
    const trackScroll = () => {
      setScrollBehavior({
        scrollTop: window.scrollY,
        scrollHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        timestamp: Date.now()
      })
    }
    
    document.addEventListener('click', trackClick)
    document.addEventListener('scroll', trackScroll)
    
    return () => {
      document.removeEventListener('click', trackClick)
      document.removeEventListener('scroll', trackScroll)
    }
  }, [])
  
  // Auto-trigger on exit intent
  useEffect(() => {
    if (trigger === 'exit-intent') {
      const handleExitIntent = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          setIsOpen(true)
        }
      }
      
      document.addEventListener('mouseout', handleExitIntent)
      return () => document.removeEventListener('mouseout', handleExitIntent)
    }
  }, [trigger])
  
  const feedbackTypes = [
    {
      id: 'GENERAL',
      label: 'General Feedback',
      icon: MessageCircle,
      description: 'Share your thoughts about the platform'
    },
    {
      id: 'BUG_REPORT',
      label: 'Bug Report',
      icon: Bug,
      description: 'Report a technical issue or error'
    },
    {
      id: 'FEATURE_REQUEST',
      label: 'Feature Request',
      icon: Lightbulb,
      description: 'Suggest a new feature or improvement'
    },
    {
      id: 'ROLE_MIGRATION',
      label: 'Role Changes',
      icon: AlertTriangle,
      description: 'Feedback about role system changes'
    },
    {
      id: 'UI_UX_ISSUE',
      label: 'Design Issue',
      icon: Star,
      description: 'Report a usability or design problem'
    }
  ]
  
  const handleSubmit = async () => {
    if (!message.trim()) return
    
    setIsSubmitting(true)
    
    const feedbackData: FeedbackData = {
      feedbackType,
      category: feedbackType === 'BUG_REPORT' ? 'TECHNICAL_ISSUE' : 'UX_FEEDBACK',
      rating: rating || undefined,
      title: title.trim() || undefined,
      message: message.trim(),
      page: page || window.location.pathname,
      userRole: session?.user?.role,
      sessionDuration: Math.floor((Date.now() - sessionStart) / 1000),
      clickPath: clickPath.length > 0 ? clickPath : undefined,
      scrollBehavior,
      timeOnPage: Math.floor((Date.now() - sessionStart) / 1000),
      exitIntent: trigger === 'exit-intent',
      bugReport: feedbackType === 'BUG_REPORT',
      severity: feedbackType === 'BUG_REPORT' ? severity : undefined
    }
    
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })
      
      if (response.ok) {
        setSubmitted(true)
        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose()
        }, 3000)
      } else {
        console.error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleClose = () => {
    setIsOpen(false)
    setCurrentStep('type')
    setFeedbackType('')
    setRating(0)
    setTitle('')
    setMessage('')
    setSeverity('LOW')
    setSubmitted(false)
    onClose?.()
  }
  
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }
  
  if (submitted) {
    return (
      <div className={`fixed ${positionStyles[position]} z-50 ${className}`}>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Thank you!</h4>
              <p className="text-sm">Your feedback has been submitted.</p>
            </div>
            <button onClick={handleClose} className="text-white hover:text-green-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionStyles[position]} z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${className}`}
        aria-label="Give feedback"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }
  
  return (
    <div className={`fixed ${positionStyles[position]} z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl border w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Feedback</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {currentStep === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">What type of feedback would you like to share?</p>
              
              {feedbackTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setFeedbackType(type.id)
                      if (type.id === 'GENERAL') {
                        setCurrentStep('rating')
                      } else {
                        setCurrentStep('details')
                      }
                    }}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          
          {currentStep === 'rating' && feedbackType === 'GENERAL' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">How would you rate your overall experience?</p>
              
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
              
              {rating > 0 && (
                <button
                  onClick={() => setCurrentStep('details')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          )}
          
          {currentStep === 'details' && (
            <div className="space-y-4">
              {rating === 0 && feedbackType !== 'GENERAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the issue"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your feedback *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    feedbackType === 'ROLE_MIGRATION' 
                      ? 'How has the role system change affected your experience?'
                      : feedbackType === 'BUG_REPORT'
                      ? 'Please describe the issue and how to reproduce it...'
                      : 'Please share your feedback...'
                  }
                />
              </div>
              
              {feedbackType === 'BUG_REPORT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low - Minor issue</option>
                    <option value="MEDIUM">Medium - Affects usability</option>
                    <option value="HIGH">High - Prevents task completion</option>
                    <option value="CRITICAL">Critical - System unusable</option>
                  </select>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(rating > 0 ? 'rating' : 'type')}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}