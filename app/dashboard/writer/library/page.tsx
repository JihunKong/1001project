"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BookOpen,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Star,
  Globe,
  Award
} from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/figma/ui';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  contentType: 'TEXT' | 'PDF' | 'EPUB' | 'AUDIO' | 'MULTIMEDIA' | 'INTERACTIVE';
  authorName: string;
  authorAlias?: string;
  language: string;
  ageRange?: string;
  readingLevel?: string;
  category: string[];
  genres: string[];
  tags: string[];
  coverImage?: string;
  visibility: 'PUBLIC' | 'RESTRICTED' | 'CLASSROOM' | 'PRIVATE';
  isPremium: boolean;
  isPublished: boolean;
  featured: boolean;
  price?: number;
  currency?: string;
  viewCount: number;
  rating: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    role: string;
  };
}

export default function WriterLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const contentTypeLabels = {
    TEXT: t('library.contentType.text'),
    PDF: t('library.contentType.pdf'),
    EPUB: t('library.contentType.epub'),
    AUDIO: t('library.contentType.audio'),
    MULTIMEDIA: t('library.contentType.multimedia'),
    INTERACTIVE: t('library.contentType.interactive')
  };
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'title' | 'rating'>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchBooks = useCallback(async () => {
    try {
      // Build query params
      const params = new URLSearchParams({
        published: 'true',
        sortBy,
        sortOrder,
      });

      if (searchQuery) params.append('search', searchQuery);
      if (languageFilter !== 'all') params.append('language', languageFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/books?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      // Error handled silently - books will show empty state
    } finally {
      setLoading(false);
    }
  }, [searchQuery, languageFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/writer/library');
    } else if (status === 'authenticated') {
      fetchBooks();
    }
  }, [status, router, fetchBooks]);

  // Trigger refetch when filters or sort changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBooks();
    }
  }, [status, fetchBooks]);

  const filteredBooks = books;

  const getLibraryStats = () => {
    return {
      total: books.length,
      featured: books.filter(b => b.featured).length,
      languages: new Set(books.map(b => b.language)).size,
      premium: books.filter(b => b.isPremium).length
    };
  };

  const stats = getLibraryStats();

  // Get unique languages and categories from books
  const availableLanguages = Array.from(new Set(books.map(b => b.language)));
  const availableCategories = Array.from(
    new Set(books.flatMap(b => b.category))
  );

  const languageOptions = [
    { value: 'all', label: t('library.filters.allLanguages') },
    ...availableLanguages.map(lang => ({
      value: lang,
      label: lang.toUpperCase()
    }))
  ];

  const categoryOptions = [
    { value: 'all', label: t('library.filters.allCategories') },
    ...availableCategories.map(cat => ({
      value: cat,
      label: cat
    }))
  ];

  const sortOptions = [
    { value: 'publishedAt', label: t('library.sort.recentlyPublished') },
    { value: 'title', label: t('library.sort.titleAZ') },
    { value: 'rating', label: t('library.sort.highestRated') }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soe-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-20 lg:pb-4">
        <div id="main-content" data-role="writer" className="max-w-[1240px] px-4 sm:px-8 lg:px-12 pt-6 pb-20 lg:pb-4">
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
              <div className="text-3xl font-semibold text-figma-black">{stats.total}</div>
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

          {/* Toolbar */}
          <Card variant="bordered" padding="md" className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Language Filter */}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-figma-gray-inactive flex-shrink-0" />
                  <Select
                    options={languageOptions}
                    value={languageFilter}
                    onChange={setLanguageFilter}
                    placeholder={t('library.placeholders.language')}
                    className="min-h-[44px] min-w-[120px]"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-figma-gray-inactive flex-shrink-0" />
                  <Select
                    options={categoryOptions}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    placeholder={t('library.placeholders.category')}
                    className="min-h-[44px] min-w-[140px]"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-figma-gray-inactive flex-shrink-0" />
                  <Select
                    options={sortOptions}
                    value={sortBy}
                    onChange={(value) => setSortBy(value as 'publishedAt' | 'title' | 'rating')}
                    placeholder={t('library.placeholders.sortBy')}
                    className="min-h-[44px] min-w-[160px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="min-h-[44px] min-w-[44px] px-3"
                    aria-label={`${t('library.aria.sortOrder')}: ${sortOrder === 'asc' ? t('library.aria.ascending') : t('library.aria.descending')}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Books Grid */}
          {filteredBooks.length === 0 ? (
            <Card variant="bordered" padding="lg" className="text-center">
              <BookOpen className="h-12 w-12 text-figma-gray-inactive mx-auto mb-4" />
              <h3 className="text-lg font-medium text-figma-black mb-2">{t('common.noResults')}</h3>
              <p className="text-figma-gray-inactive mb-4">
                {searchQuery || languageFilter !== 'all' || categoryFilter !== 'all'
                  ? t('library.empty.noMatches')
                  : t('library.empty.noBooks')}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredBooks.map((book) => (
                <Card
                  key={book.id}
                  variant="bordered"
                  padding="lg"
                  hoverable
                >
                  <div className="flex gap-4">
                    {/* Cover Image */}
                    <div className="flex-shrink-0">
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          width={96}
                          height={128}
                          className="w-24 h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-figma-gray-inactive" />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-figma-black">
                              {book.title}
                            </h3>
                            {book.featured && (
                              <Award className="h-4 w-4 text-yellow-500" aria-label={t('library.aria.featured')} />
                            )}
                            {book.isPremium && (
                              <Star className="h-4 w-4 text-purple-500" aria-label={t('library.aria.premium')} />
                            )}
                          </div>
                          {book.subtitle && (
                            <p className="text-sm text-figma-gray-inactive mb-2">
                              {book.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-figma-gray-inactive mb-3">
                            <span className="flex items-center gap-1">
                              {t('library.book.by')} {book.authorAlias || book.authorName}
                            </span>
                            <span>•</span>
                            <span>{contentTypeLabels[book.contentType]}</span>
                            <span>•</span>
                            <span className="uppercase">{book.language}</span>
                            {book.rating > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  {book.rating.toFixed(1)}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{book.viewCount} {t('library.book.views')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      {book.summary && (
                        <p className="text-sm text-figma-black line-clamp-2 mb-3">
                          {book.summary}
                        </p>
                      )}

                      {/* Categories & Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {book.category.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {cat}
                          </span>
                        ))}
                        {book.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/books/${book.id}`)}
                          leftIcon={<Eye className="h-3 w-3" />}
                          className="min-h-[40px]"
                        >
                          {t('library.actions.readBook')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/books/${book.id}`)}
                          className="min-h-[40px]"
                        >
                          {t('library.actions.viewDetails')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
