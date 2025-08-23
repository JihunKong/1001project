'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import {
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Edit,
  Filter,
  Download,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Book {
  id: string;
  title: string;
  authorName: string;
  language: string;
  isPublished: boolean;
  fullPdf?: string | null;
  coverImage?: string | null;
  createdAt: string;
  publishedDate?: string | null;
  price?: number | null;
  isPremium: boolean;
  viewCount: number;
  likeCount: number;
  author: {
    id: string;
    name: string;
    email: string;
  };
  visibility: {
    hasFullPdf: boolean;
    isPublished: boolean;
    inLibrary: boolean;
    inAdminBooks: boolean;
  };
}

interface ApiResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function AdminBooksPage() {
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchBooks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        published: publishedFilter,
      });

      const response = await fetch(`/api/admin/books?${params}`);
      if (!response.ok) throw new Error('Failed to fetch books');

      const data: ApiResponse = await response.json();
      setBooks(data.books);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [search, publishedFilter]);

  const togglePublished = async (bookId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/books?id=${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update book');
      
      // Refresh the list
      await fetchBooks(currentPage);
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book status');
    }
  };

  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect('/');
  }

  const getVisibilityBadge = (visibility: Book['visibility']) => {
    if (visibility.inLibrary) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Visible in Library
        </span>
      );
    } else if (visibility.isPublished && !visibility.hasFullPdf) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          <AlertCircle className="w-3 h-3" />
          Published but no PDF
        </span>
      );
    } else if (!visibility.isPublished && visibility.hasFullPdf) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          <EyeOff className="w-3 h-3" />
          Has PDF but unpublished
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          <AlertCircle className="w-3 h-3" />
          Not visible (unpublished, no PDF)
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">All Books</h1>
                <p className="text-sm text-gray-600">Manage all books in the system</p>
              </div>
            </div>
            <Link
              href="/admin/stories/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload New Book
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Books</option>
              <option value="true">Published Only</option>
              <option value="false">Unpublished Only</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              {pagination.totalCount} total books
            </div>
          </div>
        </div>

        {/* Books Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No books found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {book.coverImage ? (
                              <Image
                                className="h-10 w-10 rounded-lg object-cover"
                                src={book.coverImage}
                                alt={book.title}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {book.language.toUpperCase()} • {book.isPremium && '$' + book.price}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{book.authorName}</div>
                        <div className="text-sm text-gray-500">{book.author.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => togglePublished(book.id, book.isPublished)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            book.isPublished
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {book.isPublished ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                          {book.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVisibilityBadge(book.visibility)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {book.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            ❤️ {book.likeCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {book.fullPdf && (
                            <a
                              href={book.fullPdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} books
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchBooks(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchBooks(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}