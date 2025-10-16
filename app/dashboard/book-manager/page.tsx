'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Layout,
  CheckCircle,
  Clock,
  Eye,
  User,
  AlertCircle,
  Package,
  Settings
} from 'lucide-react';

interface TextSubmission {
  id: string;
  title: string;
  authorAlias: string;
  status: string;
  language: string;
  ageRange?: string;
  categories: string[];
  tags: string[];
  summary?: string;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  storyManager?: {
    id: string;
    name: string;
    email: string;
  };
  bookDecision?: string;
}

interface Stats {
  awaitingDecision: number;
  formatReview: number;
  bookFormat: number;
  textFormat: number;
  totalDecisions: number;
}

export default function BookManagerDashboard() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Redirect if not authenticated or not a book manager
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'BOOK_MANAGER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch submissions and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsRes, statsRes] = await Promise.all([
          fetch('/api/text-submissions?status=' + selectedStatus + '&role=book-manager'),
          fetch('/api/book-manager/stats')
        ]);

        if (!submissionsRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const submissionsData = await submissionsRes.json();
        const statsData = await statsRes.json();

        setSubmissions(submissionsData.submissions || []);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'BOOK_MANAGER') {
      fetchData();
    }
  }, [session, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'CONTENT_REVIEW': return 'bg-soe-green-100 text-soe-green-800';
      case 'STORY_APPROVED': return 'bg-yellow-100 text-yellow-800';
      case 'FORMAT_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4" />;
      case 'CONTENT_REVIEW': return <Eye className="h-4 w-4" />;
      case 'STORY_APPROVED': return <Clock className="h-4 w-4" />;
      case 'FORMAT_REVIEW': return <Layout className="h-4 w-4" />;
      case 'REJECTED': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'BOOK': return <BookOpen className="h-4 w-4 text-soe-green-600" />;
      case 'TEXT': return <FileText className="h-4 w-4 text-green-600" />;
      case 'COLLECTION': return <Package className="h-4 w-4 text-purple-600" />;
      default: return <Settings className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityLevel = (submission: TextSubmission) => {
    const daysSinceApproval = Math.floor(
      (new Date().getTime() - new Date(submission.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceApproval > 5) return 'high';
    if (daysSinceApproval > 2) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div data-role="book-manager" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading format decision queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-role="book-manager" className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book Manager Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Decide publication format for approved stories
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Submissions</option>
                <option value="STORY_APPROVED">Awaiting Decision</option>
                <option value="FORMAT_REVIEW">In Format Review</option>
                <option value="CONTENT_REVIEW">Sent to Content Admin</option>
              </select>
              <Link
                href="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Awaiting Decision</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.awaitingDecision}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Layout className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Format Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.formatReview}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-soe-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Book Format</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bookFormat}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Text Format</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.textFormat}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-soe-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Decisions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDecisions}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Format Decision Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Layout className="h-12 w-12 text-gray-300 mb-4" />
                        <p>No stories awaiting format decision</p>
                        <p className="text-sm">Check back later for approved stories</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => {
                    const priority = getPriorityLevel(submission);
                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(priority)}`}>
                            {priority.toUpperCase()}
                          </span>
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
                              <div className="text-sm font-medium text-gray-900">{submission.authorAlias}</div>
                              <div className="text-sm text-gray-500">{submission.author.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.storyManager ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{submission.storyManager.name}</div>
                              <div className="text-gray-500">{submission.storyManager.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Auto-approved</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(submission.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                              {submission.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getDecisionIcon(submission.bookDecision || 'PENDING')}
                            <span className="ml-2 text-sm">
                              {submission.bookDecision ? (
                                <span className="font-medium">{submission.bookDecision}</span>
                              ) : (
                                <span className="text-gray-500">Pending Decision</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/dashboard/book-manager/decide/${submission.id}`}
                              className="text-soe-green-600 hover:text-soe-green-900 flex items-center"
                            >
                              <Layout className="h-4 w-4 mr-1" />
                              {submission.bookDecision ? 'Review' : 'Decide'}
                            </Link>
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
    </div>
  );
}