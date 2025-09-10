'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Star, 
  Globe, 
  Users, 
  Eye, 
  Clock,
  Gift,
  ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface FeaturedBook {
  id: string
  title: string
  authorName: string
  summary?: string
  language: string
  category: string[]
  tags: string[]
  coverImage?: string
  pageCount?: number
  rating?: number
  viewCount?: number
  createdAt: string
  hasAccess: boolean
  accessLevel: 'free' | 'preview'
  isFeatured: boolean
  content?: string
}

interface FeaturedResponse {
  success: boolean
  isGlobalPublic: boolean
  featuredBooks: FeaturedBook[]
  allBooks: FeaturedBook[]
  featuredSetId?: string
  featuredPeriod?: {
    startsAt: string
    endsAt: string
    rotationType: string
    selectionMethod: string
  }
  message: string
}

export default function Featured3Section() {
  const [featuredData, setFeaturedData] = useState<FeaturedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/library/featured')
      if (!response.ok) {
        throw new Error(`Failed to fetch featured books: ${response.statusText}`)
      }
      
      const data: FeaturedResponse = await response.json()
      setFeaturedData(data)
    } catch (err) {
      console.error('Error fetching featured books:', err)
      setError(err instanceof Error ? err.message : 'Failed to load featured books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedBooks()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading featured books...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-8 bg-red-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️ {error}</div>
            <button
              onClick={fetchFeaturedBooks}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!featuredData) {
    return null
  }

  // Handle global public mode
  if (featuredData.isGlobalPublic) {
    return (
      <section className="py-16 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              Special Promotion Active
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              🎉 All Books Free to Read!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {featuredData.message}
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-all transform hover:scale-105 font-medium"
            >
              <BookOpen className="w-5 h-5" />
              Explore All Books
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    )
  }

  // Handle no featured books
  if (featuredData.featuredBooks.length === 0) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p>No featured books are currently available</p>
          </div>
        </div>
      </section>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Featured - Free to Read
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            This Month's Featured Stories
          </h2>
          <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
            {featuredData.message}
          </p>
          {featuredData.featuredPeriod && (
            <p className="text-sm text-gray-500">
              Featured until {formatDate(featuredData.featuredPeriod.endsAt)}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredData.featuredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Book Cover or Placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">📚</div>
                )}
                <div className="absolute top-3 right-3">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    FREE
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {book.title}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {book.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {book.language.toUpperCase()}
                  </span>
                </div>

                {book.summary && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {book.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {book.category.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                  {book.tags?.slice(0, 1).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  {book.pageCount && (
                    <span className="flex items-center gap-1">
                      📄 {book.pageCount} pages
                    </span>
                  )}
                  {book.viewCount && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {book.viewCount}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/library/books/${book.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Now - FREE
                  </Link>
                  <Link
                    href={`/library/books/${book.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want access to our full library?
            </h3>
            <p className="text-gray-600 mb-6">
              Join our community to discover thousands of inspiring stories from children worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Users className="w-5 h-5" />
                Join Free
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Browse All Books
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}