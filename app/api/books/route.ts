import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkBatchBookAccess } from '@/lib/book-access'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * GET /api/books
 * 
 * Returns list of published books with access control and thumbnails
 * Uses the Book model (not Story model)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const userId = searchParams.get('userId') || undefined
    const category = searchParams.get('category')
    const language = searchParams.get('language')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Get current user session
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id || userId
    
    // Build where clause for books
    const where: any = {
      isPublished: true
    }
    
    if (category) {
      where.category = {
        has: category
      }
    }
    
    if (language) {
      where.language = language
    }
    
    if (search) {
      const searchTerm = search.toLowerCase()
      where.OR = [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          authorName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          summary: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ]
    }
    
    // Build orderBy clause
    const validSortFields = ['title', 'authorName', 'createdAt', 'viewCount', 'price']
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt'
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    
    const orderBy: any = {}
    orderBy[sortField] = sortOrder
    
    // Fetch books and total count
    const [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          authorName: true,
          summary: true,
          language: true,
          category: true,
          tags: true,
          isPremium: true,
          price: true,
          currency: true,
          coverImage: true,
          content: true, // Add content field for PDF paths
          previewPages: true,
          pageCount: true,
          viewCount: true,
          downloadCount: true,
          rating: true,
          createdAt: true,
          featured: true,
          pdfKey: true // Include pdfKey for PDF path
        }
      }),
      prisma.book.count({ where })
    ])
    
    // Get access information for all books
    const bookIds = books.map(book => book.id)
    const batchAccessResults = currentUserId ? await checkBatchBookAccess({ userId: currentUserId, bookIds }) : {}
    
    // Transform books with access information and PDF paths
    const booksWithAccess = books.map(book => ({
      id: book.id,
      title: book.title,
      authorName: book.authorName,
      summary: book.summary || undefined,
      language: book.language,
      category: book.category,
      tags: book.tags,
      isPremium: book.isPremium,
      price: book.price ? Number(book.price) : undefined,
      currency: book.currency,
      coverImage: book.coverImage || undefined,
      content: book.content || undefined, // Include content field
      pdfUrl: book.pdfKey || `/books/${book.id}/main.pdf`, // Use pdfKey if available, fallback to book ID
      thumbnailUrl: `/api/thumbnails/generate?bookId=${book.id}&fileName=main.pdf`, // Generate thumbnail URL using book ID
      previewPages: book.previewPages,
      pageCount: book.pageCount || undefined,
      viewCount: book.viewCount,
      downloadCount: book.downloadCount,
      rating: book.rating || undefined,
      featured: book.featured,
      createdAt: book.createdAt.toISOString(),
      hasAccess: currentUserId ? (
        batchAccessResults[book.id]?.level === 'free' ||
        batchAccessResults[book.id]?.level === 'purchased' ||
        batchAccessResults[book.id]?.level === 'subscribed'
      ) : true, // Allow access for public library
      accessLevel: batchAccessResults[book.id]?.level || 'free'
    }))
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      success: true,
      books: booksWithAccess,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        category,
        language,
        search,
        sort,
        order
      }
    })
    
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch books',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}