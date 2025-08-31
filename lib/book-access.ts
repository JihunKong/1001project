import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Book Access Control System
 * 
 * Manages access to PDF books based on user subscription, purchases, and preview limits.
 * This is specifically designed for the Book model (not Story model).
 */

export enum BookAccess {
  PREVIEW = 'preview',       // Limited pages free
  PURCHASED = 'purchased',   // One-time purchase
  SUBSCRIBED = 'subscribed', // Active subscription
  RESTRICTED = 'restricted', // No access
  FREE = 'free'              // Free book, full access
}

export interface BookAccessResult {
  level: BookAccess
  canReadFull: boolean
  canDownload: boolean
  canPrint: boolean
  previewPages: number
  totalPages: number | null
  message?: string
  upgradeOptions?: {
    purchase?: {
      price: number
      currency: string
    }
    subscription?: {
      plan: string
      price: number
      currency: string
    }
  }
}

export interface BookPreviewInfo {
  allowedPages: number[]  // Array of page numbers user can access
  isComplete: boolean
  totalPages: number | null
  remainingPages: number
  watermark?: string
}

/**
 * Check user's access level for a specific book
 */
export async function checkBookAccess(
  bookId: string, 
  userId?: string
): Promise<BookAccessResult> {
  try {
    // Get book details
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        isPremium: true,
        price: true,
        currency: true,
        previewPages: true,
        pageCount: true,
        downloadAllowed: true,
        printAllowed: true,
        drm: true
      }
    })
    
    if (!book) {
      return {
        level: BookAccess.RESTRICTED,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: 0,
        totalPages: null,
        message: 'Book not found or unavailable'
      }
    }
    
    // Free books are always accessible
    if (!book.isPremium) {
      return {
        level: BookAccess.FREE,
        canReadFull: true,
        canDownload: book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount
      }
    }
    
    // For premium books, check user access
    if (!userId) {
      return {
        level: BookAccess.PREVIEW,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: book.previewPages || 10,
        totalPages: book.pageCount,
        message: 'Preview available. Sign up to read the full book.',
        upgradeOptions: {
          purchase: book.price ? {
            price: Number(book.price),
            currency: book.currency
          } : undefined,
          subscription: {
            plan: 'basic',
            price: 9.99,
            currency: 'USD'
          }
        }
      }
    }
    
    // Check user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        canAccessPremium: true,
        canDownloadPDF: true,
        unlimitedReading: true
      }
    })
    
    if (subscription?.status === 'ACTIVE' && subscription.canAccessPremium) {
      return {
        level: BookAccess.SUBSCRIBED,
        canReadFull: true,
        canDownload: subscription.canDownloadPDF && book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount
      }
    }
    
    // Check if user has purchased this book
    const purchase = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['DELIVERED', 'PROCESSING'] },
        items: {
          some: {
            productId: bookId
          }
        }
      }
    })
    
    if (purchase) {
      return {
        level: BookAccess.PURCHASED,
        canReadFull: true,
        canDownload: book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount
      }
    }
    
    // Default to preview for authenticated users
    return {
      level: BookAccess.PREVIEW,
      canReadFull: false,
      canDownload: false,
      canPrint: false,
      previewPages: book.previewPages || 10,
      totalPages: book.pageCount,
      message: 'Preview available. Purchase or subscribe to read the full book.',
      upgradeOptions: {
        purchase: book.price ? {
          price: Number(book.price),
          currency: book.currency
        } : undefined,
        subscription: {
          plan: 'basic',
          price: 9.99,
          currency: 'USD'
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking book access:', error)
    return {
      level: BookAccess.RESTRICTED,
      canReadFull: false,
      canDownload: false,
      canPrint: false,
      previewPages: 0,
      totalPages: null,
      message: 'Error checking access permissions'
    }
  }
}

/**
 * Get preview information for a book
 */
export function getBookPreview(
  accessLevel: BookAccess,
  previewPages: number = 10,
  totalPages: number | null = null
): BookPreviewInfo {
  if (accessLevel === BookAccess.FREE || 
      accessLevel === BookAccess.SUBSCRIBED || 
      accessLevel === BookAccess.PURCHASED) {
    
    const pages = totalPages ? Array.from({ length: totalPages }, (_, i) => i + 1) : [];
    
    return {
      allowedPages: pages,
      isComplete: true,
      totalPages,
      remainingPages: 0
    }
  }
  
  if (accessLevel === BookAccess.PREVIEW) {
    const allowedPages = Array.from({ length: previewPages }, (_, i) => i + 1);
    const remainingPages = totalPages ? Math.max(0, totalPages - previewPages) : 0;
    
    return {
      allowedPages,
      isComplete: false,
      totalPages,
      remainingPages,
      watermark: 'PREVIEW - Purchase to read full book'
    }
  }
  
  return {
    allowedPages: [],
    isComplete: false,
    totalPages,
    remainingPages: totalPages || 0
  }
}

/**
 * Check if a specific page number is accessible to the user
 */
export function canAccessPage(
  pageNumber: number,
  accessResult: BookAccessResult
): { canAccess: boolean; reason?: string } {
  if (accessResult.level === BookAccess.RESTRICTED) {
    return { canAccess: false, reason: 'No access to this book' };
  }
  
  if (accessResult.level === BookAccess.FREE || 
      accessResult.level === BookAccess.SUBSCRIBED || 
      accessResult.level === BookAccess.PURCHASED) {
    return { canAccess: true };
  }
  
  if (accessResult.level === BookAccess.PREVIEW) {
    if (pageNumber <= accessResult.previewPages) {
      return { canAccess: true };
    } else {
      return { 
        canAccess: false, 
        reason: `Page ${pageNumber} requires purchase. Preview includes pages 1-${accessResult.previewPages}.` 
      };
    }
  }
  
  return { canAccess: false, reason: 'Unknown access level' };
}

/**
 * Get book thumbnails with access control
 */
export async function getBookThumbnails(
  bookId: string,
  userId?: string
): Promise<{
  thumbnails: any;
  canViewThumbnails: boolean;
  accessLevel: BookAccess;
}> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      // thumbnails: true, // Will be added when schema is ready
      isPremium: true
    }
  });

  if (!book) {
    return {
      thumbnails: null,
      canViewThumbnails: false,
      accessLevel: BookAccess.RESTRICTED
    };
  }

  const accessResult = await checkBookAccess(bookId, userId);
  
  // Even for preview users, we show thumbnails to encourage engagement
  const canViewThumbnails = accessResult.level !== BookAccess.RESTRICTED;
  
  return {
    thumbnails: null, // book.thumbnails, // Will be added when schema is ready
    canViewThumbnails,
    accessLevel: accessResult.level
  };
}

