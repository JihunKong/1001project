import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/stories/[id]
 * 
 * Returns detailed story information with appropriate content based on user access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const storyId = id
    const session = await getServerSession(authOptions)
    
    // Get story with related data
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        isPublished: true,
        author: {
          deletedAt: null
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                bio: true,
                location: true
              }
            }
          }
        },
        translations: {
          select: {
            id: true,
            toLanguage: true,
            title: true,
            content: true,
            translatorId: true
          }
        },
        _count: {
          select: {
            readingProgress: true,
            bookmarks: true,
            reviews: true
          }
        }
      }
    })
    
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    // Check user access level
    let accessLevel = 'preview'
    let userSubscription = null
    let userPurchase = null
    let userProgress = null
    
    if (session?.user?.id) {
      // Get user subscription - disabled, all books are free
      userSubscription = null;
      
      // Check for individual purchase (placeholder for now)
      // userPurchase = await prisma.order.findFirst({...})
      
      // Get user reading progress
      userProgress = await prisma.readingProgress.findUnique({
        where: {
          userId_storyId: {
            userId: session.user.id,
            storyId: story.id
          }
        }
      })
      
      // All stories are free - full access
      accessLevel = 'full'
    } else {
      // Non-authenticated users also get full access since everything is free
      accessLevel = 'full'
    }
    
    // Prepare content based on access level
    let content = story.content
    let contentPreview = ''
    
    if (accessLevel === 'preview' && story.content) {
      // Provide first 20% of content as preview
      const previewLength = Math.floor(story.content.length * 0.2)
      contentPreview = story.content.substring(0, previewLength)
      content = '' // Don't send full content
    }
    
    // Update view count
    await prisma.story.update({
      where: { id: storyId },
      data: { viewCount: { increment: 1 } }
    })
    
    // Log access for analytics (optional)
    if (session?.user?.id) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'STORY_VIEWED',
          entity: 'STORY',
          entityId: storyId,
          metadata: {
            accessLevel,
            hasSubscription: !!userSubscription,
            userAgent: request.headers.get('user-agent')
          }
        }
      }).catch(() => {}) // Fail silently for analytics
    }
    
    // Get related stories (same category/author)
    const relatedStories = await prisma.story.findMany({
      where: {
        id: { not: storyId },
        isPublished: true,
        OR: [
          { authorId: story.authorId },
          { category: { hasSome: story.category } }
        ],
        author: {
          deletedAt: null
        }
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        coverImage: true,
        isPremium: true,
        rating: true,
        readingTime: true
      },
      take: 6,
      orderBy: { viewCount: 'desc' }
    })
    
    // Build response
    const response = {
      id: story.id,
      isbn: story.isbn,
      title: story.title,
      subtitle: story.subtitle,
      content: content,
      contentPreview: contentPreview,
      summary: story.summary,
      author: {
        id: story.author.id,
        name: story.authorName,
        age: story.authorAge,
        location: story.authorLocation,
        profile: story.author.profile
      },
      publishedDate: story.publishedDate,
      publisher: story.publisher,
      language: story.language,
      pageCount: story.pageCount,
      readingLevel: story.readingLevel,
      readingTime: story.readingTime,
      category: story.category,
      genres: story.genres,
      subjects: story.subjects,
      tags: story.tags,
      coverImage: story.coverImage,
      illustrations: story.illustrations,
      samplePdf: story.samplePdf,
      fullPdf: accessLevel === 'full' ? story.fullPdf : null,
      epubFile: accessLevel === 'full' ? story.epubFile : null,
      audioFile: accessLevel === 'full' ? story.audioFile : null,
      isPremium: story.isPremium,
      featured: story.featured,
      price: story.price,
      rating: story.rating,
      viewCount: story.viewCount + 1, // Include the increment
      likeCount: story.likeCount,
      accessLevel,
      userProgress: userProgress ? {
        currentPage: userProgress.currentPage,
        progress: userProgress.percentComplete,
        lastReadAt: userProgress.lastReadAt,
        timeSpent: userProgress.totalReadingTime
      } : null,
      stats: {
        readers: story._count.readingProgress,
        bookmarks: story._count.bookmarks,
        reviews: story._count.reviews
      },
      translations: story.translations,
      relatedStories
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching story:', error)
    return NextResponse.json(
      { error: 'Failed to fetch story details' },
      { status: 500 }
    )
  }
}