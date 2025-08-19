import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/library/stories/[id]/preview
 * 
 * Tracks preview access for analytics and potential conversion tracking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const storyId = id
    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => ({}))
    
    const {
      timeSpent = 0,
      scrollPercentage = 0,
      source = 'library'
    } = body
    
    // Verify story exists and is published
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        isPublished: true,
        author: {
          deletedAt: null
        }
      },
      select: {
        id: true,
        title: true,
        isPremium: true,
        price: true
      }
    })
    
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    // Get client information
    const userAgent = request.headers.get('user-agent')
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    // Create preview tracking record
    const previewData = {
      storyId,
      userId: session?.user?.id || null,
      sessionId: session?.user?.id ? null : `anon_${Date.now()}_${Math.random()}`,
      timeSpent,
      scrollPercentage,
      source,
      userAgent,
      ipAddress,
      metadata: {
        storyTitle: story.title,
        isPremium: story.isPremium,
        price: story.price,
        timestamp: new Date().toISOString()
      }
    }
    
    // Log the preview access
    if (session?.user?.id) {
      // For authenticated users, also create activity log
      await Promise.all([
        prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'STORY_PREVIEW',
            entity: 'STORY',
            entityId: storyId,
            metadata: previewData
          }
        }),
        // Could add a separate PreviewTracking model for more detailed analytics
        // prisma.previewTracking.create({ data: previewData })
      ])
    } else {
      // For anonymous users, just log to activity (or separate analytics service)
      // This is a placeholder - in production you might want to use a separate analytics service
      console.log('Anonymous preview:', previewData)
    }
    
    // Check if user has reached a conversion trigger threshold
    const shouldShowUpgrade = shouldTriggerUpgradePrompt(timeSpent, scrollPercentage, story.isPremium)
    
    let upgradePrompt = null
    if (shouldShowUpgrade && story.isPremium) {
      upgradePrompt = {
        type: 'subscription',
        message: 'You\'ve reached the end of the preview. Unlock the full story!',
        cta: {
          primary: 'Subscribe for unlimited reading',
          secondary: `Buy this story for $${story.price}`
        },
        benefits: [
          'Access to all premium stories',
          'Offline reading capability',
          'No ads',
          'Support young authors worldwide'
        ]
      }
    }
    
    return NextResponse.json({
      success: true,
      tracked: true,
      story: {
        id: story.id,
        title: story.title,
        isPremium: story.isPremium
      },
      upgradePrompt
    })
    
  } catch (error) {
    console.error('Error tracking preview:', error)
    return NextResponse.json(
      { error: 'Failed to track preview' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to determine if upgrade prompt should be shown
 */
function shouldTriggerUpgradePrompt(
  timeSpent: number, 
  scrollPercentage: number, 
  isPremium: boolean
): boolean {
  if (!isPremium) return false
  
  // Show upgrade prompt if user spent significant time AND scrolled to the end of preview
  const significantTime = timeSpent > 120 // 2 minutes
  const reachedEnd = scrollPercentage > 90 // 90% scroll
  
  return significantTime && reachedEnd
}