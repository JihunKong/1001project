import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/books
 * 
 * Returns list of published books (combining Book and Story models)
 * Accessible without authentication (public books)
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
    
    // Get current user session to check subscription status
    const session = await getServerSession(authOptions)
    let userSubscription = null
    
    if (session?.user?.id) {
      userSubscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          plan: true,
          status: true,
          canAccessPremium: true,
          unlimitedReading: true
        }
      })
    }
    
    // Build where clause for stories (books are managed as Story records)
    const whereClause: any = {
      isPublished: true,
      fullPdf: { not: null } // Only show books with PDF files
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
      // Note: Story model uses readingLevel, not ageRange
      whereClause.readingLevel = ageGroup
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
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
    
    // Query stories (books are managed as Story records)
    const [stories, totalCount] = await Promise.all([
      prisma.story.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true
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
    
    // Transform stories to books for response
    const transformedBooks = await Promise.all(stories.map(async (story) => {
      // Determine access level
      let accessLevel = 'preview'
      
      // Admin users have full access to all books
      if (session?.user?.role === 'ADMIN') {
        accessLevel = 'full'
      }
      // Free books get full access for logged-in users
      else if (!story.isPremium) {
        accessLevel = 'full'
      }
      // Premium books require subscription or purchase
      else if (userSubscription?.canAccessPremium && userSubscription?.status === 'ACTIVE') {
        accessLevel = 'full'
      }
      // For now, individual purchases are handled via subscription
      // TODO: Implement individual book purchase checking when product-story linking is available
      
      // Get user progress if logged in
      let userProgress = null
      // This will be fetched separately for each book when needed
      
      return {
        id: story.id,
        title: story.title,
        subtitle: story.subtitle,
        summary: story.summary,
        author: {
          id: story.author.id,
          name: story.authorName,
          age: story.authorAge,
          location: story.authorLocation
        },
        publishedDate: story.publishedDate,
        language: story.language,
        ageRange: story.readingLevel, // Story uses readingLevel instead of ageRange
        pageCount: story.pageCount,
        readingTime: story.readingTime || Math.ceil((story.pageCount || 20) / 2), // Use story readingTime or estimate
        category: story.category,
        genres: story.genres,
        subjects: story.subjects,
        tags: story.tags,
        coverImage: story.coverImage,
        samplePdf: `/api/pdf/books/${story.id}/main.pdf`, // Use API route for preview
        fullPdf: accessLevel === 'full' ? `/api/pdf/books/${story.id}/main.pdf` : `/api/pdf/books/${story.id}/main.pdf`,
        isPremium: story.isPremium,
        isFeatured: story.featured,
        price: story.price,
        rating: story.rating,
        accessLevel,
        stats: {
          readers: 0, // TODO: Count from ReadingProgress where storyId = story.id
          bookmarks: 0, // TODO: Count from Bookmark where storyId = story.id
          reviews: 0, // Placeholder
          views: story.viewCount,
          likes: story.likeCount
        },
        // Additional fields for compatibility
        bookId: story.id,
        storyId: story.id,
        pdfKey: `/api/pdf/books/${story.id}/main.pdf`, // Add pdfKey for SimpleBookCard compatibility
        pdfFrontCover: `/api/pdf/books/${story.id}/front.pdf`, // Add pdfFrontCover field
        pdfBackCover: `/api/pdf/books/${story.id}/back.pdf`, // Add pdfBackCover field
        pageLayout: 'standard', // Add pageLayout field
        previewPages: 5, // Add previewPages field
        fullPdfUrl: `/api/pdf/books/${story.id}/main.pdf`,
        samplePdfUrl: `/api/pdf/books/${story.id}/main.pdf`,
        viewCount: story.viewCount,
        likeCount: story.likeCount
      }
    }))
    
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages
    
    return NextResponse.json({
      books: transformedBooks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        limit
      }
    })
    
  } catch (error) {
    console.error('Error fetching library books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch library books' },
      { status: 500 }
    )
  }
}