import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/library/bookmarks/[id]
 * 
 * Check if user has bookmarked a specific story
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

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId: storyId
        }
      }
    })

    return NextResponse.json({
      bookmarked: !!bookmark
    })

  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/library/bookmarks/[id]
 * 
 * Add a story to user's bookmarks
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

    const storyId = id

    // Verify story exists
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

    // Create bookmark (ignore if already exists)
    await prisma.bookmark.upsert({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId: storyId
        }
      },
      create: {
        userId: session.user.id,
        storyId: storyId,
        note: ''
      },
      update: {
        // Just update the timestamp
        updatedAt: new Date()
      }
    })

    // Log activity for analytics
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'STORY_BOOKMARKED',
        entity: 'STORY',
        entityId: storyId,
        metadata: {
          storyTitle: story.title,
          storyAuthor: story.authorName
        }
      }
    }).catch(() => {}) // Fail silently for analytics

    return NextResponse.json({
      success: true,
      message: 'Story bookmarked successfully'
    })

  } catch (error) {
    console.error('Error bookmarking story:', error)
    return NextResponse.json(
      { error: 'Failed to bookmark story' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/library/bookmarks/[id]
 * 
 * Remove a story from user's bookmarks
 */
export async function DELETE(
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

    // Remove bookmark
    const deletedBookmark = await prisma.bookmark.delete({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId: storyId
        }
      }
    }).catch(() => null) // Ignore if doesn't exist

    if (!deletedBookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Log activity for analytics
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'STORY_UNBOOKMARKED',
        entity: 'STORY',
        entityId: storyId,
        metadata: {}
      }
    }).catch(() => {}) // Fail silently for analytics

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully'
    })

  } catch (error) {
    console.error('Error removing bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    )
  }
}