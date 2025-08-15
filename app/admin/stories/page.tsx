'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole, StorySubmissionStatus } from '@prisma/client';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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
  MoreHorizontal,
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  content: string;
  summary?: string;
  language: string;
  category: string;
  ageGroup: string;
  status: StorySubmissionStatus;
  priority: Priority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  coverImage?: {
    id: string;
    url: string;
    thumbnailUrl: string;
    altText?: string;
  };
  workflowHistory: Array<{
    id: string;
    fromStatus?: StorySubmissionStatus;
    toStatus: StorySubmissionStatus;
    comment: string;
    createdAt: string;
    performedBy: {
      id: string;
      name: string;
    };
  }>;
}

interface StoriesResponse {
  stories: Story[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const statusConfig = {
  SUBMITTED: { label: 'Submitted', color: 'bg-gray-100 text-gray-800' },
  IN_REVIEW: { label: 'In Review', color: 'bg-blue-100 text-blue-800' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
};

const columnHelper = createColumnHelper<Story>();

export default function StoriesManagement() {
  const { data: session, status } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">{info.getValue()}</div>
            <div className="text-sm text-gray-500 truncate">
              by {info.row.original.author.name}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const config = statusConfig[status];
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
              {config.label}
            </span>
          );
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => {
          const priority = info.getValue();
          const config = priorityConfig[priority];
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
              {config.label}
            </span>
          );
        },
      }),
      columnHelper.accessor('language', {
        header: 'Language',
        cell: (info) => (
          <span className="text-sm text-gray-900">{info.getValue().toUpperCase()}</span>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => (
          <span className="text-sm text-gray-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewStory(info.row.original.id)}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
              title="View Story"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEditStory(info.row.original.id)}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
              title="Edit Story"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteStory(info.row.original.id)}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600"
              title="Delete Story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: stories,
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

  // Fetch stories
  const fetchStories = async (page = 1, limit = 10, search = '', filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...filters,
      });

      const response = await fetch(`/api/admin/stories?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stories');

      const data: StoriesResponse = await response.json();
      setStories(data.stories);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleViewStory = (id: string) => {
    // Navigate to story detail view
    window.open(`/admin/stories/${id}`, '_blank');
  };

  const handleEditStory = (id: string) => {
    // Navigate to story edit form
    window.location.href = `/admin/stories/${id}/edit`;
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/admin/stories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete story');

      // Refresh the stories list
      fetchStories(pagination.page);
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  const handleBulkImport = () => {
    window.location.href = '/admin/stories/bulk-import';
  };

  const handleCreateStory = () => {
    window.location.href = '/admin/stories/new';
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/stories?export=true');
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stories-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting stories:', error);
      alert('Failed to export stories');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stories Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage story submissions and publishing workflow
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleBulkImport}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </button>
              <button
                onClick={handleCreateStory}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Story
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stories..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={
                columnFilters.find((f) => f.id === 'status')?.value as string || ''
              }
              onChange={(e) => {
                const value = e.target.value;
                setColumnFilters((prev) =>
                  value
                    ? [...prev.filter((f) => f.id !== 'status'), { id: 'status', value }]
                    : prev.filter((f) => f.id !== 'status')
                );
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={
                columnFilters.find((f) => f.id === 'language')?.value as string || ''
              }
              onChange={(e) => {
                const value = e.target.value;
                setColumnFilters((prev) =>
                  value
                    ? [...prev.filter((f) => f.id !== 'language'), { id: 'language', value }]
                    : prev.filter((f) => f.id !== 'language')
                );
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="ko">Korean</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </div>

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
                    onClick={() => fetchStories(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchStories(pagination.page + 1)}
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