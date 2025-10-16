'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  MoreHorizontal,
  Check,
  X,
  UserCheck,
  Download,
  SortAsc,
  SortDesc,
  ArrowUpDown
} from 'lucide-react';

interface ReviewSubmission {
  id: string;
  type: 'text_submission' | 'writer_submission';
  title: string;
  authorName: string;
  authorAlias?: string;
  authorEmail: string;
  status: string;
  language: string;
  ageRange?: string;
  categories: string[];
  tags: string[];
  summary?: string;
  wordCount?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  currentReviewer?: {
    id: string;
    name: string;
    role: string;
  };
  reviewStage: 'STORY_REVIEW' | 'FORMAT_REVIEW' | 'CONTENT_REVIEW';
  reviewerRole: 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN';
  feedback?: string;
  dueDate?: string;
}

interface FilterOptions {
  status: string;
  reviewStage: string;
  reviewerRole: string;
  priority: string;
  dateRange: string;
  assignedTo: string;
}

interface SortConfig {
  field: keyof ReviewSubmission | 'daysSinceSubmission';
  direction: 'asc' | 'desc';
}

interface Stats {
  total: number;
  pending: number;
  inReview: number;
  needsAction: number;
  overdue: number;
  byStage: {
    STORY_REVIEW: number;
    FORMAT_REVIEW: number;
    CONTENT_REVIEW: number;
  };
  byRole: {
    STORY_MANAGER: number;
    BOOK_MANAGER: number;
    CONTENT_ADMIN: number;
  };
}

