/**
 * Book Access Control Module
 * 
 * Manages access to PDF books in the free library system.
 * All books are now freely accessible to authenticated users.
 */

import { prisma } from './prisma'

export enum BookAccess {
  NONE = 'none', // No access
  FREE = 'free', // Free access (full)
  PREVIEW = 'preview', // Preview access only
  PURCHASED = 'purchased', // Has purchased (legacy)
  SUBSCRIBED = 'subscribed' // Full access (now same as FREE)
}

export interface AccessLevel {
  level: BookAccess
  canReadFull: boolean
  canDownload: boolean
  canPrint: boolean
  previewPages: number
  totalPages?: number
  message?: string
  upgradeOptions?: {
    purchase?: {
      price: number
      currency: string
    }
  }
}

export interface BookAccessOptions {
  userId?: string
  bookId: string
  checkPurchase?: boolean
  checkOwnership?: boolean
}

export interface BatchAccessOptions {
  userId?: string
  bookIds: string[]
}

export interface BatchAccessResult {
  [bookId: string]: AccessLevel
}

/**
 * Check access level for a single book
 * All authenticated users now have full access to all books
 */
export async function checkBookAccess({
  userId,
  bookId,
}: BookAccessOptions): Promise<AccessLevel> {
  try {
    // Get book details
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        downloadAllowed: true,
        printAllowed: true,
        previewPages: true,
        pageCount: true
      }
    })
    
    if (!book) {
      return {
        level: BookAccess.NONE,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: 0,
        totalPages: 0,
        message: 'Book not found'
      }
    }
    
    // Non-authenticated users get preview only
    if (!userId) {
      return {
        level: BookAccess.PREVIEW,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: book.previewPages || 5,
        totalPages: book.pageCount || undefined || undefined,
        message: 'Sign in to read the full book for free'
      }
    }
    
    // All books are now free to access in the library
    // Return full access for all authenticated users
    return {
      level: BookAccess.FREE,
      canReadFull: true,
      canDownload: book.downloadAllowed,
      canPrint: book.printAllowed,
      previewPages: book.pageCount || 999,
      totalPages: book.pageCount || undefined
    }
    
  } catch (error) {
    console.error('Error checking book access:', error)
    return {
      level: BookAccess.NONE,
      canReadFull: false,
      canDownload: false,
      canPrint: false,
      previewPages: 0,
      totalPages: 0,
      message: 'Error checking access'
    }
  }
}

/**
 * Check if a user can access a book (simplified check)
 * All authenticated users can access all books
 */
export async function canAccessBook(
  userId: string | undefined,
  bookId: string
): Promise<boolean> {
  if (!userId) return false
  
  // All authenticated users can access all books
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true }
  })
  
  return !!book
}

/**
 * Check if a user can download a book
 * Authenticated users can download if the book allows it
 */
export async function canDownloadBook(
  userId: string | undefined,
  bookId: string
): Promise<boolean> {
  if (!userId) return false
  
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { downloadAllowed: true }
  })
  
  return book?.downloadAllowed ?? false
}

/**
 * Get all accessible books for a user
 * All books are accessible for authenticated users
 */
export async function getAccessibleBooks(userId: string | undefined) {
  // For non-authenticated users, return empty list or preview-only books
  if (!userId) {
    return await prisma.book.findMany({
      where: {
        OR: [
          { previewPages: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        coverImage: true,
        summary: true,
        pageCount: true
      }
    })
  }
  
  // For authenticated users, return all books
  return await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      authorName: true,
      coverImage: true,
      summary: true,
      downloadAllowed: true,
      printAllowed: true,
      pageCount: true,
      category: true,
      ageRange: true,
      language: true,
      publishedAt: true
    }
  })
}

/**
 * Record book access/reading activity
 */
export async function recordBookAccess(
  userId: string,
  bookId: string,
  action: 'view' | 'download' | 'print' = 'view'
) {
  try {
    // Record the access in UserReadingProgress
    await prisma.readingProgress.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId: bookId
        }
      },
      update: {
        lastReadAt: new Date(),
        totalReadingTime: { increment: 1 }
      },
      create: {
        userId,
        storyId: bookId,
        currentPage: 1,
        totalPages: 0,
        percentComplete: 0,
        lastReadAt: new Date(),
        totalReadingTime: 1
      }
    })
    
    console.log(`Recorded ${action} access for book ${bookId} by user ${userId}`)
  } catch (error) {
    console.error('Error recording book access:', error)
  }
}

/**
 * Get user's reading history
 */
export async function getUserReadingHistory(userId: string) {
  return await prisma.readingProgress.findMany({
    where: { userId },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          authorName: true,
          coverImage: true,
          category: true
        }
      }
    },
    orderBy: {
      lastReadAt: 'desc'
    }
  })
}

/**
 * Update reading progress
 */
export async function updateReadingProgress(
  userId: string,
  bookId: string,
  currentPage: number,
  totalPages?: number
) {
  const progress = totalPages ? Math.round((currentPage / totalPages) * 100) : 0
  
  return await prisma.readingProgress.upsert({
    where: {
      userId_storyId: {
        userId,
        storyId: bookId
      }
    },
    update: {
      currentPage,
      totalPages: totalPages || 0,
      percentComplete: progress,
      lastReadAt: new Date()
    },
    create: {
      userId,
      storyId: bookId,
      currentPage,
      totalPages: totalPages || 0,
      percentComplete: progress,
      lastReadAt: new Date(),
      totalReadingTime: 1
    }
  })
}

/**
 * Check access for multiple books at once
 * All authenticated users get full access to all books
 */
export async function checkBatchBookAccess({
  userId,
  bookIds
}: BatchAccessOptions): Promise<BatchAccessResult> {
  // Get all requested books
  const books = await prisma.book.findMany({
    where: {
      id: { in: bookIds }
    },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      previewPages: true,
      pageCount: true,
      downloadAllowed: true,
      printAllowed: true
    }
  })
  
  // Process each book - all are now free to access
  const results: BatchAccessResult = {}
  
  for (const book of books) {
    // All books are free for authenticated users
    if (userId) {
      results[book.id] = {
        level: BookAccess.FREE,
        canReadFull: true,
        canDownload: book.downloadAllowed,
        canPrint: book.printAllowed,
        previewPages: book.pageCount || 999,
        totalPages: book.pageCount || undefined
      }
    } else {
      // Non-authenticated users get preview only
      results[book.id] = {
        level: BookAccess.PREVIEW,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: book.previewPages || 5,
        totalPages: book.pageCount || undefined || undefined,
        message: 'Sign in to read the full book for free'
      }
    }
  }
  
  return results
}

/**
 * Get preview content for a book
 */
export async function getBookPreview(bookId: string, maxPages: number = 5) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      authorName: true,
      summary: true,
      coverImage: true,
      previewPages: true,
      pageCount: true
    }
  })
  
  if (!book) {
    throw new Error('Book not found')
  }
  
  const previewPages = Math.min(
    book.previewPages || maxPages,
    book.pageCount || maxPages
  )
  
  return {
    ...book,
    previewPages,
    isPreview: true
  }
}

/**
 * Check if content requires premium access (legacy - now always returns false)
 */
export async function requiresPremiumAccess(bookId: string): Promise<boolean> {
  // All books are free now
  return false
}

export default {
  checkBookAccess,
  canAccessBook,
  canDownloadBook,
  getAccessibleBooks,
  recordBookAccess,
  getUserReadingHistory,
  updateReadingProgress,
  checkBatchBookAccess,
  getBookPreview,
  requiresPremiumAccess,
  BookAccess
}