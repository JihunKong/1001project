'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole, BookStatus } from '@prisma/client';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Settings,
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  authorName: string;
  summary?: string;
  language: string;
  category: string[];
  isPublished: boolean;
  isPremium: boolean;
  featured: boolean;
  status: BookStatus;
  levelBand?: string;
  visibility: string;
  
  // Enhanced PDF fields
  pdfStorageKey?: string;
  pdfChecksum?: string;
  pdfSize?: number;
  pdfPageCount?: number;
  pdfUploadedAt?: string;
  fullPdf?: string; // Legacy support
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedDate?: string;
  
  // Stats
  viewCount: number;
  likeCount: number;
  
  // Relationships
  assignments: { id: string }[];
}

interface BooksResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  stats: {
    totalBooks: number;
    publishedBooks: number;
    draftBooks: number;
    withPdf: number;
    withoutPdf: number;
  };
}

interface FilterValues {
  search: string;
  status: string;
  isPublished: string;
  language: string;
  isPremium: string;
  featured: string;
  hasPdf: string;
  levelBand: string;
  dateFrom: string;
  dateTo: string;
  authorName: string;
  category: string;
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  PENDING: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  NEEDS_REVISION: { label: 'Needs Revision', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ARCHIVED: { label: 'Archived', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const columnHelper = createColumnHelper<Book>();

export default function BooksManagement() {
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    publishedBooks: 0,
    draftBooks: 0,
    withPdf: 0,
    withoutPdf: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 0,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
    isPublished: '',
    language: '',
    isPremium: '',
    featured: '',
    hasPdf: '',
    levelBand: '',
    dateFrom: '',
    dateTo: '',
    authorName: '',
    category: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
    redirect('/dashboard');
  }

  // Define columns
  const columns = useMemo(
    () => [
      // Selection column
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300"
          />
        ),
      }),
      
      columnHelper.accessor('title', {
        header: 'Book Details',
        cell: (info) => {
          const book = info.row.original;
          const StatusIcon = statusConfig[book.status]?.icon || Clock;
          return (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <StatusIcon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">{info.getValue()}</div>
                <div className="text-sm text-gray-500 truncate">by {book.authorName}</div>
                {book.levelBand && (
                  <div className="text-xs text-blue-600 mt-1">{book.levelBand}</div>
                )}
              </div>
            </div>
          );
        },
      }),
      
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as BookStatus;
          const config = statusConfig[status];
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
              {config.label}
            </span>
          );
        },
      }),
      
      columnHelper.display({
        id: 'pdf',
        header: 'PDF',
        cell: (info) => {
          const book = info.row.original;
          const hasPdf = book.pdfStorageKey || book.fullPdf;
          const hasEnhanced = book.pdfChecksum && book.pdfSize;
          
          return (
            <div className="flex items-center gap-2">
              {hasPdf ? (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-green-600" />
                  {hasEnhanced && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                  {book.pdfSize && (
                    <span className="text-xs text-gray-500">
                      {(book.pdfSize / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">No PDF</span>
                </div>
              )}
            </div>
          );
        },
      }),
      
      columnHelper.accessor('isPublished', {
        header: 'Published',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {info.getValue() ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Draft</span>
              </span>
            )}
            {info.row.original.featured && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                Featured
              </span>
            )}
          </div>
        ),
      }),
      
      columnHelper.accessor('language', {
        header: 'Lang',
        cell: (info) => (
          <span className="text-sm text-gray-600 uppercase">{info.getValue()}</span>
        ),
      }),
      
      columnHelper.accessor('assignments', {
        header: 'Usage',
        cell: (info) => {
          const assignmentCount = info.getValue()?.length || 0;
          const book = info.row.original;
          return (
            <div className="text-sm space-y-1">
              <div className="text-gray-600">
                {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-400">
                {book.viewCount || 0} views
              </div>
            </div>
          );
        },
      }),
      
      columnHelper.accessor('updatedAt', {
        header: 'Modified',
        cell: (info) => (
          <span className="text-sm text-gray-500">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewBook(info.row.original.id)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEditBook(info.row.original.id)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
              title="Edit Book"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleManagePdf(info.row.original.id)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600"
              title="Manage PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                title="More Actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: books,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
      sorting,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  // Fetch books with filtering
  const fetchBooks = async (page = 1, limit = 15, customFilters?: Partial<FilterValues>) => {
    try {
      setLoading(true);
      const activeFilters = customFilters || filters;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.set(key, value);
        }
      });

      const response = await fetch(`/api/admin/books?${params}`);
      if (!response.ok) throw new Error('Failed to fetch books');

      const data: BooksResponse = await response.json();
      setBooks(data.books);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    fetchBooks(1, pagination.limit, filters);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Action handlers
  const handleViewBook = (id: string) => {
    window.open(`/admin/books/${id}`, '_blank');
  };

  const handleEditBook = (id: string) => {
    window.location.href = `/admin/books/${id}/edit`;
  };

  const handleManagePdf = (id: string) => {
    window.location.href = `/admin/books/${id}/pdf`;
  };

  const handleCreateBook = () => {
    window.location.href = '/admin/books/new';
  };

  const handleBulkUpload = () => {
    window.location.href = '/admin/books/bulk-upload';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Books Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage digital library with enhanced PDF streaming and publishing controls
              </p>
              {/* Stats bar */}
              <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                <span>{stats.totalBooks} total</span>
                <span className="text-green-600">{stats.publishedBooks} published</span>
                <span className="text-gray-600">{stats.draftBooks} drafts</span>
                <span className="text-blue-600">{stats.withPdf} with PDF</span>
                <span className="text-orange-600">{stats.withoutPdf} without PDF</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 ${
                  showFilters ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={handleBulkUpload}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </button>
              <button
                onClick={handleCreateBook}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Book
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                  placeholder="Title, author, content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="NEEDS_REVISION">Needs Revision</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PDF Status</label>
                <select
                  value={filters.hasPdf}
                  onChange={(e) => handleFiltersChange({ ...filters, hasPdf: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Books</option>
                  <option value="true">With PDF</option>
                  <option value="false">Without PDF</option>
                  <option value="enhanced">Enhanced PDF Info</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level Band</label>
                <select
                  value={filters.levelBand}
                  onChange={(e) => handleFiltersChange({ ...filters, levelBand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  <option value="Under-7">Under 7</option>
                  <option value="7-9">Ages 7-9</option>
                  <option value="10-12">Ages 10-12</option>
                  <option value="Adult">Adult</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  const emptyFilters = Object.keys(filters).reduce((acc, key) => {
                    acc[key as keyof FilterValues] = '';
                    return acc;
                  }, {} as FilterValues);
                  setFilters(emptyFilters);
                  fetchBooks(1, pagination.limit, emptyFilters);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                {...{
                                  className: header.column.getCanSort()
                                    ? 'cursor-pointer select-none flex items-center gap-2'
                                    : '',
                                  onClick: header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: ' 🔼',
                                  desc: ' 🔽',
                                }[header.column.getIsSorted() as string] ?? null}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} results
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchBooks(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchBooks(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}