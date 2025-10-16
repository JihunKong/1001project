'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { BookOpenIcon, UserGroupIcon, LightBulbIcon, SparklesIcon } from '@heroicons/react/24/solid'

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
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Define role-specific onboarding steps
  const getStepsForRole = useCallback((): OnboardingStep[] => {
    const commonSteps = [
      {
        id: 'welcome',
        title: '1001 Stories에 오신 것을 환영합니다! 🎉',
        description: '전 세계 아이들의 이야기를 발견하고 공유하는 플랫폼입니다.',
        icon: SparklesIcon,
        skipable: false,
        content: (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-soe-green-400 to-soe-green-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 leading-relaxed">
              1001 Stories는 소외된 지역 아이들의 이야기를 세상에 알리고,
              전 세계 교육자와 학습자들을 연결하는 비영리 교육 플랫폼입니다.
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
            title: '책 찾기 📚',
            description: '선생님이 배정한 책이나 관심 있는 책을 쉽게 찾아보세요.',
            icon: BookOpenIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">내 책장에서</h4>
                  <p className="text-blue-800 text-sm">
                    선생님이 나에게 배정한 책들을 확인할 수 있어요.
                    읽기 진도와 완료 상태도 한눈에 볼 수 있답니다.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">라이브러리에서</h4>
                  <p className="text-green-800 text-sm">
                    다른 나라 친구들의 재미있는 이야기들을 탐험해보세요.
                    연령대와 관심사에 맞는 책들을 추천해드려요.
                  </p>
                </div>
              </div>
            )
          },
          {
            id: 'reading-tools',
            title: '읽기 도우미 💡',
            description: '어려운 단어가 있으면 클릭해서 설명을 들어보세요.',
            icon: LightBulbIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300 transition-colors">
                      어려운 단어
                    </span>를 클릭하면 뜻을 알려드려요!
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-purple-600 font-semibold">🎧</div>
                    <div className="text-xs text-purple-800 mt-1">음성으로 듣기</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-orange-600 font-semibold">🤖</div>
                    <div className="text-xs text-orange-800 mt-1">AI 도우미</div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'progress-tracking',
            title: '읽기 진도 확인 📈',
            description: '내가 얼마나 읽었는지, 어떤 책을 완료했는지 확인해보세요.',
            icon: UserGroupIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">이번 주 읽기 목표</span>
                    <span className="text-xs text-gray-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  읽기 진도를 확인하고, 완료한 책에 대한 성취감을 느껴보세요.
                  친구들과 읽기 기록을 비교해볼 수도 있어요!
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
            title: '클래스 만들기 🏫',
            description: '학생들을 위한 클래스를 만들고 초대 코드를 공유하세요.',
            icon: UserGroupIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 mb-2">간단한 클래스 생성</h4>
                  <p className="text-indigo-800 text-sm mb-3">
                    클래스 이름과 과목을 입력하면 6자리 초대 코드가 생성돼요.
                  </p>
                  <div className="bg-white p-2 rounded border-2 border-indigo-200 text-center">
                    <span className="text-2xl font-mono font-bold text-indigo-600">ABC123</span>
                    <p className="text-xs text-indigo-500 mt-1">클래스 초대 코드</p>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'assign-books',
            title: '책 배정하기 📖',
            description: '학생들의 수준에 맞는 책을 선택해서 배정하세요.',
            icon: BookOpenIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-green-600 font-semibold mb-1">개별 배정</div>
                    <div className="text-xs text-green-700">학생별 수준에 맞게</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-blue-600 font-semibold mb-1">일괄 배정</div>
                    <div className="text-xs text-blue-700">전체 클래스에게</div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    💡 <strong>팁:</strong> 학생들의 읽기 수준과 관심사를 고려해서
                    적절한 난이도의 책을 선택해주세요.
                  </p>
                </div>
              </div>
            )
          },
          {
            id: 'monitor-progress',
            title: '진도 모니터링 📊',
            description: '학생들의 읽기 진도와 이해도를 실시간으로 확인하세요.',
            icon: LightBulbIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">클래스 대시보드</h4>
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
            title: '이야기 작성 가이드 ✍️',
            description: '아이들에게 적합한 내용으로 이야기를 작성해주세요.',
            icon: BookOpenIcon,
            skipable: true,
            content: (
              <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-rose-900 mb-2">작성 가이드라인</h4>
                  <ul className="text-rose-800 text-sm space-y-1">
                    <li>• 교육적이고 긍정적인 메시지 포함</li>
                    <li>• 연령대에 적합한 언어 사용</li>
                    <li>• 문화적 다양성 존중</li>
                    <li>• 500-2000자 권장 분량</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-800 text-sm">
                    💚 여러분의 이야기는 전 세계 아이들에게
                    새로운 시각과 감동을 전해줄 소중한 선물이 됩니다.
                  </p>
                </div>
              </div>
            )
          },
          {
            id: 'submission-process',
            title: '제출 과정 📝',
            description: '작성한 이야기가 출간되기까지의 과정을 알아보세요.',
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
                        <h5 className="font-semibold text-gray-800">이야기 제출</h5>
                        <p className="text-sm text-gray-600">텍스트 에디터로 작성</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold relative z-10">
                        2
                      </div>
                      <div className="ml-4">
                        <h5 className="font-semibold text-gray-800">내용 검토</h5>
                        <p className="text-sm text-gray-600">스토리 매니저 검토</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold relative z-10">
                        3
                      </div>
                      <div className="ml-4">
                        <h5 className="font-semibold text-gray-800">출간 승인</h5>
                        <p className="text-sm text-gray-600">최종 검토 후 출간</p>
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
  }, [userRole])

  const steps = getStepsForRole()
  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    if (onSkip) {
      setIsVisible(false)
      setTimeout(() => {
        onSkip()
      }, 300)
    }
  }

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
  }, [currentStep, isLastStep, isVisible])

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
                aria-label="온보딩 건너뛰기"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>진행률</span>
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
                aria-label={`온보딩 진행률: ${Math.round(((currentStep + 1) / steps.length) * 100)}%`}
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
            aria-label="이전 단계"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>이전</span>
          </button>

          <div className="flex space-x-3">
            {currentStepData.skipable && !isLastStep && (
              <button
                onClick={() => setCurrentStep(steps.length - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                건너뛰기
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
              aria-label={isLastStep ? '온보딩 완료' : '다음 단계'}
            >
              <span>{isLastStep ? '시작하기' : '다음'}</span>
              {!isLastStep && <ChevronRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded-lg">
        <div>← → 이동 | Enter 다음 | Esc 닫기</div>
      </div>
    </div>
  )
}