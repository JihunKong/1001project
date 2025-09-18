'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Search, Filter, Grid, List, SortAsc, SortDesc, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import EnhancedPDFThumbnail from './EnhancedPDFThumbnail';

interface Book {
  id: string;
  title: string;
  authorName: string;
  summary?: string;
  language: string;
  category: string[];
  tags: string[];
  isPremium: boolean;
  price?: number;
  currency: string;
  thumbnails?: any;
  coverImage?: string;
  previewPages: number;
  pageCount?: number;
  viewCount: number;
  createdAt: string;
  hasAccess?: boolean;
  accessLevel?: 'preview' | 'purchased' | 'subscribed' | 'free';
}

interface BookLibraryProps {
  initialBooks?: Book[];
  userId?: string;
  isAdmin?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  gridView?: boolean;
  pageSize?: number;
  className?: string;
}

interface FilterState {
  search: string;
  categories: string[];
  languages: string[];
  priceRange: 'all' | 'free' | 'premium';
  accessLevel: 'all' | 'available' | 'purchased';
}

interface SortState {
  field: 'title' | 'authorName' | 'createdAt' | 'viewCount' | 'price';
  direction: 'asc' | 'desc';
}

export default function EnhancedBookLibrary({
  initialBooks = [],
  userId,
  isAdmin = false,
  showFilters = true,
  showSort = true,
  gridView = true,
  pageSize = 12,
  className = ""
}: BookLibraryProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(initialBooks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // UI States
  const [isGridView, setIsGridView] = useState(gridView);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Filter and Sort States
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    languages: [],
    priceRange: 'all',
    accessLevel: 'all'
  });

  const [sort, setSort] = useState<SortState>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Intersection Observer for lazy loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Load more books
  const loadMoreBooks = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/library/books?page=${page + 1}&limit=${pageSize}&userId=${userId || ''}`);
      if (!response.ok) throw new Error('Failed to load books');

      const data = await response.json();
      
      if (data.books && data.books.length > 0) {
        setBooks(prev => [...prev, ...data.books]);
        setPage(prev => prev + 1);
        setHasMore(data.pagination.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userId, loading, hasMore]);

  // Trigger load more when scrolling near bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreBooks();
    }
  }, [inView, hasMore, loading, loadMoreBooks]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const categories = Array.from(new Set(books.flatMap(book => book.category)));
    const languages = Array.from(new Set(books.map(book => book.language)));

    return {
      categories: categories.sort(),
      languages: languages.sort()
    };
  }, [books]);

  // Apply filters and sorting
  useEffect(() => {
    let result = books;

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.authorName.toLowerCase().includes(searchTerm) ||
        book.summary?.toLowerCase().includes(searchTerm) ||
        book.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(book =>
        book.category.some(cat => filters.categories.includes(cat))
      );
    }

    // Apply language filter
    if (filters.languages.length > 0) {
      result = result.filter(book =>
        filters.languages.includes(book.language)
      );
    }

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      if (filters.priceRange === 'free') {
        result = result.filter(book => !book.isPremium);
      } else if (filters.priceRange === 'premium') {
        result = result.filter(book => book.isPremium);
      }
    }

    // Apply access level filter
    if (filters.accessLevel !== 'all' && userId) {
      if (filters.accessLevel === 'available') {
        result = result.filter(book => !book.isPremium || book.hasAccess);
      } else if (filters.accessLevel === 'purchased') {
        result = result.filter(book => book.hasAccess);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      // Handle different data types
      if (sort.field === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sort.field === 'price') {
        aValue = a.price || 0;
        bValue = b.price || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBooks(result);
  }, [books, filters, sort, userId]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      languages: [],
      priceRange: 'all',
      accessLevel: 'all'
    });
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search books, authors, or topics..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors",
                showFiltersPanel ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-300"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}

          {showSort && (
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleSortChange('title')}
                className={cn(
                  "px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-1",
                  sort.field === 'title' ? "bg-blue-50 text-blue-700" : "text-gray-700"
                )}
              >
                Title
                {sort.field === 'title' && (
                  sort.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSortChange('createdAt')}
                className={cn(
                  "px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-l border-gray-300 flex items-center gap-1",
                  sort.field === 'createdAt' ? "bg-blue-50 text-blue-700" : "text-gray-700"
                )}
              >
                Newest
                {sort.field === 'createdAt' && (
                  sort.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSortChange('viewCount')}
                className={cn(
                  "px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-l border-gray-300 flex items-center gap-1",
                  sort.field === 'viewCount' ? "bg-blue-50 text-blue-700" : "text-gray-700"
                )}
              >
                Popular
                {sort.field === 'viewCount' && (
                  sort.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </button>
            </div>
          )}

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsGridView(true)}
              className={cn(
                "p-2 hover:bg-gray-50 transition-colors",
                isGridView ? "bg-blue-50 text-blue-700" : "text-gray-700"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={cn(
                "p-2 hover:bg-gray-50 transition-colors border-l border-gray-300",
                !isGridView ? "bg-blue-50 text-blue-700" : "text-gray-700"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {filterOptions.categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={filters.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange({ categories: [...filters.categories, category] });
                        } else {
                          handleFilterChange({ categories: filters.categories.filter(c => c !== category) });
                        }
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-600">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {filterOptions.languages.map(language => (
                  <label key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={filters.languages.includes(language)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange({ languages: [...filters.languages, language] });
                        } else {
                          handleFilterChange({ languages: filters.languages.filter(l => l !== language) });
                        }
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-600">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <div className="space-y-1">
                {[
                  { value: 'all', label: 'All Books' },
                  { value: 'free', label: 'Free' },
                  { value: 'premium', label: 'Premium' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="priceRange"
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={filters.priceRange === option.value}
                      onChange={() => handleFilterChange({ priceRange: option.value as any })}
                    />
                    <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Access Level */}
            {userId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access</label>
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'All Books' },
                    { value: 'available', label: 'Available to Read' },
                    { value: 'purchased', label: 'My Books' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="accessLevel"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={filters.accessLevel === option.value}
                        onChange={() => handleFilterChange({ accessLevel: option.value as any })}
                      />
                      <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              {filteredBooks.length} of {books.length} books
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-red-800 font-medium">Error loading books</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => {
              setError('');
              loadMoreBooks();
            }}
            className="ml-auto text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Books Grid/List */}
      {filteredBooks.length === 0 && !loading ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-500 mb-4">
            {filters.search || filters.categories.length > 0 || filters.languages.length > 0 || filters.priceRange !== 'all' || filters.accessLevel !== 'all'
              ? "Try adjusting your filters to see more books."
              : "There are no books available at the moment."}
          </p>
          {(filters.search || filters.categories.length > 0 || filters.languages.length > 0 || filters.priceRange !== 'all' || filters.accessLevel !== 'all') && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className={cn(
          isGridView
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            : "space-y-4"
        )}>
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={cn(
                isGridView
                  ? "aspect-[3/4]"
                  : "flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
              )}
            >
              {isGridView ? (
                <EnhancedPDFThumbnail
                  bookId={book.id}
                  title={book.title}
                  thumbnails={book.thumbnails}
                  isPremium={book.isPremium}
                  hasAccess={book.hasAccess}
                  previewPages={book.previewPages}
                  className="w-full h-full"
                  showAccessBadge={true}
                  lazy={true}
                />
              ) : (
                <>
                  <div className="w-24 h-32 flex-shrink-0">
                    <EnhancedPDFThumbnail
                      bookId={book.id}
                      title={book.title}
                      thumbnails={book.thumbnails}
                      isPremium={book.isPremium}
                      hasAccess={book.hasAccess}
                      previewPages={book.previewPages}
                      className="w-full h-full"
                      showAccessBadge={false}
                      lazy={true}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{book.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">by {book.authorName}</p>
                    {book.summary && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{book.summary}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{book.language.toUpperCase()}</span>
                        {book.category.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{book.category[0]}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {book.isPremium && (
                          <span className="text-amber-600 font-medium text-sm">
                            ${book.price || 0}
                          </span>
                        )}
                        {book.hasAccess ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Owned
                          </span>
                        ) : book.isPremium ? (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                            Premium
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more books...</span>
            </div>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasMore && filteredBooks.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've seen all {filteredBooks.length} books</p>
        </div>
      )}
    </div>
  );
}