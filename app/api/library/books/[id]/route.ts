import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/books/[id]
 * 
 * Returns detailed book information with appropriate content based on user access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const bookId = id
    const session = await getServerSession(authOptions)
    
    // Get story with related data (books are managed as Story records)
    const book = await prisma.story.findFirst({
      where: {
        id: bookId,
        isPublished: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    // Check user access level
    let accessLevel = 'preview'
    let userSubscription = null
    let userPurchase = null
    let userProgress = null
    
    if (session?.user?.id) {
      // Get user subscription
      userSubscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          plan: true,
          status: true,
          canAccessPremium: true,
          unlimitedReading: true
        }
      })
      
      // Check for individual purchase (placeholder for now)
      // userPurchase = await prisma.order.findFirst({...})
      
      // Get user reading progress
      userProgress = await prisma.readingProgress.findUnique({
        where: {
          userId_storyId: {
            userId: session.user.id,
            storyId: book.id
          }
        }
      })
      
      // Determine access level
      if (!book.isPremium) {
        accessLevel = 'full'
      } else if (userSubscription?.canAccessPremium && userSubscription?.status === 'ACTIVE') {
        accessLevel = 'full'
      } else if (userPurchase) {
        accessLevel = 'full'
      }
    } else {
      // Non-authenticated users get full access to free books
      if (!book.isPremium) {
        accessLevel = 'full'
      }
    }
    
    // Prepare PDF access based on access level
    // For books, content is in PDF format, not text
    let fullPdfAccess = accessLevel === 'full'
    let previewPagesCount = 3 // Default preview pages
    
    // Update view count
    await prisma.story.update({
      where: { id: bookId },
      data: { 
        viewCount: { increment: 1 }
      }
    })
    
    // Log access for analytics (optional)
    if (session?.user?.id) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'BOOK_VIEWED',
          entity: 'BOOK',
          entityId: bookId,
          metadata: {
            accessLevel,
            hasSubscription: !!userSubscription,
            userAgent: request.headers.get('user-agent')
          }
        }
      }).catch(() => {}) // Fail silently for analytics
    }
    
    // Get related books (same category/author)
    const relatedBooks = await prisma.story.findMany({
      where: {
        id: { not: bookId },
        isPublished: true,
        fullPdf: { not: null }, // Only books with PDF files
        OR: [
          { authorName: book.authorName },
          { category: { hasSome: book.category } }
        ]
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        coverImage: true,
        isPremium: true,
        rating: true,
        pageCount: true
      },
      take: 6,
      orderBy: { viewCount: 'desc' }
    })
    
    // Build response
    const response = {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      summary: book.summary,
      author: {
        id: book.author.id,
        name: book.authorName,
        age: book.authorAge,
        location: book.authorLocation
      },
      publishedDate: book.publishedDate,
      language: book.language,
      pageCount: book.pageCount,
      readingLevel: book.readingLevel,
      readingTime: book.readingTime || Math.ceil((book.pageCount || 20) / 2),
      category: book.category,
      genres: book.genres,
      subjects: book.subjects,
      tags: book.tags,
      coverImage: book.coverImage,
      samplePdf: book.samplePdf ? `/api/pdf/books/${book.id}/main.pdf` : `/api/pdf/books/${book.id}/main.pdf`,
      fullPdf: accessLevel === 'full' ? `/api/pdf/books/${book.id}/main.pdf` : null,
      isPremium: book.isPremium,
      featured: book.featured,
      price: book.price,
      rating: book.rating,
      viewCount: book.viewCount + 1, // Include the increment
      accessLevel,
      userProgress: userProgress ? {
        currentPage: userProgress.currentPage,
        progress: userProgress.percentComplete,
        lastReadAt: userProgress.lastReadAt,
        timeSpent: userProgress.totalReadingTime
      } : null,
      stats: {
        readers: 0, // TODO: Count from ReadingProgress where storyId = book.id
        bookmarks: 0, // TODO: Count from Bookmark where storyId = book.id
        reviews: 0
      },
      relatedStories: relatedBooks.map(relatedBook => ({
        id: relatedBook.id,
        title: relatedBook.title,
        authorName: relatedBook.authorName,
        coverImage: relatedBook.coverImage,
        isPremium: relatedBook.isPremium,
        rating: relatedBook.rating,
        readingTime: Math.ceil((relatedBook.pageCount || 20) / 2)
      })),
      // Additional fields for PDF handling
      bookId: book.id,
      fullPdfUrl: `/api/pdf/books/${book.id}/main.pdf`,
      samplePdfUrl: `/api/pdf/books/${book.id}/main.pdf`
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    )
  }
}