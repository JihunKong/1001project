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
    
    // Build where clause for books
    const bookWhereClause: any = {
      isPublished: true
    }
    
    // Apply filters
    if (category && category !== 'all') {
      bookWhereClause.category = {
        has: category
      }
    }
    
    if (language && language !== 'all') {
      bookWhereClause.language = language
    }
    
    if (ageGroup && ageGroup !== 'all') {
      bookWhereClause.ageRange = ageGroup
    }
    
    if (search) {
      bookWhereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
        { authorAlias: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }
    
    if (featured === 'true') {
      bookWhereClause.featured = true
    }
    
    if (premium === 'true') {
      bookWhereClause.isPremium = true
    } else if (premium === 'false') {
      bookWhereClause.isPremium = false
    }
    
    // Query books
    const [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        where: bookWhereClause,
        orderBy: [
          { featured: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.book.count({ where: bookWhereClause })
    ])
    
    // Transform books for response
    const transformedBooks = books.map(book => {
      // Determine access level
      let accessLevel = 'preview'
      
      if (!book.isPremium) {
        accessLevel = 'full'
      } else if (userSubscription?.canAccessPremium && userSubscription?.status === 'ACTIVE') {
        accessLevel = 'full'
      }
      // TODO: Check individual purchases from Order/Entitlement models
      
      // Get user progress if logged in
      let userProgress = null
      // This will be fetched separately for each book when needed
      
      return {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        summary: book.summary,
        author: {
          id: book.id, // Using book id as author id for now
          name: book.authorAlias || book.authorName,
          age: book.authorAge,
          location: book.authorLocation
        },
        publishedDate: book.publishedAt,
        language: book.language,
        ageRange: book.ageRange,
        pageCount: book.pageCount,
        readingTime: Math.ceil((book.pageCount || 20) / 2), // Estimate 2 pages per minute
        category: book.category,
        genres: book.genres,
        subjects: book.subjects,
        tags: book.tags,
        coverImage: book.coverImage,
        samplePdf: book.pdfKey, // Same PDF, access control handled by viewer
        fullPdf: accessLevel === 'full' ? book.pdfKey : null,
        isPremium: book.isPremium,
        isFeatured: book.featured,
        price: book.price,
        rating: book.rating,
        accessLevel,
        stats: {
          readers: 0, // TODO: Count from ReadingProgress where storyId = book.id
          bookmarks: 0, // TODO: Count from Bookmark where storyId = book.id
          reviews: 0 // Placeholder
        },
        // Additional fields for PDF handling
        bookId: book.id,
        pdfKey: book.pdfKey,
        pdfFrontCover: book.pdfFrontCover,
        pdfBackCover: book.pdfBackCover,
        pageLayout: book.pageLayout,
        previewPages: book.previewPages || 3
      }
    })
    
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