/**
 * Track book access attempts for analytics
 */
export async function trackBookAccess(
  bookId: string,
  userId: string | null,
  accessType: 'view' | 'download' | 'preview' | 'purchase_attempt',
  metadata: {
    pageNumber?: number
    source?: string
    userAgent?: string
    sessionId?: string
  } = {}
): Promise<void> {
  try {
    const baseData = {
      bookId,
      accessType,
      ...metadata,
      timestamp: new Date()
    }
    
    if (userId) {
      // Track for authenticated users
      await prisma.activityLog.create({
        data: {
          userId,
          action: `BOOK_${accessType.toUpperCase()}`,
          entity: 'BOOK',
          entityId: bookId,
          metadata: baseData
        }
      })
    } else {
      // Track for anonymous users
      console.log('Anonymous book access tracking:', baseData)
    }
  } catch (error) {
    console.error('Error tracking book access:', error)
  }
}

/**
 * Check if user has reached book access limits (anti-abuse)
 */
export async function checkBookAccessLimits(
  userId: string | null,
  sessionId: string | null
): Promise<{ exceeded: boolean; remaining: number; resetTime: Date }> {
  const hourlyLimit = 20 // Max 20 book previews per hour for anonymous users
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  try {
    let accessCount = 0
    
    if (userId) {
      accessCount = await prisma.activityLog.count({
        where: {
          userId,
          action: { in: ['BOOK_VIEW', 'BOOK_PREVIEW'] },
          createdAt: {
            gte: oneHourAgo
          }
        }
      })
    } else {
      // For anonymous users, implement session-based tracking
      // This would require Redis or another solution for production
      accessCount = 0
    }
    
    const exceeded = accessCount >= hourlyLimit
    const remaining = Math.max(0, hourlyLimit - accessCount)
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000)
    
    return {
      exceeded,
      remaining,
      resetTime
    }
    
  } catch (error) {
    console.error('Error checking book access limits:', error)
    return {
      exceeded: false,
      remaining: hourlyLimit,
      resetTime: new Date(now.getTime() + 60 * 60 * 1000)
    }
  }
}

