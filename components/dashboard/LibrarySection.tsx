'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Crown, 
  Play, 
  Clock, 
  Star, 
  Download, 
  Filter,
  ChevronRight,
  MoreHorizontal,
  Bookmark,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useMyLibrary } from '@/lib/hooks/useMyLibrary'
import type { LibraryStory } from '@/lib/hooks/useMyLibrary'

interface LibrarySectionProps {
  className?: string
  maxItems?: number
  showFilters?: boolean
  showPagination?: boolean
}

export default function LibrarySection({ 
  className = '', 
  maxItems = 6, 
  showFilters = false,
  showPagination = false 
}: LibrarySectionProps) {
  const {
    stories,
    pagination,
    subscription,
    stats,
    loading,
    error,
    isEmpty,
    setFilters,
    nextPage,
    prevPage,
    refresh
  } = useMyLibrary({
    initialLimit: maxItems,
    autoFetch: true
  })

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'reading' | 'completed'>('all')

  const handleFilterChange = (filter: 'all' | 'reading' | 'completed') => {
    setSelectedFilter(filter)
    setFilters({
      status: filter === 'all' ? undefined : filter as 'reading' | 'completed'
    })
  }

  const StoryCard = ({ story }: { story: LibraryStory }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all group"
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Story Cover */}
          <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex-shrink-0 flex items-center justify-center relative">
            <BookOpen className="w-6 h-6 text-blue-600 opacity-60" />
            {story.isPremium && (
              <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
            )}
          </div>

          {/* Story Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                {story.title}
              </h3>
              <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mb-2">By {story.authorName}</p>
            
            {/* Progress Bar */}
            {story.progress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{story.progress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${story.progress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href={`/library/books/${story.id}`}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Play className="w-3 h-3" />
                {story.progress?.progress === 100 ? 'Re-read' : 'Continue'}
              </Link>
              
              {story.canDownload && (
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download className="w-3 h-3" />
                  PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Story Metadata */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {story.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{story.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{story.readingTime || 5}m</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
              story.accessType === 'purchased' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {story.accessType === 'purchased' ? 'Purchased' : 'Subscription'}
            </span>
            {story.latestBookmark && (
              <Bookmark className="w-3 h-3 text-blue-500" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (loading && !stories.length) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your library...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading library</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stories yet</h3>
          <p className="text-gray-600 mb-4">Start building your library by exploring stories or subscribing to premium content.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/library"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore Stories
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Get Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Library</h2>
          <p className="text-sm text-gray-600">
            {stats.totalPurchased + stats.totalSubscriptionAccess} stories • {stats.currentlyReading} currently reading
          </p>
        </div>
        <Link 
          href="/library"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Subscription Status */}
      {subscription && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">{subscription.plan} Plan</p>
                <p className="text-sm text-gray-600">
                  {subscription.canAccessPremium ? 'Full access to premium stories' : 'Basic access'}
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Manage
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{stats.totalPurchased}</p>
          <p className="text-xs text-gray-600">Purchased</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{stats.currentlyReading}</p>
          <p className="text-xs text-gray-600">Reading</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{stats.totalSubscriptionAccess}</p>
          <p className="text-xs text-gray-600">Premium</p>
        </div>
      </div>

      {/* Filter Buttons */}
      {showFilters && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'reading', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter as 'all' | 'reading' | 'completed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === filter
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'reading' ? 'Reading' : 'Completed'}
            </button>
          ))}
        </div>
      )}

      {/* Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={prevPage}
            disabled={!pagination.hasPrev || loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={!pagination.hasNext || loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}