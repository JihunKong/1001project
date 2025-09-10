import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * GET /api/admin/featured
 * 
 * Returns the current featured set and available books for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOOK_MANAGER)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Book Manager access required' },
        { status: 401 }
      )
    }

    // Get current featured set
    const currentFeaturedSet = await prisma.featuredSet.findFirst({
      where: {
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all featured sets (history)
    const featuredHistory = await prisma.featuredSet.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Last 10 sets
    })

    // Get all published books for selection
    const availableBooks = await prisma.book.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        language: true,
        category: true,
        tags: true,
        coverImage: true,
        pageCount: true,
        viewCount: true,
        rating: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get current featured books details if exists
    let currentFeaturedBooks: Array<{
      id: string;
      title: string;
      authorName: string | null;
      summary: string | null;
      language: string | null;
      category: string[] | null;
      tags: string[] | null;
      coverImage: string | null;
      pageCount: number | null;
      viewCount: number;
      rating: number | null;
      createdAt: Date;
    }> = []
    if (currentFeaturedSet) {
      currentFeaturedBooks = await prisma.book.findMany({
        where: {
          id: {
            in: currentFeaturedSet.bookIds
          }
        },
        select: {
          id: true,
          title: true,
          authorName: true,
          summary: true,
          language: true,
          category: true,
          tags: true,
          coverImage: true,
          pageCount: true,
          viewCount: true,
          rating: true,
          createdAt: true
        }
      })
    }

    const transformedHistory = featuredHistory.map(set => ({
      id: set.id,
      bookIds: set.bookIds,
      startsAt: set.startsAt.toISOString(),
      endsAt: set.endsAt.toISOString(),
      createdAt: set.createdAt.toISOString(),
      isActive: set.isActive,
      rotationType: set.rotationType,
      selectionMethod: set.selectionMethod,
      creator: set.creator
    }))

    const transformedBooks = availableBooks.map(book => ({
      ...book,
      pageCount: book.pageCount || undefined,
      rating: book.rating || undefined,
      summary: book.summary || undefined,
      coverImage: book.coverImage || undefined,
      createdAt: book.createdAt.toISOString()
    }))

    const transformedFeaturedBooks = currentFeaturedBooks.map(book => ({
      ...book,
      pageCount: book.pageCount || undefined,
      rating: book.rating || undefined,
      summary: book.summary || undefined,
      coverImage: book.coverImage || undefined,
      createdAt: book.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      currentFeaturedSet: currentFeaturedSet ? {
        id: currentFeaturedSet.id,
        bookIds: currentFeaturedSet.bookIds,
        startsAt: currentFeaturedSet.startsAt.toISOString(),
        endsAt: currentFeaturedSet.endsAt.toISOString(),
        createdAt: currentFeaturedSet.createdAt.toISOString(),
        isActive: currentFeaturedSet.isActive,
        rotationType: currentFeaturedSet.rotationType,
        selectionMethod: currentFeaturedSet.selectionMethod,
        creator: currentFeaturedSet.creator
      } : null,
      currentFeaturedBooks: transformedFeaturedBooks,
      featuredHistory: transformedHistory,
      availableBooks: transformedBooks,
      totalAvailableBooks: availableBooks.length
    })

  } catch (error) {
    console.error('Error fetching featured management data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch featured management data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/featured
 * 
 * Creates a new featured set (manual selection)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOOK_MANAGER)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Book Manager access required' },
        { status: 401 }
      )
    }

    const { bookIds, duration = 30, rotationType = 'MANUAL' } = await request.json()

    // Validate input
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length !== 3) {
      return NextResponse.json(
        { error: 'Exactly 3 book IDs are required' },
        { status: 400 }
      )
    }

    // Verify all books exist and are published
    const books = await prisma.book.findMany({
      where: {
        id: {
          in: bookIds
        },
        isPublished: true
      }
    })

    if (books.length !== 3) {
      return NextResponse.json(
        { error: 'All selected books must exist and be published' },
        { status: 400 }
      )
    }

    // Deactivate current featured set
    await prisma.featuredSet.updateMany({
      where: {
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Create new featured set
    const now = new Date()
    const endsAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000) // duration in days

    const newFeaturedSet = await prisma.featuredSet.create({
      data: {
        bookIds,
        startsAt: now,
        endsAt,
        createdBy: session.user.id,
        isActive: true,
        rotationType,
        selectionMethod: 'CURATED'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Get the featured books details
    const featuredBooks = await prisma.book.findMany({
      where: {
        id: {
          in: bookIds
        }
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        language: true,
        category: true,
        coverImage: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Featured books updated successfully',
      featuredSet: {
        id: newFeaturedSet.id,
        bookIds: newFeaturedSet.bookIds,
        startsAt: newFeaturedSet.startsAt.toISOString(),
        endsAt: newFeaturedSet.endsAt.toISOString(),
        createdAt: newFeaturedSet.createdAt.toISOString(),
        isActive: newFeaturedSet.isActive,
        rotationType: newFeaturedSet.rotationType,
        selectionMethod: newFeaturedSet.selectionMethod,
        creator: newFeaturedSet.creator
      },
      featuredBooks: featuredBooks.map(book => ({
        ...book,
        summary: book.summary || undefined,
        coverImage: book.coverImage || undefined
      }))
    })

  } catch (error) {
    console.error('Error creating featured set:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create featured set',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}