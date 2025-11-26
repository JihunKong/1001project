'use client';

import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { canEditBook } from '@/lib/validation/book-registration.schema';
import { StoryManagerTabs } from '@/components/story-manager';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authorName: string;
  coverImage?: string;
  contentType: 'TEXT' | 'PDF';
  language: string;
  category: string[];
  isPublished: boolean;
  visibility: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function StoryManagerBooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      redirect('/login');
      return;
    }

    if (!canEditBook(session.user.role)) {
      redirect('/dashboard');
      return;
    }

    fetchBooks();
  }, [session, status]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/books?isPublished=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContentType = contentTypeFilter === 'all' || book.contentType === contentTypeFilter;
    const matchesLanguage = languageFilter === 'all' || book.language === languageFilter;
    return matchesSearch && matchesContentType && matchesLanguage;
  });

  const uniqueLanguages = [...new Set(books.map(b => b.language))];

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <StoryManagerTabs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Books</h1>
          <p className="mt-2 text-gray-600">
            Edit and manage all published books in the library
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="TEXT">Text</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Languages</option>
                {uniqueLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredBooks.length} of {books.length} books
            </p>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No books found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBooks.map(book => (
                <div key={book.id} className="p-6 flex items-center gap-4 hover:bg-gray-50">
                  <div className="flex-shrink-0 w-16 h-24 bg-gray-200 rounded overflow-hidden">
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        width={64}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{book.title}</h3>
                    <p className="text-sm text-gray-500">by {book.authorName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        book.contentType === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {book.contentType}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                        {book.language.toUpperCase()}
                      </span>
                      {book.category.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right text-sm text-gray-500">
                    <div>{book.viewCount} views</div>
                    <div className="mt-1">
                      Updated {new Date(book.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/story-manager/books/${book.id}/edit`)}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/books/${book.id}`}
                      className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
