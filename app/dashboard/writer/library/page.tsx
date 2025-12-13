"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Card } from '@/components/figma/ui';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import AnimatedBookCard from '@/components/ui/AnimatedBookCard';
import {
  AdvancedFilters,
  SortSelector,
  ViewModeToggle,
  BookListView,
  EmptyState,
  CategorySection,
  type Book,
  type FilterState,
  type SortOption,
  type ViewMode
} from '@/components/library';

export default function WriterLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [books, setBooks] = useState<Book[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [currentSort, setCurrentSort] = useState<SortOption>({
    label: t('library.sort.recentlyPublished') || 'Newest First',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await fetch('/api/books/favorites');
      if (response.ok) {
        const data = await response.json();
        const ids = new Set<string>((data.books || []).map((b: { id: string }) => b.id));
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: currentSort.sortBy,
        sortOrder: currentSort.sortOrder,
        published: 'true',
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

  const handleFavoriteToggle = useCallback((bookId: string, isFavorited: boolean) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (isFavorited) {
        newSet.add(bookId);
      } else {
        newSet.delete(bookId);
      }
      return newSet;
    });
  }, []);

  const booksWithFavorites = useMemo(() => {
    return books.map(book => ({
      ...book,
      isFavorited: favoriteIds.has(book.id)
    }));
  }, [books, favoriteIds]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/writer/library');
    } else if (status === 'authenticated') {
      fetchBooks();
      fetchFavorites();
    }
  }, [status, router, fetchBooks, fetchFavorites]);

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

  const booksByCategory = useMemo(() => {
    const categoryMap: { [key: string]: Book[] } = {};
    const featuredBooks: Book[] = [];

    booksWithFavorites.forEach((book) => {
      if (book.featured) {
        featuredBooks.push(book);
      }

      if (book.category && book.category.length > 0) {
        book.category.forEach((cat: string) => {
          if (!categoryMap[cat]) {
            categoryMap[cat] = [];
          }
          categoryMap[cat].push(book);
        });
      } else if (book.educationalCategories && book.educationalCategories.length > 0) {
        book.educationalCategories.forEach((cat: string) => {
          if (!categoryMap[cat]) {
            categoryMap[cat] = [];
          }
          categoryMap[cat].push(book);
        });
      }
    });

    return { categories: categoryMap, featured: featuredBooks };
  }, [booksWithFavorites]);

  const getLibraryStats = () => {
    return {
      total: totalCount,
      featured: books.filter(b => b.featured).length,
      languages: new Set(books.map(b => b.language)).size,
      premium: books.filter(b => b.isPremium).length
    };
  };

  const stats = getLibraryStats();

  if (status === 'loading' || (loading && books.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soe-green-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-4">
      <div id="main-content" data-role="writer" className="max-w-[1440px] px-4 sm:px-8 lg:px-12 pt-6 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-figma-black">{t('library.title')}</h1>
            <LanguageSelector variant="compact" />
          </div>
        </div>

        {/* Library Description */}
        <Card variant="bordered" padding="md" className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-figma-black mb-1">
                {t('library.discover.title')}
              </h2>
              <p className="text-sm text-figma-gray-inactive">
                {t('library.discover.description')}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card variant="bordered" padding="md">
            <div className="text-3xl font-semibold text-figma-black">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-figma-gray-inactive mt-1">{t('library.stats.publishedBooks')}</div>
          </Card>
          <Card variant="bordered" padding="md">
            <div className="text-3xl font-semibold text-blue-600">{stats.featured}</div>
            <div className="text-sm text-figma-gray-inactive mt-1">{t('library.stats.featured')}</div>
          </Card>
          <Card variant="bordered" padding="md">
            <div className="text-3xl font-semibold text-purple-600">{stats.languages}</div>
            <div className="text-sm text-figma-gray-inactive mt-1">{t('library.stats.languages')}</div>
          </Card>
          <Card variant="bordered" padding="md">
            <div className="text-3xl font-semibold text-yellow-600">{stats.premium}</div>
            <div className="text-sm text-figma-gray-inactive mt-1">{t('library.stats.premium')}</div>
          </Card>
        </div>

        {/* Main Content with Filters */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Filters */}
          <div className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <AdvancedFilters
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Search and Controls */}
            <Card variant="bordered" padding="md" className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('common.search') || 'Search stories...'}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    {t('library.filters.toggleFilters') || 'Filters'}
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
            </Card>

            {/* Results Count */}
            {hasActiveFilters && totalCount > 0 && (
              <div className="mb-4 text-sm text-figma-gray-inactive">
                {t('library.results.showing') || 'Showing'} {books.length} {t('library.results.of') || 'of'} {totalCount.toLocaleString()} {t('library.results.stories') || 'stories'}
              </div>
            )}

            {/* Books Display */}
            {booksWithFavorites.length === 0 ? (
              <EmptyState
                type={hasActiveFilters ? 'filtered' : 'no-books'}
                onReset={hasActiveFilters ? handleResetFilters : undefined}
              />
            ) : (
              <>
                {viewMode === 'list' ? (
                  <BookListView
                    books={booksWithFavorites}
                    getLinkHref={(book) => `/dashboard/writer/read/${book.id}`}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ) : (
                  <div className="space-y-20">
                    {/* Featured Books Section */}
                    {booksByCategory.featured.length > 0 && (
                      <CategorySection
                        title={t('library.categories.featured') || 'Featured Stories'}
                        books={booksByCategory.featured}
                        showViewAll={false}
                        getBookHref={(bookId) => `/dashboard/writer/read/${bookId}`}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    )}

                    {/* Category Sections */}
                    {Object.entries(booksByCategory.categories).map(([category, categoryBooks]) => (
                      <CategorySection
                        key={category}
                        title={category}
                        books={categoryBooks}
                        viewAllHref={`/dashboard/writer/library?category=${encodeURIComponent(category)}`}
                        getBookHref={(bookId) => `/dashboard/writer/read/${bookId}`}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}

                    {/* Fallback: If no categories, show all books in grid */}
                    {Object.keys(booksByCategory.categories).length === 0 && booksByCategory.featured.length === 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {booksWithFavorites.map((book) => (
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
                            isAuthenticated={true}
                            animationDelay={0}
                            userRole={session?.user?.role}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalCount > limit && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {t('common.previous') || 'Previous'}
                </button>
                <div className="flex items-center px-4 py-2 text-sm text-figma-gray-inactive">
                  {t('common.page') || 'Page'} {page} {t('common.of') || 'of'} {Math.ceil(totalCount / limit)}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(totalCount / limit), p + 1))}
                  disabled={page >= Math.ceil(totalCount / limit)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {t('common.next') || 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
