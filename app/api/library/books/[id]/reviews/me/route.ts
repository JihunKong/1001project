import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/library/books/[id]/reviews/me
 * 
 * Returns the current user's review for a specific book
 */
export async function GET(
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
    
    // Get user's review for this book
    const review = await prisma.review.findUnique({
      where: {
        unique_user_content_review: {
          userId: session.user.id,
          contentType: 'BOOK',
          contentId: bookId
        }
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
    
    return NextResponse.json({ review })
    
  } catch (error) {
    console.error('Error fetching user review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}