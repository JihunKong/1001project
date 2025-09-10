'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  BookOpen, 
  Users, 
  Settings, 
  RotateCcw,
  Eye,
  Calendar,
  Check,
  X,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Gift
} from 'lucide-react'

interface Book {
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
}

interface FeaturedSet {
  id: string
  bookIds: string[]
  startsAt: string
  endsAt: string
  createdAt: string
  isActive: boolean
  rotationType: string
  selectionMethod: string
  creator: {
    id: string
    name: string
    email: string
  }
}

interface FeaturedManagementData {
  currentFeaturedSet: FeaturedSet | null
  currentFeaturedBooks: Book[]
  featuredHistory: FeaturedSet[]
  availableBooks: Book[]
  totalAvailableBooks: number
}

interface GlobalPublicSetting {
  key: string
  value: {
    enabled: boolean
    enabledAt: string | null
    reason: string | null
    duration: number | null
    autoDisableAt: string | null
  }
  description: string
  updatedAt: string | null
  updatedBy: {
    id: string
    name: string
    email: string
  } | null
}

export default function FeaturedManagement() {
  const [data, setData] = useState<FeaturedManagementData | null>(null)
  const [globalPublicSetting, setGlobalPublicSetting] = useState<GlobalPublicSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [featuredResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/featured'),
        fetch('/api/admin/settings/public-reading')
      ])
      
      if (!featuredResponse.ok) {
        throw new Error(`Failed to fetch featured data: ${featuredResponse.statusText}`)
      }
      
      if (!settingsResponse.ok) {
        throw new Error(`Failed to fetch settings: ${settingsResponse.statusText}`)
      }
      
      const featuredData = await featuredResponse.json()
      const settingsData = await settingsResponse.json()
      
      setData(featuredData)
      setGlobalPublicSetting(settingsData.setting)
      
      // Pre-select current featured books
      if (featuredData.currentFeaturedSet) {
        setSelectedBooks(featuredData.currentFeaturedSet.bookIds)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFeaturedSet = async () => {
    if (selectedBooks.length !== 3) {
      alert('Please select exactly 3 books')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookIds: selectedBooks,
          duration: 30 // 30 days
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create featured set: ${response.statusText}`)
      }
      
      const result = await response.json()
      alert('Featured books updated successfully!')
      setShowBookSelector(false)
      await fetchData()
    } catch (err) {
      console.error('Error creating featured set:', err)
      alert(err instanceof Error ? err.message : 'Failed to update featured books')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleGlobalPublic = async (enabled: boolean) => {
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/admin/settings/public-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled,
          reason: enabled ? 'Admin enabled global public reading' : 'Admin disabled global public reading'
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update global setting: ${response.statusText}`)
      }
      
      const result = await response.json()
      alert(`Global public reading ${enabled ? 'enabled' : 'disabled'} successfully!`)
      await fetchData()
    } catch (err) {
      console.error('Error updating global setting:', err)
      alert(err instanceof Error ? err.message : 'Failed to update global setting')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualRotation = async () => {
    if (!confirm('Are you sure you want to trigger a manual rotation? This will replace the current featured books.')) {
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/admin/featured/rotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          force: globalPublicSetting?.value.enabled || false
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to trigger rotation: ${response.statusText}`)
      }
      
      const result = await response.json()
      alert('Manual rotation completed successfully!')
      await fetchData()
    } catch (err) {
      console.error('Error triggering rotation:', err)
      alert(err instanceof Error ? err.message : 'Failed to trigger rotation')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredBooks = data?.availableBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Loading featured books management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Featured Books Management</h1>
          <p className="text-gray-600">Manage the Featured-3 public reading system and global settings</p>
        </div>

        {/* Global Public Reading Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Global Public Reading
              </h2>
              <p className="text-gray-600 mb-4">
                When enabled, all books become publicly accessible to everyone
              </p>
              {globalPublicSetting?.value.enabled && (
                <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  ✅ Currently active - All books are publicly accessible
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleGlobalPublic(!globalPublicSetting?.value.enabled)}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  globalPublicSetting?.value.enabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {globalPublicSetting?.value.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Current Featured Set */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-green-600" />
              Current Featured Books
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleManualRotation}
                disabled={submitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Manual Rotation
              </button>
              <button
                onClick={() => setShowBookSelector(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Select Featured Books
              </button>
            </div>
          </div>

          {data?.currentFeaturedSet ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {data.currentFeaturedBooks.map((book) => (
                  <div key={book.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {book.authorName}</p>
                    <div className="flex flex-wrap gap-1">
                      {book.category.slice(0, 2).map((cat) => (
                        <span key={cat} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p><strong>Period:</strong> {new Date(data.currentFeaturedSet.startsAt).toLocaleDateString()} - {new Date(data.currentFeaturedSet.endsAt).toLocaleDateString()}</p>
                <p><strong>Created by:</strong> {data.currentFeaturedSet.creator.name} ({data.currentFeaturedSet.creator.email})</p>
                <p><strong>Type:</strong> {data.currentFeaturedSet.rotationType} / {data.currentFeaturedSet.selectionMethod}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No featured books currently set</p>
            </div>
          )}
        </motion.div>

        {/* Book Selector Modal */}
        {showBookSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Select Featured Books (3 required)</h3>
                  <button
                    onClick={() => setShowBookSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedBooks.length} / 3
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => {
                        if (selectedBooks.includes(book.id)) {
                          setSelectedBooks(selectedBooks.filter(id => id !== book.id))
                        } else if (selectedBooks.length < 3) {
                          setSelectedBooks([...selectedBooks, book.id])
                        }
                      }}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedBooks.includes(book.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{book.title}</h4>
                          <p className="text-sm text-gray-600">by {book.authorName}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {book.category.slice(0, 2).map((cat) => (
                              <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-2">
                          {selectedBooks.includes(book.id) && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowBookSelector(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFeaturedSet}
                    disabled={selectedBooks.length !== 3 || submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Create Featured Set'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Featured History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Featured Sets History
          </h2>
          
          <div className="space-y-4">
            {data?.featuredHistory.map((set) => (
              <div key={set.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        set.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {set.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(set.startsAt).toLocaleDateString()} - {new Date(set.endsAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Created by {set.creator.name} • {set.rotationType} / {set.selectionMethod}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {set.bookIds.length} books
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}