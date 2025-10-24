'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  User,
  Calendar,
  AlertCircle,
  BookOpen,
  Edit
} from 'lucide-react';

interface TextSubmission {
  id: string;
  title: string;
  authorAlias: string;
  status: string;
  language: string;
  ageRange?: string;
  category: string[];
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
  storyFeedback?: string;
}

interface Stats {
  pendingReview: number;
  reviewInProgress: number;
  approved: number;
  needsRevision: number;
  totalReviewed: number;
}

export default function StoryManagerDashboard() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Redirect if not authenticated or not a story manager
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'STORY_MANAGER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch submissions and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsRes, statsRes] = await Promise.all([
          fetch('/api/text-submissions?status=' + selectedStatus),
          fetch('/api/story-manager/stats')
        ]);

        // Better error messages to identify which API is failing
        if (!submissionsRes.ok) {
          const errorData = await submissionsRes.json().catch(() => ({}));
          console.error('Submissions API error:', submissionsRes.status, errorData);
          throw new Error(`Failed to fetch submissions (${submissionsRes.status}): ${errorData.error || 'Unknown error'}`);
        }

        if (!statsRes.ok) {
          const errorData = await statsRes.json().catch(() => ({}));
          console.error('Stats API error:', statsRes.status, errorData);
          throw new Error(`Failed to fetch stats (${statsRes.status}): ${errorData.error || 'Unknown error'}`);
        }

        const submissionsData = await submissionsRes.json();
        const statsData = await statsRes.json();

        setSubmissions(submissionsData.submissions || []);
        setStats(statsData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'STORY_MANAGER') {
      fetchData();
    }
  }, [session, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'STORY_APPROVED': return 'bg-soe-green-100 text-soe-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'STORY_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4" />;
      case 'STORY_APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'STORY_REVIEW': return <Eye className="h-4 w-4" />;
      case 'NEEDS_REVISION': return <Edit className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      case 'DRAFT': return <FileText className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityLevel = (submission: TextSubmission) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(submission.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission > 7) return 'high';
    if (daysSinceSubmission > 3) return 'medium';
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
      <div data-role="story-manager" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story review queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-role="story-manager" className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div data-role="story-manager" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Story Manager Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve story submissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                <option value="all">All Submissions</option>
                <option value="PENDING">Pending Review</option>
                <option value="STORY_REVIEW">In Review</option>
              </select>
              <Link
                href="/dashboard"
                className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg"
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
                  <p className="text-sm font-medium text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.reviewInProgress}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Needs Revision</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.needsRevision}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-soe-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Reviewed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviewed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Story Submissions Queue</h2>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-gray-300 mb-4" />
                        <p>No submissions in queue</p>
                        <p className="text-sm">Check back later for new story submissions</p>
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
                            {(submission.category || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(submission.category || []).slice(0, 2).map((cat, index) => (
                                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-soe-green-100 text-soe-green-800 rounded">
                                    {cat}
                                  </span>
                                ))}
                                {(submission.category || []).length > 2 && (
                                  <span className="text-xs text-gray-500">+{(submission.category || []).length - 2} more</span>
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
                          <div className="flex items-center">
                            {getStatusIcon(submission.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                              {submission.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/dashboard/story-manager/review/${submission.id}`}
                              className="text-soe-green-600 hover:text-soe-green-900 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Link>
                            {submission.storyFeedback && (
                              <button className="text-soe-green-600 hover:text-soe-green-900 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Feedback
                              </button>
                            )}
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