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

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        onboardingProgress: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 사용자 승인 상태 결정 로직
    // 실제로는 더 복잡한 승인 프로세스가 있을 것입니다.
    const getApprovalStatus = () => {
      // 관리자나 기존 승인된 사용자는 즉시 승인
      if (user.role === 'ADMIN' || user.emailVerified) {
        return {
          status: 'approved',
          message: '승인이 완료되었습니다!',
          estimatedTime: 0,
          canAccess: true
        }
      }

      // 신규 사용자는 대기 상태
      const createdAt = new Date(user.createdAt)
      const now = new Date()
      const hoursPassed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))

      if (hoursPassed < 48) {
        return {
          status: 'pending',
          message: '신청서를 검토 중입니다.',
          estimatedTime: Math.max(0, 48 - hoursPassed),
          canAccess: false
        }
      }

      // 48시간 후에는 자동 승인 (데모 목적)
      return {
        status: 'approved',
        message: '승인이 완료되었습니다!',
        estimatedTime: 0,
        canAccess: true
      }
    }

    const approvalStatus = getApprovalStatus()

    // 환영 메시지 선택
    const getWelcomeMessage = (status: string) => {
      const messages = {
        pending: [
          '환영합니다! 승인을 기다리는 동안 샘플 스토리를 즐겨보세요.',
          '1001 Stories에 오신 것을 환영합니다. 귀하의 신청을 검토 중이며, 그동안 플랫폼을 미리 체험하실 수 있습니다.',
          '곧 시작됩니다! 준비하는 동안 무료 콘텐츠를 확인해보세요.'
        ],
        approved: [
          '축하합니다! 이제 모든 기능을 사용하실 수 있습니다.',
          '승인이 완료되었습니다. 1001 Stories의 모든 스토리를 만나보세요.',
          '환영합니다! 전체 라이브러리에 액세스할 수 있습니다.'
        ],
        rejected: [
          '죄송합니다. 현재 승인이 어려운 상황입니다.',
          '추가 정보가 필요합니다. 지원팀에 문의해주세요.',
          '재신청을 원하시면 프로필을 업데이트해주세요.'
        ]
      }
      
      const messageArray = messages[status as keyof typeof messages] || messages.pending
      return messageArray[Math.floor(Math.random() * messageArray.length)]
    }

    const responseData = {
      ...approvalStatus,
      welcomeMessage: getWelcomeMessage(approvalStatus.status),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      onboardingProgress: user.onboardingProgress ? {
        currentStep: user.onboardingProgress.currentStep,
        completionRate: user.onboardingProgress.completionRate,
        samplesViewed: user.onboardingProgress.samplesViewed,
        tutorialCompleted: user.onboardingProgress.tutorialCompleted
      } : null
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}