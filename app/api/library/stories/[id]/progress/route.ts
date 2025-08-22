import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/library/stories/[id]/progress
 * 
 * Update user's reading progress for a specific story
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPage, percentComplete, totalPages, timeSpent } = body

    if (!currentPage || percentComplete === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: currentPage and percentComplete' },
        { status: 400 }
      )
    }

    const storyId = id

    // Verify story exists and user has access
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        isPublished: true,
        author: {
          deletedAt: null
        }
      }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Check user access (premium content requires subscription/purchase)
    if (story.isPremium) {
      const userSubscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          canAccessPremium: true,
          status: true
        }
      })

      // TODO: Check individual purchases from Order/Entitlement models
      const hasAccess = userSubscription?.canAccessPremium && userSubscription?.status === 'ACTIVE'
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied. Premium content requires subscription.' },
          { status: 403 }
        )
      }
    }

    // Upsert reading progress
    const readingProgress = await prisma.readingProgress.upsert({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId: storyId
        }
      },
      create: {
        userId: session.user.id,
        storyId: storyId,
        currentPage,
        totalPages,
        percentComplete: Math.min(100, Math.max(0, percentComplete)),
        totalReadingTime: timeSpent || 0,
        lastReadAt: new Date(),
        isCompleted: percentComplete >= 95
      },
      update: {
        currentPage,
        totalPages,
        percentComplete: Math.min(100, Math.max(0, percentComplete)),
        totalReadingTime: timeSpent || 0,
        lastReadAt: new Date(),
        isCompleted: percentComplete >= 95
      }
    })

    // Award achievement for first completion
    if (readingProgress.isCompleted && readingProgress.percentComplete < 95) {
      // TODO: Implement achievement system
      console.log('User completed their first story!')
    }

    // Log activity for analytics
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'READING_PROGRESS_UPDATED',
        entity: 'STORY',
        entityId: storyId,
        metadata: {
          currentPage,
          percentComplete,
          totalPages,
          timeSpent: timeSpent || 0,
          isCompleted: percentComplete >= 95
        }
      }
    }).catch(() => {}) // Fail silently for analytics

    return NextResponse.json({
      success: true,
      progress: {
        currentPage: readingProgress.currentPage,
        percentComplete: readingProgress.percentComplete,
        totalPages: readingProgress.totalPages,
        totalReadingTime: readingProgress.totalReadingTime,
        lastReadAt: readingProgress.lastReadAt,
        isCompleted: readingProgress.isCompleted
      }
    })

  } catch (error) {
    console.error('Error updating reading progress:', error)
    return NextResponse.json(
      { error: 'Failed to update reading progress' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/library/stories/[id]/progress
 * 
 * Get user's reading progress for a specific story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const storyId = id

    const readingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId: storyId
        }
      }
    })

    if (!readingProgress) {
      return NextResponse.json({
        progress: null
      })
    }

    return NextResponse.json({
      progress: {
        currentPage: readingProgress.currentPage,
        percentComplete: readingProgress.percentComplete,
        totalPages: readingProgress.totalPages,
        totalReadingTime: readingProgress.totalReadingTime,
        lastReadAt: readingProgress.lastReadAt,
        isCompleted: readingProgress.isCompleted
      }
    })

  } catch (error) {
    console.error('Error fetching reading progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading progress' },
      { status: 500 }
    )
  }
}