/**
 * Helper function to get current user session and book access info
 */
export async function getCurrentUserBookAccess(bookId: string): Promise<{
  userId: string | null
  bookAccess: BookAccessResult
  thumbnails: any
}> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || null
  
  const [bookAccess, thumbnailData] = await Promise.all([
    checkBookAccess(bookId, userId || undefined),
    getBookThumbnails(bookId, userId || undefined)
  ])
  
  return {
    userId,
    bookAccess,
    thumbnails: thumbnailData.thumbnails
  }
}

/**
 * Batch check access for multiple books (for library views)
 */
export async function checkBatchBookAccess(
  bookIds: string[],
  userId?: string
): Promise<Record<string, BookAccessResult>> {
  const results: Record<string, BookAccessResult> = {}
  
  // Get all books in one query
  const books = await prisma.book.findMany({
    where: {
      id: { in: bookIds },
      isPublished: true
    },
    select: {
      id: true,
      isPremium: true,
      price: true,
      currency: true,
      previewPages: true,
      pageCount: true,
      downloadAllowed: true,
      printAllowed: true
    }
  })
  
  // Get user's subscription if authenticated
  let subscription = null
  if (userId) {
    subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        canAccessPremium: true,
        canDownloadPDF: true
      }
    })
  }
  
  // Get user's purchases if authenticated
  let purchasedBookIds: string[] = []
  if (userId) {
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['DELIVERED', 'PROCESSING'] }
      },
      include: {
        items: {
          select: { productId: true }
        }
      }
    })
    
    purchasedBookIds = orders.flatMap(order => 
      order.items.map(item => item.productId).filter(Boolean)
    )
  }
  
  // Process each book
  for (const book of books) {
    // Free books
    if (!book.isPremium) {
      results[book.id] = {
        level: BookAccess.FREE,
        canReadFull: true,
        canDownload: book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount
      }
      continue
    }
    
    // No user - preview only
    if (!userId) {
      results[book.id] = {
        level: BookAccess.PREVIEW,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: book.previewPages || 10,
        totalPages: book.pageCount,
        message: 'Preview available. Sign up to read the full book.',
        upgradeOptions: {
          purchase: book.price ? {
            price: Number(book.price),
            currency: book.currency
          } : undefined,
          subscription: {
            plan: 'basic',
            price: 9.99,
            currency: 'USD'
          }
        }
      }
      continue
    }
    
    // Check subscription
    if (subscription?.status === 'ACTIVE' && subscription.canAccessPremium) {
      results[book.id] = {
        level: BookAccess.SUBSCRIBED,
        canReadFull: true,
        canDownload: subscription.canDownloadPDF && book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount
      }
      continue
    }
    
    // Check purchase
    if (purchasedBookIds.includes(book.id)) {
      results[book.id] = {
        level: BookAccess.PURCHASED,
        canReadFull: true,
        canDownload: book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount
      }
      continue
    }
    
    // Default to preview for authenticated users
    results[book.id] = {
      level: BookAccess.PREVIEW,
      canReadFull: false,
      canDownload: false,
      canPrint: false,
      previewPages: book.previewPages || 10,
      totalPages: book.pageCount,
      message: 'Preview available. Purchase or subscribe to read the full book.',
      upgradeOptions: {
        purchase: book.price ? {
          price: Number(book.price),
          currency: book.currency
        } : undefined,
        subscription: {
          plan: 'basic',
          price: 9.99,
          currency: 'USD'
        }
      }
    }
  }
  
  return results
}