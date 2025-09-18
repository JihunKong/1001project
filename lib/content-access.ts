/**
 * Content Access Control Module
 * 
 * Manages access to stories and content in the free library system.
 * All content is now freely accessible to authenticated users.
 */

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export enum ContentAccess {
  NONE = 'none',
  FREE = 'free',
  PREVIEW = 'preview',
  SUBSCRIBED = 'subscribed', 
  PURCHASED = 'purchased'
}

export interface ContentAccessLevel {
  level: ContentAccess
  canReadFull: boolean
  canDownload: boolean
  canPrint: boolean
  previewPages: number
  totalPages?: number
  message?: string
}

export interface ContentAccessOptions {
  userId?: string
  storyId: string
}

/**
 * Check access level for a single story
 * All authenticated users now have full access to all content
 */
export async function checkContentAccess({
  userId,
  storyId,
}: ContentAccessOptions): Promise<ContentAccessLevel> {
  try {
    // Get story details
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        price: true,
        isPremium: true,
      }
    })
    
    if (!story) {
      return {
        level: ContentAccess.NONE,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: 0,
        totalPages: 0,
        message: 'Story not found'
      }
    }
    
    // Non-authenticated users get preview only
    if (!userId) {
      return {
        level: ContentAccess.PREVIEW,
        canReadFull: false,
        canDownload: false,
        canPrint: false,
        previewPages: 1,
        totalPages: 10,
        message: 'Sign in to read the full story for free'
      }
    }
    
    // All stories are now free to access in the library
    // Return full access for all authenticated users
    return {
      level: ContentAccess.FREE,
      canReadFull: true,
      canDownload: true,
      canPrint: true,
      previewPages: 999,
      totalPages: 999
    }
    
  } catch (error) {
    console.error('Error checking content access:', error)
    return {
      level: ContentAccess.NONE,
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
 * Check if a user can access a story (simplified check)
 * All authenticated users can access all stories
 */
export async function canAccessContent(
  userId: string | undefined,
  storyId: string
): Promise<boolean> {
  if (!userId) return false
  
  // All authenticated users can access all content
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true }
  })
  
  return !!story
}

/**
 * Check if a user can download content
 * All authenticated users can download content
 */
export async function canDownloadContent(
  userId: string | undefined,
  storyId: string
): Promise<boolean> {
  return userId ? true : false
}

/**
 * Get all accessible stories for a user
 * All stories are accessible for authenticated users
 */
export async function getAccessibleContent(userId: string | undefined) {
  // For non-authenticated users, return preview-only content
  if (!userId) {
    return await prisma.story.findMany({
      where: {
        isPremium: false
      },
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        summary: true,
      }
    })
  }
  
  // For authenticated users, return all stories
  return await prisma.story.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      coverImage: true,
      summary: true,
      category: true,
      language: true,
      publishedDate: true
    }
  })
}

/**
 * Record content access/reading activity
 */
export async function recordContentAccess(
  userId: string,
  storyId: string,
  action: 'view' | 'download' | 'print' = 'view'
) {
  try {
    // Record the access in ReadingProgress
    await prisma.readingProgress.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      },
      update: {
        lastReadAt: new Date(),
        totalReadingTime: { increment: 1 }
      },
      create: {
        userId,
        storyId,
        currentChapter: 1,
        percentComplete: 0,
        lastReadAt: new Date(),
        totalReadingTime: 1
      }
    })
    
    console.log(`Recorded ${action} access for story ${storyId} by user ${userId}`)
  } catch (error) {
    console.error('Error recording content access:', error)
  }
}

/**
 * Get user's reading history
 */
export async function getUserContentHistory(userId: string) {
  return await prisma.readingProgress.findMany({
    where: { userId },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          author: true,
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
export async function updateContentProgress(
  userId: string,
  storyId: string,
  currentChapter: number,
  totalPages?: number
) {
  const progress = totalPages ? Math.round((currentChapter / totalPages) * 100) : 0
  
  return await prisma.readingProgress.upsert({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    },
    update: {
      currentChapter,
      percentComplete: progress,
      lastReadAt: new Date()
    },
    create: {
      userId,
      storyId,
      currentChapter,
      percentComplete: progress,
      lastReadAt: new Date(),
      totalReadingTime: 1
    }
  })
}

/**
 * Get preview content for a story
 */
export async function getContentPreview(storyId: string, maxChapters: number = 1) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: {
      id: true,
      title: true,
      author: true,
      summary: true,
      coverImage: true,
    }
  })
  
  if (!story) {
    throw new Error('Story not found')
  }
  
  const previewChapters = maxChapters
  
  return {
    ...story,
    previewChapters: maxChapters,
    isPreview: true
  }
}

/**
 * Check if content requires premium access (legacy - now always returns false)
 */
export async function requiresPremiumContent(storyId: string): Promise<boolean> {
  // All content is free now
  return false
}

export default {
  checkContentAccess,
  canAccessContent,
  canDownloadContent,
  getAccessibleContent,
  recordContentAccess,
  getUserContentHistory,
  updateContentProgress,
  getContentPreview,
  requiresPremiumContent,
  ContentAccess
}