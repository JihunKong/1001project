'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
}

interface WelcomeMessage {
  type: 'brief' | 'friendly' | 'formal'
  content: string
}

export default function OnboardingZone() {
  const { data: session } = useSession()
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [welcomeMessage, setWelcomeMessage] = useState<WelcomeMessage | null>(null)
  
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '환영합니다',
      description: '1001 Stories 플랫폼에 오신 것을 환영합니다',
      completed: false
    },
    {
      id: 'tutorial',
      title: '플랫폼 투어',
      description: '주요 기능들을 둘러보세요',
      completed: false
    },
    {
      id: 'samples',
      title: '샘플 스토리',
      description: '3개의 무료 스토리를 체험해보세요',
      completed: false
    },
    {
      id: 'preparation',
      title: '수업 준비',
      description: '교육 자료를 미리 확인하세요',
      completed: false
    },
    {
      id: 'community',
      title: '커뮤니티',
      description: '다른 사용자들과 소통하세요',
      completed: false
    }
  ]

  const welcomeMessages: WelcomeMessage[] = [
    { type: 'brief', content: '환영합니다! 곧 시작됩니다.' },
    { type: 'friendly', content: '안녕하세요! 승인을 기다리는 동안 샘플 스토리를 즐겨보세요.' },
    { type: 'formal', content: '1001 Stories에 오신 것을 환영합니다. 귀하의 신청을 검토 중이며, 그동안 플랫폼을 미리 체험하실 수 있습니다.' }
  ]

  useEffect(() => {
    // 세션이 없으면 로그인 페이지로 이동
    if (!session) {
      router.push('/login?callbackUrl=/onboarding')
      return
    }

    // 랜덤한 환영 메시지 선택
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
    setWelcomeMessage(randomMessage)
    
    // 온보딩 진행상황 로드
    loadOnboardingProgress()
  }, [session, router])

  const loadOnboardingProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/progress')
      if (response.ok) {
        const data = await response.json()
        setProgress(data.completionRate || 0)
        setCurrentStep(data.currentStep || 0)
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
    }
  }

  const handleStepComplete = async (stepIndex: number) => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepIndex,
          completed: true
        }),
      })

      if (response.ok) {
        const newProgress = ((stepIndex + 1) / steps.length) * 100
        setProgress(newProgress)
        setCurrentStep(stepIndex + 1)
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleSampleStoryClick = (storyId: string) => {
    // 샘플 스토리 접근 추적
    fetch('/api/onboarding/sample-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storyId }),
    })

    // 샘플 스토리 페이지로 이동
    router.push(`/onboarding/sample/${storyId}`)
  }

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">로딩 중...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            온보딩 존
          </h1>
          {welcomeMessage && (
            <p className="text-lg text-gray-600 bg-white p-4 rounded-lg shadow-sm max-w-2xl mx-auto">
              {welcomeMessage.content}
            </p>
          )}
        </div>

        {/* 진행률 바 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              진행률
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 온보딩 단계 */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-6 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer
                ${index === currentStep 
                  ? 'bg-blue-500 text-white transform scale-105' 
                  : index < currentStep 
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-white text-gray-700'
                }`}
              onClick={() => {
                if (index === currentStep) {
                  handleStepComplete(index)
                }
              }}
            >
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3
                  ${index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep
                      ? 'bg-white text-blue-500'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
              </div>
              <p className="text-sm opacity-90">{step.description}</p>
            </div>
          ))}
        </div>

        {/* 샘플 스토리 섹션 */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            샘플 스토리 체험
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'kamala', title: '카말라의 꿈', description: '네팔 소녀의 교육에 대한 열망' },
              { id: 'inventor', title: '미래의 발명가', description: '작은 마을 소년의 큰 꿈' },
              { id: 'bridge', title: '우정의 다리', description: '서로 다른 문화를 연결하는 이야기' }
            ].map((story) => (
              <div
                key={story.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSampleStoryClick(story.id)}
              >
                <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white text-4xl">📚</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{story.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{story.description}</p>
                <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
                  읽어보기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 예상 승인 시간 */}
        <div className="max-w-2xl mx-auto mt-12 text-center bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            승인 상태
          </h3>
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">검토 중</span>
          </div>
          <p className="text-sm text-gray-500">
            예상 승인 시간: 24-48시간
          </p>
        </div>
      </div>
    </div>
  )
}