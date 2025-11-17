'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import AnimatedBookCard from '@/components/ui/AnimatedBookCard';
import ScrollAnimatedContainer from '@/components/ui/ScrollAnimatedContainer';
import {
  AdvancedFilters,
  SortSelector,
  ViewModeToggle,
  BookListView,
  EmptyState,
  type Book,
  type FilterState,
  type SortOption,
  type ViewMode
} from '@/components/library';

export default function LibraryPage() {
  const { data: session } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [currentSort, setCurrentSort] = useState<SortOption>({
    label: 'Newest First',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: currentSort.sortBy,
        sortOrder: currentSort.sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.language && { language: filters.language }),
        ...(filters.country && { country: filters.country }),
        ...(filters.educationalCategory && { educationalCategory: filters.educationalCategory }),
        ...(filters.ageRange && { ageRange: filters.ageRange }),
        ...(filters.minDifficulty !== undefined && { minDifficulty: filters.minDifficulty.toString() }),
        ...(filters.maxDifficulty !== undefined && { maxDifficulty: filters.maxDifficulty.toString() }),
        ...(filters.vocabularyLevel && { vocabularyLevel: filters.vocabularyLevel }),
      });

      const response = await fetch(`/api/books?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [page, currentSort, searchTerm, filters]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setCurrentSort(newSort);
    setPage(1);
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm.length > 0;

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <ScrollAnimatedContainer animationType="slideInLeft" duration={600}>
              <h1 className="text-3xl font-bold text-gray-900">Library</h1>
              <p className="mt-1 text-sm text-gray-500">
                Discover {totalCount.toLocaleString()} stories from children around the world
              </p>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="slideInRight" delay={200}>
              <div className="flex items-center gap-4">
                {!session && (
                  <Link
                    href="/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    Sign In to Read
                  </Link>
                )}
                {session && (
                  <Link
                    href="/dashboard"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    My Dashboard
                  </Link>
                )}
              </div>
            </ScrollAnimatedContainer>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Filters */}
          <div className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <ScrollAnimatedContainer animationType="slideInLeft" delay={300}>
              <AdvancedFilters
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </ScrollAnimatedContainer>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Controls */}
            <ScrollAnimatedContainer animationType="slideUp" delay={400}>
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search by title, author, or keywords..."
                      />
                    </div>
                  </div>

                  {/* Sort and View Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Filters
                    </button>
                    <SortSelector
                      currentSort={currentSort}
                      onSortChange={handleSortChange}
                    />
                    <ViewModeToggle
                      currentMode={viewMode}
                      onModeChange={setViewMode}
                    />
                  </div>
                </div>
              </div>
            </ScrollAnimatedContainer>

            {/* Results Count */}
            {hasActiveFilters && (
              <ScrollAnimatedContainer animationType="fadeIn" delay={500}>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {books.length} of {totalCount.toLocaleString()} stories
                </div>
              </ScrollAnimatedContainer>
            )}

            {/* Books Display */}
            {books.length === 0 ? (
              <ScrollAnimatedContainer animationType="fadeIn" delay={600}>
                <EmptyState
                  type={hasActiveFilters ? 'filtered' : 'no-books'}
                  onReset={hasActiveFilters ? handleResetFilters : undefined}
                />
              </ScrollAnimatedContainer>
            ) : (
              <ScrollAnimatedContainer animationType="fadeIn" delay={600}>
                {viewMode === 'list' ? (
                  <BookListView books={books} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.map((book, index) => (
                      <AnimatedBookCard
                        key={book.id}
                        book={{
                          id: book.id,
                          title: book.title,
                          authorName: book.authorName,
                          description: book.summary,
                          coverImage: book.coverImage,
                          language: book.language,
                          difficultyLevel: book.readingLevel || 'BEGINNER',
                          ageGroup: book.ageRange || '5-8',
                          pageCount: 0,
                          averageRating: book.rating || 0,
                          ratingCount: 0
                        }}
                        isAuthenticated={!!session}
                        animationDelay={700 + (index * 100)}
                      />
                    ))}
                  </div>
                )}
              </ScrollAnimatedContainer>
            )}

            {/* Pagination */}
            {totalCount > limit && (
              <ScrollAnimatedContainer animationType="fadeIn" delay={700}>
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-4 py-2 text-sm text-gray-700">
                    Page {page} of {Math.ceil(totalCount / limit)}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(totalCount / limit), p + 1))}
                    disabled={page >= Math.ceil(totalCount / limit)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </ScrollAnimatedContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}