import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/books/[id]/reviews
 * 
 * Returns reviews for a specific book
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const bookId = id
    
    // Verify the book exists
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        isPublished: true
      }
    })
    
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    // Get reviews for this book
    const reviews = await prisma.review.findMany({
      where: {
        contentType: 'BOOK',
        contentId: bookId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0
    
    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    })
    
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/library/books/[id]/reviews
 * 
 * Create a new review for a book
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
    
    const bookId = id
    const { rating, title, comment } = await request.json()
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    // Verify the book exists
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        isPublished: true
      }
    })
    
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    // Check if user already reviewed this book
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        contentType: 'BOOK',
        contentId: bookId
      }
    })
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this book' },
        { status: 409 }
      )
    }
    
    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        contentType: 'BOOK',
        contentId: bookId,
        rating,
        title: title || null,
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })
    
    // Update book's average rating
    const allReviews = await prisma.review.findMany({
      where: {
        contentType: 'BOOK',
        contentId: bookId
      }
    })
    
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    
    await prisma.book.update({
      where: { id: bookId },
      data: { rating: averageRating }
    })
    
    return NextResponse.json({ 
      review,
      message: 'Review created successfully' 
    })
    
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}