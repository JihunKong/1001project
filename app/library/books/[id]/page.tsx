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
  Play,
  Lock,
  Crown,
  Globe,
  User,
  AlertCircle,
  ShoppingCart,
  Eye,
  Download,
  Calendar,
  Users,
  MessageSquare,
  Bookmark,
  StarIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import useCartStore, { Product } from '@/lib/cart-store';

const SimplePDFThumbnail = dynamic(() => import('@/components/library/SimplePDFThumbnail'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
    </div>
  )
});

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  author: {
    id: string;
    name: string;
    age?: number;
    location?: string;
    profile?: any;
  };
  publishedDate?: string;
  language: string;
  pageCount?: number;
  readingLevel?: string;
  readingTime?: number;
  category: string[];
  genres?: string[];
  tags: string[];
  coverImage?: string;
  isPremium: boolean;
  featured: boolean;
  price?: number | string;
  rating?: number;
  viewCount: number;
  accessLevel: 'preview' | 'full';
  stats: {
    readers: number;
    bookmarks: number;
    reviews: number;
  };
  // PDF-specific fields
  bookId?: string;
  pdfKey?: string;
  pdfFrontCover?: string;
  pdfBackCover?: string;
  pageLayout?: string;
  previewPages?: number;
  fullPdf?: string;
  samplePdf?: string;
  relatedStories?: Array<{
    id: string;
    title: string;
    authorName: string;
    coverImage?: string;
    isPremium: boolean;
    rating?: number;
    readingTime?: number;
  }>;
}

