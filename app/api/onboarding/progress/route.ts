import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
      include: {
        activities: true
      }
    })

    if (!progress) {
      // 새로운 온보딩 진행상황 생성
      const newProgress = await prisma.onboardingProgress.create({
        data: {
          userId: session.user.id,
          currentStep: 'WELCOME',
          completionRate: 0,
          samplesViewed: 0,
          tutorialCompleted: false,
          isCompleted: false
        },
        include: {
          activities: true
        }
      })
      
      return NextResponse.json({
        currentStep: 0,
        completionRate: 0,
        samplesViewed: 0,
        tutorialCompleted: false,
        activities: []
      })
    }

    // OnboardingStep enum을 숫자로 변환
    const stepMapping = {
      'WELCOME': 0,
      'TUTORIAL': 1,
      'SAMPLE_STORIES': 2,
      'PREPARATION': 3,
      'COMMUNITY': 4,
      'COMPLETED': 5
    }

    return NextResponse.json({
      currentStep: stepMapping[progress.currentStep] || 0,
      completionRate: progress.completionRate,
      samplesViewed: progress.samplesViewed,
      tutorialCompleted: progress.tutorialCompleted,
      activities: progress.activities
    })

  } catch (error) {
    console.error('Error fetching onboarding progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stepIndex, completed, activityType, contentId, timeSpent } = await request.json()

    const stepMapping = [
      'WELCOME',
      'TUTORIAL', 
      'SAMPLE_STORIES',
      'PREPARATION',
      'COMMUNITY',
      'COMPLETED'
    ]

    const currentStepEnum = stepMapping[stepIndex] || 'WELCOME'

    // 온보딩 진행상황 업데이트
    const progress = await prisma.onboardingProgress.upsert({
      where: { userId: session.user.id },
      update: {
        currentStep: currentStepEnum as any,
        completionRate: ((stepIndex + 1) / 5) * 100,
        lastActivity: new Date(),
        tutorialCompleted: stepIndex >= 1,
        isCompleted: stepIndex >= 4
      },
      create: {
        userId: session.user.id,
        currentStep: currentStepEnum as any,
        completionRate: ((stepIndex + 1) / 5) * 100,
        samplesViewed: 0,
        tutorialCompleted: stepIndex >= 1,
        isCompleted: stepIndex >= 4
      }
    })

    // 활동 기록 추가
    if (activityType) {
      await prisma.onboardingActivity.create({
        data: {
          progressId: progress.id,
          activityType: activityType as any,
          contentId: contentId || null,
          timeSpent: timeSpent || 0,
          isCompleted: completed || false
        }
      })
    }

    return NextResponse.json({ success: true, progress })

  } catch (error) {
    console.error('Error updating onboarding progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}