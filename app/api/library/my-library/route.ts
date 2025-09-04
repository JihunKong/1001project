import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/my-library
 * 
 * Returns user's purchased stories and subscription content
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const type = searchParams.get('type') // 'purchased', 'subscription', 'all'
    const category = searchParams.get('category')
    const status = searchParams.get('status') // 'reading', 'completed', 'bookmarked'
    
    const skip = (page - 1) * limit
    
    // Get user's subscription - disabled, all books are free
    const subscription = null;
    
    // Get user's purchased stories - disabled, all books are free
    const purchasedStoryIds: string[] = [];
    const purchasedIds: string[] = [];
    
    // Build where clause for stories
    const whereClause: any = {
      isPublished: true,
      author: {
        deletedAt: null
      },
      OR: []
    }
    
    // Add purchased stories
    if (purchasedIds.length > 0 && (type === 'purchased' || type === 'all' || !type)) {
      whereClause.OR.push({
        id: { in: purchasedIds }
      })
    }
    
    // Add all stories - everything is free
    whereClause.OR.push({
      isPremium: true
    });
    
    // If no access, return empty
    if (whereClause.OR.length === 0) {
      return NextResponse.json({
        stories: [],
        pagination: { page, limit, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false },
        subscription: subscription,
        stats: { totalPurchased: 0, totalSubscriptionAccess: 0, currentlyReading: 0 }
      })
    }
    
    // Apply additional filters
    if (category && category !== 'all') {
      whereClause.category = { has: category }
    }
    
    // Get reading progress for status filtering
    let progressFilter: any = {}
    if (status === 'reading') {
      progressFilter = {
        readingProgress: {
          some: {
            userId: session.user.id,
            percentComplete: { lt: 100 }
          }
        }
      }
    } else if (status === 'completed') {
      progressFilter = {
        readingProgress: {
          some: {
            userId: session.user.id,
            progress: 100
          }
        }
      }
    } else if (status === 'bookmarked') {
      progressFilter = {
        bookmarks: {
          some: {
            userId: session.user.id
          }
        }
      }
    }
    
    Object.assign(whereClause, progressFilter)
    
    // Query stories
    const [stories, totalCount] = await Promise.all([
      prisma.story.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          readingProgress: {
            where: { userId: session.user.id },
            select: {
              percentComplete: true,
              currentPage: true,
              lastReadAt: true,
              totalReadingTime: true
            }
          },
          bookmarks: {
            where: { userId: session.user.id },
            select: {
              id: true,
              position: true,
              note: true,
              createdAt: true
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.story.count({ where: whereClause })
    ])
    
    // Transform stories with access information
    const transformedStories = stories.map(story => {
      const isPurchased = false; // All books are free
      const purchaseInfo = null;
      const hasSubscriptionAccess = true; // All books are accessible
      
      return {
        id: story.id,
        title: story.title,
        subtitle: story.subtitle,
        summary: story.summary,
        authorName: story.authorName,
        authorAge: story.authorAge,
        authorLocation: story.authorLocation,
        language: story.language,
        category: story.category,
        tags: story.tags,
        readingLevel: story.readingLevel,
        readingTime: story.readingTime,
        coverImage: story.coverImage,
        isPremium: story.isPremium,
        price: story.price,
        rating: story.rating,
        accessType: isPurchased ? 'purchased' : 'subscription',
        purchaseDate: null,
        purchasePrice: null,
        progress: story.readingProgress[0] || null,
        latestBookmark: story.bookmarks[0] || null,
        canDownload: true
      }
    })
    
    // Calculate stats
    const stats = {
      totalPurchased: purchasedIds.length,
      totalSubscriptionAccess: await prisma.story.count({ where: { isPremium: true, isPublished: true } }),
      currentlyReading: await prisma.readingProgress.count({
        where: {
          userId: session.user.id,
          percentComplete: { lt: 100 }
        }
      })
    }
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      stories: transformedStories,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      subscription,
      stats
    })
    
  } catch (error) {
    console.error('Error fetching user library:', error)
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500 }
    )
  }
}