interface Review {
  id: string;
  userId: string;
  user: {
    name: string;
    image?: string;
  };
  rating: number;
  title?: string;
  comment?: string;
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const addToCart = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
      fetchReviews();
    }
  }, [bookId]);

  useEffect(() => {
    if (session?.user?.id && book) {
      checkBookmarkStatus();
      checkUserReview();
    }
  }, [session, book]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/library/books/${bookId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Book not found');
        } else {
          setError('Failed to load book');
        }
        return;
      }

      const data = await response.json();
      setBook(data);
    } catch (err) {
      setError('Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/library/books/${bookId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/library/bookmarks/${bookId}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error('Failed to check bookmark status:', err);
    }
  };

  const checkUserReview = async () => {
    try {
      const response = await fetch(`/api/library/books/${bookId}/reviews/me`);
      if (response.ok) {
        const data = await response.json();
        if (data.review) {
          setUserReview(data.review);
          setReviewForm({
            rating: data.review.rating,
            title: data.review.title || '',
            comment: data.review.comment || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to check user review:', err);
    }
  };

  const handleBookmark = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/library/bookmarks/${bookId}`, {
        method: bookmarked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && book) {
      try {
        await navigator.share({
          title: book.title,
          text: book.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSubmitReview = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    try {
      const method = userReview ? 'PUT' : 'POST';
      const url = userReview 
        ? `/api/library/books/${bookId}/reviews/${userReview.id}`
        : `/api/library/books/${bookId}/reviews`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserReview(data.review);
        setShowReviewForm(false);
        await fetchReviews();
        await fetchBookDetails(); // Refresh to update average rating
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  const handlePurchase = () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    
    if (!book) return;
    
    // Convert book to cart product format
    const product: Product = {
      id: book.id,
      type: 'digital_book',
      title: book.title,
      creator: {
        name: book.author.name,
        age: book.author.age,
        location: book.author.location || 'Unknown',
        story: book.summary || ''
      },
      price: Number(book.price || 0),
      images: book.coverImage ? [book.coverImage] : [],
      description: book.summary || '',
      impact: {
        metric: 'children reached',
        value: book.stats.readers.toString()
      },
      stock: 999, // Digital books have unlimited stock
      category: book.category,
      featured: book.featured,
      bookId: book.id,
      pdfKey: book.pdfKey,
      pdfFrontCover: book.pdfFrontCover,
      pdfBackCover: book.pdfBackCover,
      pageLayout: book.pageLayout,
      coverImage: book.coverImage
    };
    
    setIsAddingToCart(true);
    addToCart(product, 1);
    
    setTimeout(() => {
      setIsAddingToCart(false);
      router.push('/shop/cart');
    }, 1000);
  };

  const handlePreview = () => {
    router.push(`/library/stories/${bookId}?preview=true`);
  };

  const handleReadFull = () => {
    router.push(`/library/stories/${bookId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The book you are looking for does not exist.'}</p>
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

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const averageRating = Number(book.rating || 0) || (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

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
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Book Cover and Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 flex-shrink-0">
                  <div className="w-full max-w-48 mx-auto aspect-[2/3] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden">
                    <SimplePDFThumbnail
                      bookId={book.id || book.bookId || ''}
                      title={book.title}
                      pdfUrl={book.pdfKey || book.fullPdf || book.samplePdf}
                      existingImage={book.coverImage}
                      className="w-full h-full object-cover"
                      alt={book.title}
                    />
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      {book.isPremium && (
                        <Crown className="w-5 h-5 text-yellow-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {book.title}
                        </h1>
                        {book.subtitle && (
                          <p className="text-lg text-gray-600 mb-3">{book.subtitle}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>
                          By {book.author.name}
                          {book.author.age && `, age ${book.author.age}`}
                        </span>
                      </div>
                      
                      {book.author.location && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{book.author.location}</span>
                        </div>
                      )}
                      
                      {book.publishedDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(book.publishedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{book.readingTime || 15} min read</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{book.pageCount || 'Unknown'} pages</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= averageRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {averageRating > 0 ? Number(averageRating || 0).toFixed(1) : 'No ratings yet'} 
                      ({book.stats.reviews} review{book.stats.reviews !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {book.viewCount.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {book.stats.readers} readers
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-4 h-4" />
                      {book.stats.bookmarks} bookmarks
                    </div>
                  </div>

                  {/* Categories and Tags */}
                  <div>
                    {book.category.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {book.category.map((cat) => (
                          <span 
                            key={cat}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {book.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {book.tags.slice(0, 5).map((tag) => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {book.tags.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{book.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Summary */}
            {book.summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6 mb-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About this Book</h2>
                <p className="text-gray-600 leading-relaxed">
                  {book.summary}
                </p>
              </motion.div>
            )}

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                {session?.user?.id && !userReview && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Write Review
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {userReview ? 'Update Your Review' : 'Write a Review'}
                  </h3>
                  
                  {/* Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewForm.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-400 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Title (optional)
                    </label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Give your review a title"
                    />
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Share your thoughts about this book..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitReview}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {userReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* User's existing review */}
              {userReview && !showReviewForm && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Your Review</span>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= userReview.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                  {userReview.title && (
                    <h4 className="font-medium text-gray-900 mb-1">{userReview.title}</h4>
                  )}
                  {userReview.comment && (
                    <p className="text-gray-700">{userReview.comment}</p>
                  )}
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {review.user.name}
                          </span>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                        )}
                        {review.comment && (
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <button className="hover:text-gray-700">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {reviews.length > 3 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                  </button>
                </div>
              )}

              {reviews.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet. Be the first to review this book!</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Actions and Info */}
          <div className="space-y-6">
            
            {/* Action Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="space-y-4">
                {/* Price */}
                {book.isPremium && book.price && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${Number(book.price || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">One-time purchase</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {book.accessLevel === 'full' ? (
                    <button
                      onClick={handleReadFull}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <BookOpen className="w-5 h-5" />
                      Read Full Book
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handlePreview}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Play className="w-5 h-5" />
                        Preview ({book.previewPages || 5} pages)
                      </button>
                      {book.isPremium && (
                        <div className="space-y-2">
                          <button
                            onClick={handlePurchase}
                            disabled={isAddingToCart}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                              isAddingToCart
                                ? 'bg-green-600 text-white'
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }`}
                          >
                            {isAddingToCart ? (
                              <>
                                <ShoppingCart className="w-5 h-5" />
                                Added to Cart!
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-5 h-5" />
                                Purchase - ${Number(book.price || 0).toFixed(2)}
                              </>
                            )}
                          </button>
                          <Link 
                            href="/shop/subscription"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                          >
                            <Crown className="w-5 h-5" />
                            Get Unlimited Access
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Access Level Indicator */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  {book.accessLevel === 'full' ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <BookOpen className="w-4 h-4" />
                      Full access granted
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-yellow-600 text-sm">
                        <Eye className="w-4 h-4" />
                        Preview access only
                      </div>
                      <div className="text-xs text-gray-600">
                        Read the first {book.previewPages || 10} pages for free
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Book Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Language</span>
                  <span className="font-medium text-gray-900">{book.language}</span>
                </div>
                {book.pageCount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages</span>
                    <span className="font-medium text-gray-900">{book.pageCount}</span>
                  </div>
                )}
                {book.readingLevel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Level</span>
                    <span className="font-medium text-gray-900">{book.readingLevel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading Time</span>
                  <span className="font-medium text-gray-900">{book.readingTime || 15} minutes</span>
                </div>
                {book.publishedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published</span>
                    <span className="font-medium text-gray-900">
                      {new Date(book.publishedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Related Books */}
            {book.relatedStories && book.relatedStories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Books</h3>
                <div className="space-y-3">
                  {book.relatedStories.slice(0, 3).map((relatedBook) => (
                    <Link
                      key={relatedBook.id}
                      href={`/library/books/${relatedBook.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {relatedBook.title}
                          </h4>
                          <p className="text-xs text-gray-600">
                            By {relatedBook.authorName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {relatedBook.isPremium && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {relatedBook.readingTime} min
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