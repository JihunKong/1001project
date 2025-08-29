'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  Crown, 
  BookOpen, 
  Clock, 
  Star,
  CreditCard,
  Zap,
  ArrowRight,
  Eye,
  Heart
} from 'lucide-react'
import { useContentAccess } from '@/lib/hooks/useContentAccess'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface StoryPreviewProps {
  storyId: string
  title: string
  content: string
  isPremium: boolean
  price?: number
  currency?: string
  authorName: string
  authorAge?: number
  readingTime?: number
  rating?: number
  coverImage?: string
  onUpgrade?: () => void
}

export default function StoryPreview({
  storyId,
  title,
  content,
  isPremium,
  price,
  currency = 'USD',
  authorName,
  authorAge,
  readingTime,
  rating,
  coverImage,
  onUpgrade
}: StoryPreviewProps) {
  const { data: session } = useSession()
  const { accessLevel, loading, trackPreview, purchaseStory } = useContentAccess(storyId)
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null)
  const [scrollPercentage, setScrollPercentage] = useState(0)
  const [purchasing, setPurchasing] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const hasTrackedPreview = useRef(false)

  // Track reading time and scroll
  useEffect(() => {
    if (accessLevel?.canRead && !hasTrackedPreview.current) {
      setReadingStartTime(Date.now())
    }
  }, [accessLevel])

  // Handle scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const element = contentRef.current
      const scrollTop = window.pageYOffset
      const elementTop = element.offsetTop
      const elementHeight = element.offsetHeight
      const windowHeight = window.innerHeight

      const scrollStart = elementTop - windowHeight
      const scrollEnd = elementTop + elementHeight
      const scrollRange = scrollEnd - scrollStart

      if (scrollTop > scrollStart && scrollTop < scrollEnd) {
        const scrolled = scrollTop - scrollStart
        const percentage = Math.min(100, Math.max(0, (scrolled / scrollRange) * 100))
        setScrollPercentage(percentage)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track preview when user reaches significant engagement
  useEffect(() => {
    if (
      accessLevel?.level === 'preview' && 
      readingStartTime && 
      scrollPercentage > 80 && 
      !hasTrackedPreview.current
    ) {
      const timeSpent = Date.now() - readingStartTime
      
      if (timeSpent > 30000) { // 30 seconds
        trackPreview(storyId, {
          timeSpent: Math.floor(timeSpent / 1000),
          scrollPercentage,
          source: 'story-preview'
        })
        hasTrackedPreview.current = true
        
        // Show upgrade modal after significant engagement
        if (isPremium && !session?.user) {
          setTimeout(() => setShowUpgradeModal(true), 2000)
        }
      }
    }
  }, [scrollPercentage, readingStartTime, accessLevel, trackPreview, storyId, isPremium, session])

  const handlePurchase = async () => {
    if (!session?.user) {
      // Redirect to signup
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`
      return
    }

    setPurchasing(true)
    try {
      await purchaseStory(storyId)
      setShowUpgradeModal(false)
    } catch (error) {
      console.error('Purchase failed:', error)
      // Handle error (show toast, etc.)
    } finally {
      setPurchasing(false)
    }
  }

  // Get displayable content based on access level
  const getDisplayContent = () => {
    if (!accessLevel) return ''

    if (accessLevel.canRead && accessLevel.previewPercentage === 100) {
      return content
    }

    if (accessLevel.level === 'preview') {
      const previewLength = Math.floor(content.length * (accessLevel.previewPercentage / 100))
      let previewContent = content.substring(0, previewLength)
      
      // Try to end at a sentence for better UX
      const lastSentence = previewContent.lastIndexOf('.')
      if (lastSentence > previewLength * 0.8) {
        previewContent = previewContent.substring(0, lastSentence + 1)
      }
      
      return previewContent
    }

    return ''
  }

  const displayContent = getDisplayContent()
  const isPreviewMode = accessLevel?.level === 'preview'
  const showPaywall = isPreviewMode && scrollPercentage > 70

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Story Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {isPremium && (
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <Crown className="w-4 h-4" />
              Premium
            </div>
          )}
          
          {isPreviewMode && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <Eye className="w-4 h-4" />
              Preview Mode
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>By {authorName}{authorAge && `, age ${authorAge}`}</span>
          {readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </div>
          )}
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {rating}
            </div>
          )}
        </div>

        {isPreviewMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Reading Preview</h3>
                <p className="text-sm text-blue-800">
                  You're reading the first {accessLevel?.previewPercentage}% of this story. 
                  {isPremium && price && (
                    <span> Purchase for ${price} or subscribe to read the full story.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Story Content */}
      <div ref={contentRef} className="relative">
        <div className="prose prose-lg max-w-none">
          {displayContent.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Paywall Gradient Overlay */}
        {isPreviewMode && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}

        {/* Upgrade CTA */}
        <AnimatePresence>
          {showPaywall && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="sticky bottom-0 bg-white border-t border-gray-200 p-6 mt-8"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Continue Reading
                </h3>
                <p className="text-gray-600 mb-4">
                  Unlock the full story and support young authors worldwide
                </p>
                
                <div className="flex items-center justify-center gap-4">
                  {isPremium && price && (
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      {purchasing ? 'Processing...' : `Buy for $${price}`}
                    </button>
                  )}
                  
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Subscribe for unlimited reading
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  100% of profits support education in underserved communities
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-blue-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enjoying the story?
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Unlock the full story and discover thousands more from young authors around the world.
                </p>
                
                <div className="space-y-3">
                  {isPremium && price && (
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      {purchasing ? 'Processing...' : `Buy this story for $${price}`}
                    </button>
                  )}
                  
                  <Link
                    href="/pricing"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Start unlimited reading
                  </Link>
                  
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Continue preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}