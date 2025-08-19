import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/stories
 * 
 * Returns list of published stories with filtering and pagination
 * Accessible without authentication (public stories)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const language = searchParams.get('language')
    const ageGroup = searchParams.get('ageGroup')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const premium = searchParams.get('premium')
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const whereClause: any = {
      isPublished: true,
      // Only show stories that are not soft-deleted
      author: {
        deletedAt: null
      }
    }
    
    // Apply filters
    if (category && category !== 'all') {
      whereClause.category = {
        has: category
      }
    }
    
    if (language && language !== 'all') {
      whereClause.language = language
    }
    
    if (ageGroup && ageGroup !== 'all') {
      whereClause.readingLevel = ageGroup
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }
    
    if (featured === 'true') {
      whereClause.featured = true
    }
    
    if (premium === 'true') {
      whereClause.isPremium = true
    } else if (premium === 'false') {
      whereClause.isPremium = false
    }
    
    // Get current user session to check subscription status
    const session = await getServerSession(authOptions)
    
    // Query stories
    const [stories, totalCount] = await Promise.all([
      prisma.story.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              readingProgress: true,
              bookmarks: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { publishedDate: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.story.count({ where: whereClause })
    ])
    
    // Check user access for each story
    let userSubscription = null
    let userPurchases: string[] = []
    
    if (session?.user?.id) {
      // Get user subscription status
      userSubscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          plan: true,
          status: true,
          canAccessPremium: true,
          unlimitedReading: true
        }
      })
      
      // Get user purchases (placeholder - need to implement Order model queries)
      userPurchases = []
    }
    
    // Transform stories for response
    const transformedStories = stories.map(story => {
      let accessLevel = 'preview'
      
      // Determine access level
      if (!story.isPremium) {
        accessLevel = 'full'
      } else if (session?.user?.id) {
        // Check if user has subscription access
        if (userSubscription?.canAccessPremium && userSubscription?.status === 'ACTIVE') {
          accessLevel = 'full'
        }
        // Check if user purchased this story
        else if (userPurchases.includes(story.id)) {
          accessLevel = 'full'
        }
      }
      
      return {
        id: story.id,
        title: story.title,
        subtitle: story.subtitle,
        summary: story.summary,
        authorName: story.authorName,
        authorAge: story.authorAge,
        authorLocation: story.authorLocation,
        publishedDate: story.publishedDate,
        language: story.language,
        category: story.category,
        genres: story.genres,
        tags: story.tags,
        readingLevel: story.readingLevel,
        readingTime: story.readingTime,
        coverImage: story.coverImage,
        isPremium: story.isPremium,
        featured: story.featured,
        price: story.price,
        rating: story.rating,
        viewCount: story.viewCount,
        likeCount: story.likeCount,
        accessLevel,
        stats: {
          readers: story._count.readingProgress,
          bookmarks: story._count.bookmarks
        }
      }
    })
    
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
      filters: {
        categories: await getAvailableCategories(),
        languages: await getAvailableLanguages(),
        ageGroups: await getAvailableAgeGroups()
      }
    })
    
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get available categories
 */
async function getAvailableCategories() {
  const stories = await prisma.story.findMany({
    where: { isPublished: true },
    select: { category: true }
  })
  
  const categoryCount: Record<string, number> = {}
  
  stories.forEach(story => {
    if (Array.isArray(story.category)) {
      story.category.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })
    } else if (story.category) {
      categoryCount[story.category] = (categoryCount[story.category] || 0) + 1
    }
  })
  
  return Object.entries(categoryCount)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Helper function to get available languages
 */
async function getAvailableLanguages() {
  const result = await prisma.story.groupBy({
    by: ['language'],
    where: { isPublished: true },
    _count: { language: true },
    orderBy: { _count: { language: 'desc' } }
  })
  
  return result.map(item => ({
    value: item.language,
    count: item._count.language
  }))
}

/**
 * Helper function to get available age groups
 */
async function getAvailableAgeGroups() {
  const result = await prisma.story.groupBy({
    by: ['readingLevel'],
    where: { 
      isPublished: true,
      readingLevel: { not: null }
    },
    _count: { readingLevel: true },
    orderBy: { _count: { readingLevel: 'desc' } }
  })
  
  return result.map(item => ({
    value: item.readingLevel,
    count: item._count.readingLevel
  }))
}