export default function UnifiedReviewQueue() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ReviewSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'submittedAt', direction: 'desc' });

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    reviewStage: 'all',
    reviewerRole: 'all',
    priority: 'all',
    dateRange: 'all',
    assignedTo: 'all'
  });

  // Mock data - In real implementation, this would come from the API
  const mockSubmissions: ReviewSubmission[] = [
    {
      id: '1',
      type: 'text_submission',
      title: 'The Magic Garden Adventure',
      authorName: 'Maria Garcia',
      authorAlias: 'Garden Writer',
      authorEmail: 'maria@example.com',
      status: 'STORY_REVIEW',
      language: 'en',
      ageRange: '6-9',
      categories: ['Fiction', 'Adventure'],
      tags: ['magic', 'garden', 'friendship'],
      summary: 'A young girl discovers a magical garden where plants can talk and help solve neighborhood problems.',
      wordCount: 1200,
      priority: 'HIGH',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
      submittedAt: '2025-01-01T10:00:00Z',
      reviewStage: 'STORY_REVIEW',
      reviewerRole: 'STORY_MANAGER'
    },
    {
      id: '2',
      type: 'writer_submission',
      title: 'Friendship Across Cultures',
      authorName: 'Ahmed Hassan',
      authorAlias: 'Cultural Bridge',
      authorEmail: 'ahmed@example.com',
      status: 'FORMAT_REVIEW',
      language: 'en',
      ageRange: '8-12',
      categories: ['Social', 'Multicultural'],
      tags: ['friendship', 'culture', 'understanding'],
      summary: 'Two children from different cultural backgrounds learn about each other through shared activities.',
      wordCount: 1800,
      priority: 'MEDIUM',
      createdAt: '2024-12-28T14:30:00Z',
      updatedAt: '2024-12-30T09:15:00Z',
      submittedAt: '2024-12-28T14:30:00Z',
      currentReviewer: {
        id: 'bm1',
        name: 'Sarah Johnson',
        role: 'BOOK_MANAGER'
      },
      reviewStage: 'FORMAT_REVIEW',
      reviewerRole: 'BOOK_MANAGER',
      dueDate: '2025-01-05T17:00:00Z'
    },
    {
      id: '3',
      type: 'text_submission',
      title: 'The Little Scientist',
      authorName: 'Dr. Emily Chen',
      authorAlias: 'Science Explorer',
      authorEmail: 'emily@example.com',
      status: 'CONTENT_REVIEW',
      language: 'en',
      ageRange: '7-10',
      categories: ['Educational', 'Science'],
      tags: ['science', 'experiments', 'learning'],
      summary: 'A curious child conducts simple science experiments and learns about the world around them.',
      wordCount: 1500,
      priority: 'URGENT',
      createdAt: '2024-12-20T11:20:00Z',
      updatedAt: '2024-12-31T16:45:00Z',
      submittedAt: '2024-12-20T11:20:00Z',
      currentReviewer: {
        id: 'ca1',
        name: 'Michael Rodriguez',
        role: 'CONTENT_ADMIN'
      },
      reviewStage: 'CONTENT_REVIEW',
      reviewerRole: 'CONTENT_ADMIN',
      feedback: 'Great content, needs minor edits for age appropriateness.',
      dueDate: '2025-01-02T17:00:00Z'
    }
  ];

  const mockStats: Stats = {
    total: 24,
    pending: 8,
    inReview: 12,
    needsAction: 4,
    overdue: 2,
    byStage: {
      STORY_REVIEW: 10,
      FORMAT_REVIEW: 8,
      CONTENT_REVIEW: 6
    },
    byRole: {
      STORY_MANAGER: 10,
      BOOK_MANAGER: 8,
      CONTENT_ADMIN: 6
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock API call - replace with actual API endpoint
        // const response = await fetch('/api/admin/review-queue');
        // const data = await response.json();

        // Using mock data for now
        setTimeout(() => {
          setSubmissions(mockSubmissions);
          setStats(mockStats);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session]);

  // Filter and search submissions
  useEffect(() => {
    let filtered = [...submissions];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.authorAlias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(sub => sub.status === filters.status);
    }

    if (filters.reviewStage !== 'all') {
      filtered = filtered.filter(sub => sub.reviewStage === filters.reviewStage);
    }

    if (filters.reviewerRole !== 'all') {
      filtered = filtered.filter(sub => sub.reviewerRole === filters.reviewerRole);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(sub => sub.priority === filters.priority);
    }

    if (filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned') {
        filtered = filtered.filter(sub => !sub.currentReviewer);
      } else {
        filtered = filtered.filter(sub => sub.currentReviewer?.id === filters.assignedTo);
      }
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = {
        '7': 7,
        '30': 30,
        '90': 90
      }[filters.dateRange];

      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(sub => new Date(sub.submittedAt) >= cutoff);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.field === 'daysSinceSubmission') {
        aValue = Math.floor((new Date().getTime() - new Date(a.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        bValue = Math.floor((new Date().getTime() - new Date(b.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
      } else {
        aValue = a[sortConfig.field];
        bValue = b[sortConfig.field];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, filters, sortConfig]);

  // Helper functions
  const getDaysSinceSubmission = (submittedAt: string) => {
    return Math.floor((new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'APPROVED': return 'bg-soe-green-100 text-soe-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'STORY_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'FORMAT_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'CONTENT_REVIEW': return 'bg-indigo-100 text-indigo-800';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: keyof ReviewSubmission | 'daysSinceSubmission') => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectSubmission = (id: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === filteredSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(filteredSubmissions.map(sub => sub.id));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'assign') => {
    console.log(`Bulk ${action} for submissions:`, selectedSubmissions);
    // Implement bulk action logic here
  };

  const SortableHeader = ({ field, children }: { field: keyof ReviewSubmission | 'daysSinceSubmission', children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
    >
      <span>{children}</span>
      {sortConfig.field === field ? (
        sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unified Review Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all pending submissions across review stages
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm ${
              showFilters ? 'bg-soe-green-50 border-soe-green-300' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Needs Action</p>
                <p className="text-2xl font-bold text-gray-900">{stats.needsAction}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, author, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                />
              </div>
            </div>
            {selectedSubmissions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedSubmissions.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('assign')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  <UserCheck className="h-3 w-3" />
                  Assign
                </button>
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="STORY_REVIEW">Story Review</option>
                  <option value="FORMAT_REVIEW">Format Review</option>
                  <option value="CONTENT_REVIEW">Content Review</option>
                  <option value="NEEDS_REVISION">Needs Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Review Stage</label>
                <select
                  value={filters.reviewStage}
                  onChange={(e) => setFilters(prev => ({ ...prev, reviewStage: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Stages</option>
                  <option value="STORY_REVIEW">Story Review</option>
                  <option value="FORMAT_REVIEW">Format Review</option>
                  <option value="CONTENT_REVIEW">Content Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reviewer Role</label>
                <select
                  value={filters.reviewerRole}
                  onChange={(e) => setFilters(prev => ({ ...prev, reviewerRole: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="STORY_MANAGER">Story Manager</option>
                  <option value="BOOK_MANAGER">Book Manager</option>
                  <option value="CONTENT_ADMIN">Content Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Assignments</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="me">Assigned to Me</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </span>
        <span>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.length === filteredSubmissions.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-soe-green-600 focus:ring-soe-green-500"
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortableHeader field="priority">Priority</SortableHeader>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortableHeader field="title">Submission Details</SortableHeader>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortableHeader field="authorName">Author</SortableHeader>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortableHeader field="status">Status</SortableHeader>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortableHeader field="reviewStage">Review Stage</SortableHeader>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortableHeader field="daysSinceSubmission">Submitted</SortableHeader>
                </th>
                <th className="px-6 py-3 text-left">Current Reviewer</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-300 mb-4" />
                      <p>No submissions match your filters</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => {
                  const daysSince = getDaysSinceSubmission(submission.submittedAt);
                  const overdue = isOverdue(submission.dueDate);

                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.includes(submission.id)}
                          onChange={() => handleSelectSubmission(submission.id)}
                          className="rounded border-gray-300 text-soe-green-600 focus:ring-soe-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(submission.priority)}`}>
                          {submission.priority}
                        </span>
                        {overdue && (
                          <div className="mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              OVERDUE
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {submission.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.wordCount} words • {submission.language}
                            {submission.ageRange && ` • Ages ${submission.ageRange}`}
                          </div>
                          {submission.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {submission.categories.slice(0, 2).map((category, index) => (
                                <span key={index} className="inline-flex px-2 py-1 text-xs bg-soe-green-100 text-soe-green-800 rounded">
                                  {category}
                                </span>
                              ))}
                              {submission.categories.length > 2 && (
                                <span className="text-xs text-gray-500">+{submission.categories.length - 2} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.authorAlias || submission.authorName}
                            </div>
                            <div className="text-sm text-gray-500">{submission.authorName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {submission.reviewStage.replace('_', ' ')}
                        </span>
                        <div className="text-xs text-gray-500">
                          {submission.reviewerRole.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <div>
                            <div>{new Date(submission.submittedAt).toLocaleDateString()}</div>
                            <div className="text-xs">
                              {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.currentReviewer ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {submission.currentReviewer.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {submission.currentReviewer.role.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-soe-green-600 hover:text-soe-green-900 flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}