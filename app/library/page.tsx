'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Heart,
  Globe,
  Star,
  Play,
  Lock,
  Crown,
  ArrowRight,
  Users,
  Clock,
  Loader2,
  Grid3X3,
  Library as LibraryIcon
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/lib/hooks/useContentAccess';
import EnhancedPDFThumbnailWrapper from '@/components/shop/EnhancedPDFThumbnailWrapper';
import SimpleBookCard from '@/components/library/SimpleBookCard';
import BookshelfView from '@/components/library/BookshelfView';

interface Book {
  id: string
  title: string
  subtitle?: string
  summary?: string
  author: {
    name: string
    age?: number
    location?: string
  }
  language: string
  category: string[]
  tags: string[]
  ageRange?: string
  readingTime?: number
  coverImage?: string
  isPremium: boolean
  isFeatured: boolean
  price?: number
  rating?: number
  accessLevel: 'preview' | 'full'
  stats: {
    readers: number
    bookmarks: number
  }
  // PDF-specific fields
  bookId?: string
  pdfKey?: string
  pdfFrontCover?: string
  pdfBackCover?: string
  pageLayout?: string
  previewPages?: number
  fullPdf?: string
  samplePdf?: string
}

interface BooksResponse {
  books: Book[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasMore: boolean
    limit: number
  }
}

export default function Library() {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const { subscription } = useSubscription();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'bookshelf'>('cards');
  
  // Static filter options (could be fetched from API in the future)
  const filters = {
    categories: [
      { value: 'Adventure', count: 0 },
      { value: 'Educational', count: 0 },
      { value: 'Fantasy', count: 0 },
      { value: 'Biography', count: 0 },
      { value: 'Science', count: 0 },
      { value: 'History', count: 0 }
    ],
    languages: [
      { value: 'en', count: 0 },
      { value: 'es', count: 0 },
      { value: 'fr', count: 0 },
      { value: 'ko', count: 0 }
    ],
    ageGroups: [
      { value: '3-5', count: 0 },
      { value: '6-8', count: 0 },
      { value: '9-12', count: 0 },
      { value: '13-15', count: 0 }
    ]
  };

  // Fetch books from API
  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });
      
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedLanguage !== 'all') params.set('language', selectedLanguage);
      if (selectedAge !== 'all') params.set('ageGroup', selectedAge);
      
      const response = await fetch(`/api/library/books?${params}`);
      
      if (!response.ok) {
        // Handle different error cases
        if (response.status === 401) {
          throw new Error('AUTHENTICATION_REQUIRED');
        } else if (response.status === 403) {
          throw new Error('NO_PURCHASED_BOOKS');
        } else {
          throw new Error('FETCH_ERROR');
        }
      }
      
      const data: BooksResponse = await response.json();
      setBooks(data.books || []);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'FETCH_ERROR';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch books when page or filters change
  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchTerm, selectedCategory, selectedLanguage, selectedAge]);
  
  // Reset to first page when filters change (not page)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedLanguage, selectedAge]);

  const BookCard = ({ book }: { book: Book }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-2"
    >
      <div className="relative">
        <div className="aspect-[2/3] bg-gradient-to-br from-blue-100 to-purple-100">
          {book.pdfKey && book.bookId ? (
            <EnhancedPDFThumbnailWrapper
              bookId={book.bookId}
              title={book.title}
              className="w-full h-full"
              alt={book.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-blue-600 opacity-50" />
            </div>
          )}
        </div>
        {book.isPremium && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        )}
        {book.isFeatured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            <Star className="w-3 h-3" />
            Featured
          </div>
        )}
        {book.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            {book.rating?.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Globe className="w-4 h-4" />
          {book.author.location || 'Unknown'}
          <span>•</span>
          <Clock className="w-4 h-4" />
          {book.readingTime || 5} min
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3">
          By {book.author.name}{book.author.age ? `, age ${book.author.age}` : ''}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {book.summary || 'No description available'}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {book.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {book.category[0] || 'Story'}
          </span>
          
          {session ? (
            <div className="flex gap-2">
              <Link
                href={`/library/stories/${book.id}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Preview
              </Link>
              <Link
                href={`/library/stories/${book.id}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {book.isPremium ? <Lock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {book.accessLevel === 'full' ? 'Read' : (book.isPremium ? 'Unlock' : 'Read')}
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-2">Sign up to read stories</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">{t('library.title')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('library.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('library.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('bookshelf')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'bookshelf'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LibraryIcon className="w-4 h-4" />
                Bookshelf
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {filters.categories.map((category: any) => (
                    <option key={category.value} value={category.value}>
                      {category.value} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Languages</option>
                  {filters.languages.map((language: any) => (
                    <option key={language.value} value={language.value}>
                      {language.value} ({language.count})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
                <select
                  value={selectedAge}
                  onChange={(e) => setSelectedAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Ages</option>
                  {filters.ageGroups.map((age: any) => (
                    <option key={age.value} value={age.value}>
                      {age.value} ({age.count})
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Stories ({pagination?.totalCount || 0})
              </h2>
              <p className="text-gray-600">
                Discover amazing stories from young authors worldwide
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  Free
                </div>
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Premium
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading books...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              {error === 'NO_PURCHASED_BOOKS' ? (
                <>
                  <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">구매한 책이 없습니다</h3>
                  <p className="text-gray-600 mb-6">
                    아직 구매하신 책이 없어요. 다양한 책들을 둘러보고 마음에 드는 책을 찾아보세요!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/shop"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📚 책 둘러보기
                    </Link>
                    <Link 
                      href="/demo/library"
                      className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      🎭 체험용 계정으로 미리보기
                    </Link>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <Crown className="w-5 h-5" />
                      <span className="font-medium">무료 체험 가능!</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      체험용 계정으로 몇 권의 샘플 책을 미리 읽어보실 수 있어요.
                    </p>
                  </div>
                </>
              ) : error === 'AUTHENTICATION_REQUIRED' ? (
                <>
                  <Users className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h3>
                  <p className="text-gray-600 mb-6">
                    개인 라이브러리에 접근하려면 먼저 로그인해주세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/login"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      🔐 로그인하기
                    </Link>
                    <Link 
                      href="/demo/library"
                      className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      🎭 체험용 계정으로 둘러보기
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <BookOpen className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">책을 불러오는 중 오류가 발생했습니다</h3>
                  <p className="text-gray-600 mb-4">
                    일시적인 문제일 수 있어요. 잠시 후 다시 시도해주세요.
                  </p>
                  <button
                    onClick={() => fetchBooks()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    🔄 다시 시도하기
                  </button>
                </>
              )}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map((book, index) => (
                    <SimpleBookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <BookshelfView books={books} />
              )}
            </>
          )}
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center mt-12 space-x-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + Math.max(1, currentPage - 2)
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasMore || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Unlock Premium Stories
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get access to our complete library of stories while supporting scholarships 
              and educational programs for young authors worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Start Free Trial
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Learn About Seeds of Empowerment
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// Force dynamic rendering to avoid prerendering issues with PDF.js
export const dynamic = 'force-dynamic';