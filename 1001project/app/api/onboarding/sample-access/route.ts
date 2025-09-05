import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storyId, timeSpent } = await request.json()

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 })
    }

    // 샘플 콘텐츠 접근 기록 업데이트
    const accessRecord = await prisma.sampleContentAccess.upsert({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId: storyId
        }
      },
      update: {
        viewCount: {
          increment: 1
        },
        totalTimeSpent: {
          increment: timeSpent || 0
        },
        lastAccessed: new Date()
      },
      create: {
        userId: session.user.id,
        storyId: storyId,
        viewCount: 1,
        totalTimeSpent: timeSpent || 0,
        lastAccessed: new Date()
      }
    })

    // 온보딩 진행상황도 업데이트
    await prisma.onboardingProgress.update({
      where: { userId: session.user.id },
      data: {
        samplesViewed: {
          increment: 1
        },
        lastActivity: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      accessRecord,
      message: 'Sample content access recorded'
    })

  } catch (error) {
    console.error('Error recording sample access:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자의 샘플 콘텐츠 접근 기록 조회
    const accessRecords = await prisma.sampleContentAccess.findMany({
      where: { userId: session.user.id },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            summary: true,
            coverImage: true,
            readingTime: true
          }
        }
      },
      orderBy: {
        lastAccessed: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      accessRecords,
      totalViewed: accessRecords.length
    })

  } catch (error) {
    console.error('Error fetching sample access records:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}