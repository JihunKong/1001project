import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * PUT /api/library/books/[id]/reviews/[reviewId]
 * 
 * Update an existing review
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id, reviewId } = await params
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
    
    // Check if the review exists and belongs to the user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: session.user.id,
        contentType: 'BOOK',
        contentId: bookId
      }
    })
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or access denied' },
        { status: 404 }
      )
    }
    
    // Update the review
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
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
    
    // Recalculate book's average rating
    const allReviews = await prisma.review.findMany({
      where: {
        contentType: 'BOOK',
        contentId: bookId
      }
    })
    
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    
    await prisma.story.update({
      where: { id: bookId },
      data: { rating: averageRating }
    })
    
    return NextResponse.json({ 
      review,
      message: 'Review updated successfully' 
    })
    
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/library/books/[id]/reviews/[reviewId]
 * 
 * Delete a review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id, reviewId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const bookId = id
    
    // Check if the review exists and belongs to the user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: session.user.id,
        contentType: 'BOOK',
        contentId: bookId
      }
    })
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or access denied' },
        { status: 404 }
      )
    }
    
    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    })
    
    // Recalculate book's average rating
    const allReviews = await prisma.review.findMany({
      where: {
        contentType: 'BOOK',
        contentId: bookId
      }
    })
    
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : null
    
    await prisma.story.update({
      where: { id: bookId },
      data: { rating: averageRating }
    })
    
    return NextResponse.json({ 
      message: 'Review deleted successfully' 
    })
    
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}