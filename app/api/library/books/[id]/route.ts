import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Comprehensive book access checking
async function checkComprehensiveBookAccess(userId: string | undefined, bookId: string, userRole?: string) {
  try {
    // Admin users have full access
    if (userRole === 'ADMIN') {
      return { hasAccess: true, reason: 'admin_access', details: 'Administrator access' };
    }

    // Get book details
    const book = await prisma.story.findUnique({
      where: { id: bookId },
      select: { isPremium: true, price: true, title: true }
    });

    if (!book) {
      return { hasAccess: false, reason: 'book_not_found' };
    }

    // Free books are accessible to authenticated users
    if (!book.isPremium && userId) {
      return { hasAccess: true, reason: 'free_book', details: 'Free content for authenticated users' };
    }

    // Preview books (hardcoded for now)
    const freeBooks = ['neema-01', 'neema-02', 'neema-03'];
    if (freeBooks.includes(bookId) && userId) {
      return { hasAccess: true, reason: 'preview_book', details: 'Sample/preview content' };
    }

    if (!userId) {
      return { hasAccess: false, reason: 'authentication_required' };
    }

    // Teacher institutional access
    if (userRole === 'TEACHER') {
      const institutionalAccess = await checkTeacherInstitutionalAccess(userId);
      if (institutionalAccess.hasAccess) {
        return { 
          hasAccess: true, 
          reason: 'teacher_institutional', 
          details: institutionalAccess.details 
        };
      }
    }

    // Individual entitlements
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId: userId,
        OR: [
          { bookId: bookId },
          { storyId: bookId }
        ],
        isActive: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      }
    });

    if (entitlement) {
      return { 
        hasAccess: true, 
        reason: 'individual_purchase', 
        details: `${entitlement.type}: ${entitlement.grantReason}` 
      };
    }

    // Subscription access - disabled, all books are free
    const subscription = null;

    // All books are free in this version
    return { 
      hasAccess: true, 
      reason: 'free', 
      details: 'All books are free' 
    };

  } catch (error) {
    console.error('Error checking book access:', error);
    return { hasAccess: false, reason: 'system_error' };
  }
}

// Teacher institutional access helper
async function checkTeacherInstitutionalAccess(userId: string) {
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    if (!teacher?.school || teacher.school.status !== 'ACTIVE') {
      return { hasAccess: false };
    }

    // Check for institutional entitlements
    const institutionalEntitlement = await prisma.entitlement.findFirst({
      where: {
        userId: userId,
        type: 'LICENSE',
        isActive: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      }
    });

    if (institutionalEntitlement) {
      return {
        hasAccess: true,
        details: `Institutional access via ${teacher.school.name}`
      };
    }

    return { hasAccess: false };
  } catch (error) {
    console.error('Error checking teacher institutional access:', error);
    return { hasAccess: false };
  }
}

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
    
    // Check comprehensive user access
    const accessResult = await checkComprehensiveBookAccess(session?.user?.id, book.id, session?.user?.role);
    let accessLevel = accessResult.hasAccess ? 'full' : 'preview'
    
    // Get additional user data
    let userSubscription = null
    let userProgress = null
    let userEntitlements: any[] = []
    
    if (session?.user?.id) {
      // Get user subscription - disabled, all books are free
      userSubscription = null;
      
      // Get user reading progress
      userProgress = await prisma.readingProgress.findUnique({
        where: {
          userId_storyId: {
            userId: session.user.id,
            storyId: book.id
          }
        }
      })
      
      // Get user entitlements for this book
      userEntitlements = await prisma.entitlement.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { bookId: book.id },
            { storyId: book.id }
          ],
          isActive: true
        },
        select: {
          type: true,
          grantReason: true,
          expiresAt: true,
          scope: true
        }
      })
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
    
    // Build comprehensive response
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
      accessInfo: {
        level: accessLevel,
        hasAccess: accessResult.hasAccess,
        reason: accessResult.reason,
        details: accessResult.details,
        canDownload: accessLevel === 'full',
        canPrint: accessLevel === 'full',
        entitlements: userEntitlements.map(ent => ({
          type: ent.type,
          reason: ent.grantReason,
          expiresAt: ent.expiresAt,
          scope: ent.scope
        }))
      },
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
      samplePdfUrl: `/api/pdf/books/${book.id}/main.pdf`,
      frontCoverUrl: `/api/pdf/books/${book.id}/front.pdf`,
      backCoverUrl: `/api/pdf/books/${book.id}/back.pdf`
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