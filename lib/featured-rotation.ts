import { prisma } from '@/lib/prisma'

/**
 * Utility functions for Featured-3 book rotation system
 */

export interface FeaturedRotationResult {
  success: boolean
  featuredSetId?: string
  selectedBooks?: Array<{
    id: string
    title: string
    authorName: string
  }>
  error?: string
  previousSetId?: string
}

/**
 * Selects 3 random books for featured rotation
 * Implements diversity logic to ensure variety
 */
export async function selectRandomFeaturedBooks(): Promise<{ bookIds: string[], books: any[] }> {
  // Get all published books
  const allBooks = await prisma.book.findMany({
    where: {
      isPublished: true
    },
    select: {
      id: true,
      title: true,
      authorName: true,
      language: true,
      category: true,
      tags: true,
      viewCount: true,
      createdAt: true
    }
  })

  if (allBooks.length < 3) {
    throw new Error('Not enough published books for featured rotation')
  }

  // Get books from the last 3 featured sets to avoid immediate repetition
  const recentFeaturedSets = await prisma.featuredSet.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 3
  })

  const recentlyFeaturedBookIds = new Set(
    recentFeaturedSets.flatMap(set => set.bookIds)
  )

  // Filter out recently featured books
  const availableBooks = allBooks.filter(book => !recentlyFeaturedBookIds.has(book.id))

  // If we don't have enough non-recent books, use all books
  const candidateBooks = availableBooks.length >= 3 ? availableBooks : allBooks

  // Implement diversity selection algorithm
  const selectedBooks = selectDiverseBooks(candidateBooks, 3)

  return {
    bookIds: selectedBooks.map(book => book.id),
    books: selectedBooks
  }
}

/**
 * Selects diverse books based on language, category, and other factors
 */
function selectDiverseBooks(books: any[], count: number): any[] {
  if (books.length <= count) {
    return books
  }

  const selected: any[] = []
  const remaining = [...books]

  // Group books by language and category for diversity
  const languageGroups = groupBy(remaining, 'language')
  const categoryGroups = groupBy(remaining, book => book.category[0] || 'uncategorized')

  // Try to get one book from different languages first
  const languages = Object.keys(languageGroups)
  for (let i = 0; i < Math.min(count, languages.length); i++) {
    const language = languages[i]
    const booksInLanguage = languageGroups[language]
    const randomBook = booksInLanguage[Math.floor(Math.random() * booksInLanguage.length)]
    
    selected.push(randomBook)
    
    // Remove selected book from remaining
    const index = remaining.findIndex(book => book.id === randomBook.id)
    if (index > -1) {
      remaining.splice(index, 1)
    }
  }

  // Fill remaining slots with random books, preferring different categories
  while (selected.length < count && remaining.length > 0) {
    // Try to find a book from a different category than already selected
    const selectedCategories = new Set(selected.map(book => book.category[0] || 'uncategorized'))
    
    let nextBook = remaining.find(book => {
      const bookCategory = book.category[0] || 'uncategorized'
      return !selectedCategories.has(bookCategory)
    })

    // If no different category available, pick randomly
    if (!nextBook) {
      nextBook = remaining[Math.floor(Math.random() * remaining.length)]
    }

    selected.push(nextBook)
    
    // Remove selected book from remaining
    const index = remaining.findIndex(book => book.id === nextBook.id)
    if (index > -1) {
      remaining.splice(index, 1)
    }
  }

  return selected
}

/**
 * Utility function to group array by key
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Performs the monthly featured book rotation
 */
export async function performMonthlyRotation(): Promise<FeaturedRotationResult> {
  try {
    // Get current active featured set
    const currentFeaturedSet = await prisma.featuredSet.findFirst({
      where: {
        isActive: true
      }
    })

    // Select new featured books
    const { bookIds, books } = await selectRandomFeaturedBooks()

    // Deactivate current featured set
    if (currentFeaturedSet) {
      await prisma.featuredSet.update({
        where: {
          id: currentFeaturedSet.id
        },
        data: {
          isActive: false
        }
      })
    }

    // Create new featured set
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    
    // Find or create a system user for automated rotations
    let systemUser = await prisma.user.findFirst({
      where: {
        email: 'system@1001stories.org'
      }
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@1001stories.org',
          name: 'System Automation',
          role: 'ADMIN'
        }
      })
    }

    const newFeaturedSet = await prisma.featuredSet.create({
      data: {
        bookIds,
        startsAt: now,
        endsAt: nextMonth,
        createdBy: systemUser.id,
        isActive: true,
        rotationType: 'MONTHLY',
        selectionMethod: 'RANDOM'
      }
    })

    console.log('Monthly featured rotation completed:', {
      previousSetId: currentFeaturedSet?.id,
      newSetId: newFeaturedSet.id,
      selectedBooks: books.map(book => ({ id: book.id, title: book.title, author: book.authorName })),
      timestamp: now.toISOString()
    })

    return {
      success: true,
      featuredSetId: newFeaturedSet.id,
      selectedBooks: books.map(book => ({
        id: book.id,
        title: book.title,
        authorName: book.authorName
      })),
      previousSetId: currentFeaturedSet?.id
    }

  } catch (error) {
    console.error('Error performing monthly rotation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Checks if automatic rotation should be disabled
 * (e.g., if global public reading is enabled)
 */
export async function shouldSkipRotation(): Promise<boolean> {
  try {
    const globalPublicSetting = await prisma.platformSetting.findUnique({
      where: { key: 'global_public_reading' }
    })

    // Skip rotation if global public reading is enabled
    if (globalPublicSetting?.valueJson) {
      const setting = globalPublicSetting.valueJson as any
      if (setting.enabled) {
        console.log('Skipping featured rotation: Global public reading is enabled')
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking rotation skip conditions:', error)
    return false
  }
}