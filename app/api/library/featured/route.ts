import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * GET /api/library/featured
 * 
 * Returns the current Featured-3 books that are publicly accessible
 * Also checks for global public reading toggle
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id

    // Check global public reading setting
    const globalPublicSetting = await prisma.platformSetting.findUnique({
      where: { key: 'global_public_reading' }
    })

    const isGlobalPublicEnabled = globalPublicSetting?.valueJson 
      ? Boolean((globalPublicSetting.valueJson as any).enabled) 
      : false

    // If global public reading is enabled, return all published books
    if (isGlobalPublicEnabled) {
      const allBooks = await prisma.book.findMany({
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
          isPremium: true,
          price: true,
          currency: true,
          coverImage: true,
          content: true,
          previewPages: true,
          pageCount: true,
          viewCount: true,
          downloadCount: true,
          rating: true,
          createdAt: true,
          featured: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const booksWithAccess = allBooks.map(book => ({
        ...book,
        price: book.price ? Number(book.price) : undefined,
        pageCount: book.pageCount || undefined,
        rating: book.rating || undefined,
        summary: book.summary || undefined,
        coverImage: book.coverImage || undefined,
        content: book.content || undefined,
        createdAt: book.createdAt.toISOString(),
        hasAccess: true, // All books are accessible with global toggle
        accessLevel: 'free',
        isFeatured: false,
        isGlobalPublic: true
      }))

      return NextResponse.json({
        success: true,
        isGlobalPublic: true,
        featuredBooks: [],
        allBooks: booksWithAccess,
        message: "All books are currently available for public reading"
      })
    }

    // Get current active featured set
    const currentFeaturedSet = await prisma.featuredSet.findFirst({
      where: {
        isActive: true,
        startsAt: {
          lte: new Date()
        },
        endsAt: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!currentFeaturedSet) {
      return NextResponse.json({
        success: true,
        isGlobalPublic: false,
        featuredBooks: [],
        allBooks: [],
        message: "No featured books are currently available"
      })
    }

    // Fetch the featured books
    const featuredBooks = await prisma.book.findMany({
      where: {
        id: {
          in: currentFeaturedSet.bookIds
        },
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
        isPremium: true,
        price: true,
        currency: true,
        coverImage: true,
        content: true,
        previewPages: true,
        pageCount: true,
        viewCount: true,
        downloadCount: true,
        rating: true,
        createdAt: true,
        featured: true
      }
    })

    // Transform books with full access for featured books
    const booksWithAccess = featuredBooks.map(book => ({
      ...book,
      price: book.price ? Number(book.price) : undefined,
      pageCount: book.pageCount || undefined,
      rating: book.rating || undefined,
      summary: book.summary || undefined,
      coverImage: book.coverImage || undefined,
      content: book.content || undefined,
      createdAt: book.createdAt.toISOString(),
      hasAccess: true, // Featured books are always accessible
      accessLevel: 'free',
      isFeatured: true,
      isGlobalPublic: false
    }))

    return NextResponse.json({
      success: true,
      isGlobalPublic: false,
      featuredBooks: booksWithAccess,
      allBooks: [],
      featuredSetId: currentFeaturedSet.id,
      featuredPeriod: {
        startsAt: currentFeaturedSet.startsAt.toISOString(),
        endsAt: currentFeaturedSet.endsAt.toISOString(),
        rotationType: currentFeaturedSet.rotationType,
        selectionMethod: currentFeaturedSet.selectionMethod
      },
      message: `${booksWithAccess.length} featured books available for public reading`
    })

  } catch (error) {
    console.error('Error fetching featured books:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch featured books',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}