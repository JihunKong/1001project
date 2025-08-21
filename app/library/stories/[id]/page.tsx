'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Star, 
  Heart,
  Share2,
  Download,
  Eye,
  Users,
  Crown,
  Globe,
  Tag,
  Calendar,
  User,
  AlertCircle,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { resolveBookFiles } from '@/lib/book-files';

const EnhancedPDFViewer = dynamic(
  () => import('@/components/library/EnhancedPDFViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="animate-pulse">
          <div className="w-full h-96 bg-gray-200 rounded-lg mb-4"></div>
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
);

interface Story {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  contentPreview?: string;
  summary?: string;
  author: {
    id: string;
    name: string;
    age?: number;
    location?: string;
    profile?: any;
  };
  publishedDate: string;
  language: string;
  pageCount?: number;
  readingLevel?: string;
  readingTime?: number;
  category: string[];
  genres?: string[];
  tags: string[];
  coverImage?: string;
  samplePdf?: string;
  fullPdf?: string;
  pdfFrontCover?: string;
  pdfBackCover?: string;
  pageLayout?: string;
  isPremium: boolean;
  featured: boolean;
  price?: number;
  rating?: number;
  viewCount: number;
  likeCount: number;
  accessLevel: 'preview' | 'full';
  userProgress?: {
    currentPage: number;
    progress: number;
    lastReadAt: string;
    timeSpent: number;
  };
  stats: {
    readers: number;
    bookmarks: number;
    reviews: number;
  };
  relatedStories: Array<{
    id: string;
    title: string;
    authorName: string;
    coverImage?: string;
    isPremium: boolean;
    rating?: number;
    readingTime?: number;
  }>;
}

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/library/books/${storyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Story not found');
        } else {
          setError('Failed to load story');
        }
        return;
      }

      const data = await response.json();
      setStory(data);
      
      // Check if bookmarked (if user is logged in)
      if (session?.user?.id) {
        checkBookmarkStatus();
      }
    } catch (err) {
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/library/bookmarks/${storyId}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error('Failed to check bookmark status:', err);
    }
  };

  const handleBookmark = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/library/bookmarks/${storyId}`, {
        method: bookmarked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handlePurchase = () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    setShowPurchaseModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title,
          text: story?.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const onProgressUpdate = (progress: number) => {
    if (story) {
      setStory(prev => prev ? {
        ...prev,
        userProgress: {
          ...prev.userProgress,
          progress,
          currentPage: Math.ceil((progress / 100) * (story.pageCount || 1)),
          lastReadAt: new Date().toISOString(),
          timeSpent: (prev.userProgress?.timeSpent || 0) + 30 // Estimate 30 seconds per update
        }
      } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The story you are looking for does not exist.'}</p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const canReadFull = story.accessLevel === 'full';
  const pdfUrl = canReadFull ? story.fullPdf : story.samplePdf;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/library"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Library
            </Link>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - PDF Viewer */}
          <div className="lg:col-span-2">
            {pdfUrl ? (
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <EnhancedPDFViewer
                  pdfUrl={pdfUrl}
                  title={story.title}
                  isAuthenticated={!!session}
                  maxPages={story.accessLevel === 'full' ? undefined : 10}
                  pageLayout={(story.pageLayout as 'single' | 'double') || 'single'}
                  onClose={() => router.push('/library')}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Not Available</h3>
                <p className="text-gray-600">
                  This story's PDF is currently not available for viewing.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Story Info */}
          <div className="space-y-6">
            
            {/* Story Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                {story.isPremium && (
                  <Crown className="w-5 h-5 text-yellow-500 mt-1" />
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {story.title}
                  </h1>
                  {story.subtitle && (
                    <p className="text-lg text-gray-600 mb-3">{story.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    By {story.author.name}
                    {story.author.age && `, age ${story.author.age}`}
                  </span>
                </div>
                
                {story.author.location && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span>{story.author.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(story.publishedDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{story.readingTime || 15} min read</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{story.rating?.toFixed(1) || 'Not rated'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>{story.viewCount.toLocaleString()} views</span>
                </div>
              </div>

              {/* Access Level Indicator */}
              <div className="mt-4 pt-4 border-t">
                {story.accessLevel === 'full' ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <BookOpen className="w-4 h-4" />
                    Full access
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600 text-sm">
                      <Eye className="w-4 h-4" />
                      Preview only
                    </div>
                    <button
                      onClick={handlePurchase}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      {story.isPremium ? 'Subscribe or Purchase' : 'Get Full Access'}
                    </button>
                  </div>
                )}
              </div>

              {/* Reading Progress */}
              {story.userProgress && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Reading Progress</span>
                    <span className="font-medium">{Math.round(story.userProgress.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${story.userProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Page {story.userProgress.currentPage} of {story.pageCount}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Summary */}
            {story.summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {story.summary}
                </p>
              </motion.div>
            )}

            {/* Categories and Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories & Tags</h3>
              
              {story.category.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {story.category.map((cat) => (
                      <span 
                        key={cat}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {story.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{story.stats.readers}</div>
                  <div className="text-xs text-gray-600">Readers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{story.stats.bookmarks}</div>
                  <div className="text-xs text-gray-600">Bookmarks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{story.stats.reviews}</div>
                  <div className="text-xs text-gray-600">Reviews</div>
                </div>
              </div>
            </motion.div>

            {/* Related Stories */}
            {story.relatedStories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Stories</h3>
                <div className="space-y-3">
                  {story.relatedStories.slice(0, 3).map((relatedStory) => (
                    <Link
                      key={relatedStory.id}
                      href={`/library/stories/${relatedStory.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {relatedStory.title}
                          </h4>
                          <p className="text-xs text-gray-600">
                            By {relatedStory.authorName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {relatedStory.isPremium && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {relatedStory.readingTime} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}