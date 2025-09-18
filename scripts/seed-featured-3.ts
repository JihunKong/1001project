#!/usr/bin/env tsx
/**
 * Seed script for Featured-3 public reading system
 * Creates initial featured book set and system user
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Featured-3 system...')

  try {
    // 1. Find or create system user for automated processes
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
      console.log('✅ Created system user')
    } else {
      console.log('📍 System user already exists')
    }

    // 2. Get available published books
    const publishedBooks = await prisma.book.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        language: true,
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (publishedBooks.length < 3) {
      console.log('⚠️ Not enough published books (need at least 3). Currently have:', publishedBooks.length)
      console.log('📚 Available books:', publishedBooks.map(b => `"${b.title}" by ${b.authorName}`))
      
      // If we don't have enough books, just log and exit gracefully
      if (publishedBooks.length === 0) {
        console.log('❌ No published books found. Please add some books first.')
        return
      }
    }

    // 3. Select diverse books for featured set
    const selectDiverseBooks = (books: typeof publishedBooks, count: number) => {
      if (books.length <= count) {
        return books
      }

      const selected: typeof publishedBooks = []
      const remaining = [...books]

      // Group by language for diversity
      const languageGroups: Record<string, typeof publishedBooks> = {}
      remaining.forEach(book => {
        if (!languageGroups[book.language]) {
          languageGroups[book.language] = []
        }
        languageGroups[book.language].push(book)
      })

      // Try to get books from different languages
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

      // Fill remaining slots with random books
      while (selected.length < count && remaining.length > 0) {
        const randomIndex = Math.floor(Math.random() * remaining.length)
        const randomBook = remaining[randomIndex]
        selected.push(randomBook)
        remaining.splice(randomIndex, 1)
      }

      return selected
    }

    const targetCount = Math.min(3, publishedBooks.length)
    const selectedBooks = selectDiverseBooks(publishedBooks, targetCount)
    const selectedBookIds = selectedBooks.map(book => book.id)

    console.log('📖 Selected books for featured set:')
    selectedBooks.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" by ${book.authorName} (${book.language})`)
    })

    // 4. Check if there's already an active featured set
    const existingFeaturedSet = await prisma.featuredSet.findFirst({
      where: {
        isActive: true
      }
    })

    if (existingFeaturedSet) {
      console.log('📍 Active featured set already exists. Deactivating...')
      await prisma.featuredSet.update({
        where: {
          id: existingFeaturedSet.id
        },
        data: {
          isActive: false
        }
      })
    }

    // 5. Create new featured set
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const featuredSet = await prisma.featuredSet.create({
      data: {
        bookIds: selectedBookIds,
        startsAt: now,
        endsAt: nextMonth,
        createdBy: systemUser.id,
        isActive: true,
        rotationType: 'MONTHLY',
        selectionMethod: 'RANDOM'
      }
    })

    console.log('✅ Created featured set:', featuredSet.id)
    console.log(`📅 Active period: ${featuredSet.startsAt.toISOString()} to ${featuredSet.endsAt.toISOString()}`)

    // 6. Initialize global public reading setting (disabled by default)
    const existingSetting = await prisma.platformSetting.findUnique({
      where: { key: 'global_public_reading' }
    })

    if (!existingSetting) {
      await prisma.platformSetting.create({
        data: {
          key: 'global_public_reading',
          valueJson: {
            enabled: false,
            enabledAt: null,
            reason: null,
            duration: null,
            autoDisableAt: null
          },
          description: 'Global toggle to make all books publicly accessible',
          updatedBy: systemUser.id
        }
      })
      console.log('✅ Initialized global public reading setting (disabled)')
    } else {
      console.log('📍 Global public reading setting already exists')
    }

    console.log('🎉 Featured-3 system seeded successfully!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`- Featured books: ${selectedBooks.length}`)
    console.log(`- System user: ${systemUser.email}`)
    console.log(`- Featured set ID: ${featuredSet.id}`)
    console.log('')
    console.log('🚀 You can now:')
    console.log('1. Visit /library to see the Featured-3 section')
    console.log('2. Visit /admin/featured to manage featured books')
    console.log('3. Use the admin panel to manually rotate or toggle global access')

  } catch (error) {
    console.error('❌ Error seeding Featured-3 system:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })