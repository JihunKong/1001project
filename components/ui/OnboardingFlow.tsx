'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { BookOpenIcon, UserGroupIcon, LightBulbIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  skipable?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface OnboardingFlowProps {
  userRole: 'LEARNER' | 'TEACHER' | 'WRITER' | 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN' | 'ADMIN'
  onComplete: () => void
  onSkip?: () => void
}

export default function OnboardingFlow({ userRole, onComplete, onSkip }: OnboardingFlowProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Define role-specific onboarding steps
  const getStepsForRole = useCallback((): OnboardingStep[] => {
    const commonSteps = [
      {
        id: 'welcome',
        title: t('onboarding.welcome.title'),
        description: t('onboarding.welcome.description'),
        icon: SparklesIcon,
        skipable: false,
        content: (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-soe-green-400 to-soe-green-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 leading-relaxed">
              {t('onboarding.welcome.content')}
            </p>
          </div>
        )
      }
    ]

    switch (userRole) {
      case 'LEARNER':
        return [
          ...commonSteps,
          {
            id: 'find-books',
            title: t('onboarding.learner.findBooks.title'),
            description: t('onboarding.learner.findBooks.description'),
            icon: BookOpenIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('onboarding.learner.myBookshelf.title')}</h4>
                  <p className="text-blue-800 text-sm">
                    {t('onboarding.learner.myBookshelf.content')}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">{t('onboarding.learner.library.title')}</h4>
                  <p className="text-green-800 text-sm">
                    {t('onboarding.learner.library.content')}
                  </p>
                </div>
              </div>
            )
          },
          {
            id: 'reading-tools',
            title: t('onboarding.learner.readingTools.title'),
            description: t('onboarding.learner.readingTools.description'),
            icon: LightBulbIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300 transition-colors">
                      {t('onboarding.learner.readingTools.difficultWord')}
                    </span>{t('onboarding.learner.readingTools.clickHelp')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-purple-600 font-semibold">🎧</div>
                    <div className="text-xs text-purple-800 mt-1">{t('onboarding.learner.readingTools.audioListen')}</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-orange-600 font-semibold">🤖</div>
                    <div className="text-xs text-orange-800 mt-1">{t('onboarding.learner.readingTools.aiHelper')}</div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'progress-tracking',
            title: t('onboarding.learner.progressTracking.title'),
            description: t('onboarding.learner.progressTracking.description'),
            icon: UserGroupIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('onboarding.learner.progressTracking.weeklyGoal')}</span>
                    <span className="text-xs text-gray-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t('onboarding.learner.progressTracking.content')}
                </p>
              </div>
            )
          }
        ]

      case 'TEACHER':
        return [
          ...commonSteps,
          {
            id: 'create-class',
            title: t('onboarding.teacher.createClass.title'),
            description: t('onboarding.teacher.createClass.description'),
            icon: UserGroupIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 mb-2">{t('onboarding.teacher.createClass.simple')}</h4>
                  <p className="text-indigo-800 text-sm mb-3">
                    {t('onboarding.teacher.createClass.content')}
                  </p>
                  <div className="bg-white p-2 rounded border-2 border-indigo-200 text-center">
                    <span className="text-2xl font-mono font-bold text-indigo-600">ABC123</span>
                    <p className="text-xs text-indigo-500 mt-1">{t('onboarding.teacher.createClass.inviteCode')}</p>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'assign-books',
            title: t('onboarding.teacher.assignBooks.title'),
            description: t('onboarding.teacher.assignBooks.description'),
            icon: BookOpenIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-green-600 font-semibold mb-1">{t('onboarding.teacher.assignBooks.individual')}</div>
                    <div className="text-xs text-green-700">{t('onboarding.teacher.assignBooks.individualDesc')}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-blue-600 font-semibold mb-1">{t('onboarding.teacher.assignBooks.batch')}</div>
                    <div className="text-xs text-blue-700">{t('onboarding.teacher.assignBooks.batchDesc')}</div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-yellow-800 text-sm" dangerouslySetInnerHTML={{ __html: t('onboarding.teacher.assignBooks.tip') }} />
                </div>
              </div>
            )
          },
          {
            id: 'monitor-progress',
            title: t('onboarding.teacher.monitorProgress.title'),
            description: t('onboarding.teacher.monitorProgress.description'),
            icon: LightBulbIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">{t('onboarding.teacher.monitorProgress.dashboard')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">김민수</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '80%'}}></div>
                        </div>
                        <span className="text-xs text-gray-600">80%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">이영희</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div>
                        </div>
                        <span className="text-xs text-gray-600">45%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]

      case 'WRITER':
        return [
          ...commonSteps,
          {
            id: 'story-guidelines',
            title: t('onboarding.writer.storyGuidelines.title'),
            description: t('onboarding.writer.storyGuidelines.description'),
            icon: BookOpenIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-rose-900 mb-2">{t('onboarding.writer.storyGuidelines.header')}</h4>
                  <ul className="text-rose-800 text-sm space-y-1">
                    <li>{t('onboarding.writer.storyGuidelines.educational')}</li>
                    <li>{t('onboarding.writer.storyGuidelines.ageAppropriate')}</li>
                    <li>{t('onboarding.writer.storyGuidelines.cultural')}</li>
                    <li>{t('onboarding.writer.storyGuidelines.wordCount')}</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-800 text-sm">
                    {t('onboarding.writer.storyGuidelines.impact')}
                  </p>
                </div>
              </div>
            )
          },
          {
            id: 'submission-process',
            title: t('onboarding.writer.submissionProcess.title'),
            description: t('onboarding.writer.submissionProcess.description'),
            icon: LightBulbIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300"></div>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold relative z-10">
                        1
                      </div>
                      <div className="ml-4">
                        <h5 className="font-semibold text-gray-800">{t('onboarding.writer.submissionProcess.step1')}</h5>
                        <p className="text-sm text-gray-600">{t('onboarding.writer.submissionProcess.step1Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold relative z-10">
                        2
                      </div>
                      <div className="ml-4">
                        <h5 className="font-semibold text-gray-800">{t('onboarding.writer.submissionProcess.step2')}</h5>
                        <p className="text-sm text-gray-600">{t('onboarding.writer.submissionProcess.step2Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold relative z-10">
                        3
                      </div>
                      <div className="ml-4">
                        <h5 className="font-semibold text-gray-800">{t('onboarding.writer.submissionProcess.step3')}</h5>
                        <p className="text-sm text-gray-600">{t('onboarding.writer.submissionProcess.step3Desc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]

      default:
        return commonSteps
    }
  }, [userRole, t])

  const steps = getStepsForRole()
  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleComplete = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300)
  }, [onComplete])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep, handleComplete])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    if (onSkip) {
      setIsVisible(false)
      setTimeout(() => {
        onSkip()
      }, 300)
    }
  }, [onSkip])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return

      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
          event.preventDefault()
          handleNext()
          break
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'Escape':
          event.preventDefault()
          handleSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, isLastStep, isVisible, handleNext, handlePrevious, handleSkip])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className={`
          bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden
          transform transition-all duration-300 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-soe-green-500 to-soe-green-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <currentStepData.icon className="w-8 h-8" />
              <div>
                <h2 id="onboarding-title" className="text-xl font-bold">
                  {currentStepData.title}
                </h2>
                <p id="onboarding-description" className="text-soe-green-100 text-sm">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            {onSkip && (
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label={t('onboarding.skipOnboarding')}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>{t('onboarding.progress')}</span>
              <span>{currentStep + 1} / {steps.length}</span>
            </div>
            <div className="w-full bg-soe-green-300 bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                role="progressbar"
                aria-valuenow={(currentStep + 1) / steps.length * 100}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('onboarding.progressAriaLabel', { percent: Math.round(((currentStep + 1) / steps.length) * 100) })}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
              ${currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }
            `}
            aria-label={t('onboarding.previousStep')}
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>{t('onboarding.previous')}</span>
          </button>

          <div className="flex space-x-3">
            {currentStepData.skipable && !isLastStep && (
              <button
                onClick={() => setCurrentStep(steps.length - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                {t('onboarding.skip')}
              </button>
            )}

            <button
              onClick={handleNext}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium
                transition-all transform hover:scale-105 active:scale-95
                ${isLastStep
                  ? 'bg-gradient-to-r from-soe-green-500 to-soe-green-600 text-white shadow-lg'
                  : 'btn-primary'
                }
              `}
              aria-label={isLastStep ? t('onboarding.finish') : t('onboarding.next')}
            >
              <span>{isLastStep ? t('onboarding.start') : t('onboarding.next')}</span>
              {!isLastStep && <ChevronRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded-lg">
        <div>{t('onboarding.keyboardShortcuts')}</div>
      </div>
    </div>
  )
}