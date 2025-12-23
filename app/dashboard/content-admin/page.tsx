'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ActivityFeed } from '@/components/dashboard';
import {
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  FileText,
  BookOpen,
  Package,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  Star,
  TrendingUp,
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
  bookDecision?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
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
  bookManager?: {
    id: string;
    name: string;
    email: string;
  };
  finalNotes?: string;
}

interface Stats {
  awaitingApproval: number;
  approved: number;
  published: number;
  rejected: number;
  totalReviewed: number;
  thisWeekApprovals: number;
}

export default function ContentAdminDashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Redirect if not authenticated or not a content admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'CONTENT_ADMIN') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch submissions and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsRes, statsRes] = await Promise.all([
          fetch('/api/text-submissions?status=' + selectedStatus + '&role=content-admin'),
          fetch('/api/content-admin/stats')
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

    if (session?.user?.role === 'CONTENT_ADMIN') {
      fetchData();
    }
  }, [session, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'CONTENT_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4" />;
      case 'CONTENT_REVIEW': return <Eye className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (decision: string) => {
    switch (decision) {
      case 'BOOK': return <BookOpen className="h-4 w-4 text-soe-green-600" />;
      case 'TEXT': return <FileText className="h-4 w-4 text-green-600" />;
      case 'COLLECTION': return <Package className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityLevel = (submission: TextSubmission) => {
    const daysSinceDecision = Math.floor(
      (new Date().getTime() - new Date(submission.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDecision > 3) return 'high';
    if (daysSinceDecision > 1) return 'medium';
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
      <div data-role="content-admin" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.common.loadingApprovalQueue')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-role="content-admin" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('dashboard.common.error.prefix')}{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            {t('dashboard.common.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-role="content-admin" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.contentAdmin.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('dashboard.contentAdmin.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/content-admin/books"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="h-5 w-5 mr-2" />
                {t('nav.manageBooks')}
              </Link>
              <Link
                href="/dashboard/content-admin/register-book"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                {t('dashboard.common.actions.registerBook')}
              </Link>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                <option value="all">{t('dashboard.contentAdmin.filter.all')}</option>
                <option value="CONTENT_REVIEW">{t('dashboard.contentAdmin.filter.awaitingApproval')}</option>
                <option value="PUBLISHED">{t('dashboard.contentAdmin.filter.published')}</option>
                <option value="REJECTED">{t('dashboard.contentAdmin.filter.rejected')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.contentAdmin.stats.awaitingApproval')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.awaitingApproval}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.contentAdmin.stats.approved')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-soe-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.contentAdmin.stats.published')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.contentAdmin.stats.rejected')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.contentAdmin.stats.thisWeek')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeekApprovals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-soe-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.contentAdmin.stats.totalReviewed')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviewed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{t('dashboard.contentAdmin.queue.title')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.common.table.priority')}
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.common.table.storyDetails')}
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.common.table.author')}
                  </th>
                  <th className="hidden xl:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.contentAdmin.queue.formatDecision')}
                  </th>
                  <th className="hidden xl:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.contentAdmin.queue.decidedBy')}
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.common.table.status')}
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.common.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Shield className="h-12 w-12 text-gray-300 mb-4" />
                        <p>{t('dashboard.contentAdmin.queue.empty')}</p>
                        <p className="text-sm">{t('dashboard.contentAdmin.queue.emptySubtitle')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => {
                    const priority = getPriorityLevel(submission);
                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="hidden lg:table-cell px-2 sm:px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(priority)}`}>
                            {t(`dashboard.common.priority.${priority}`).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-4">
                          <div className="max-w-[150px] sm:max-w-[200px] lg:max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {submission.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {t('dashboard.storyManager.queue.words', { words: submission.wordCount })} • {submission.language}
                              {submission.ageRange && ` • ${t('dashboard.storyManager.queue.ages', { ageRange: submission.ageRange })}`}
                            </div>
                            {(submission.category || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(submission.category || []).slice(0, 2).map((category, index) => (
                                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-soe-green-100 text-soe-green-800 rounded">
                                    {category}
                                  </span>
                                ))}
                                {(submission.category || []).length > 2 && (
                                  <span className="text-xs text-gray-500">{t('dashboard.storyManager.queue.moreCategories', { count: (submission.category || []).length - 2 })}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="max-w-[120px] lg:max-w-[160px]">
                              <div className="text-sm font-medium text-gray-900 truncate">{submission.authorAlias}</div>
                              <div className="text-sm text-gray-500 truncate">{submission.author.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden xl:table-cell px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div
                            className="flex items-center max-w-[120px]"
                            title={submission.bookDecision || t('dashboard.contentAdmin.queue.notDecided')}
                          >
                            {getFormatIcon(submission.bookDecision || '')}
                            <span className="ml-2 text-sm font-medium truncate">
                              {submission.bookDecision || t('dashboard.contentAdmin.queue.notDecided')}
                            </span>
                          </div>
                        </td>
                        <td className="hidden xl:table-cell px-2 sm:px-4 py-4 whitespace-nowrap">
                          {submission.bookManager ? (
                            <div className="text-sm max-w-[140px]">
                              <div className="font-medium text-gray-900 truncate">{submission.bookManager.name}</div>
                              <div className="text-gray-500 truncate">{submission.bookManager.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">{t('dashboard.contentAdmin.queue.autoAssigned')}</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(submission.status)}
                            <span className={`ml-1 sm:ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                              {t(`status.${submission.status}`)}
                            </span>
                          </div>
                          {submission.publishedAt && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(submission.publishedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Link
                              href={`/dashboard/content-admin/review/${submission.id}`}
                              className="text-soe-green-600 hover:text-soe-green-900 flex items-center"
                              title={submission.status === 'CONTENT_REVIEW' ? t('dashboard.common.actions.review') : t('dashboard.common.actions.view')}
                            >
                              <Eye className="h-4 w-4 xl:mr-1" />
                              <span className="hidden xl:inline">{submission.status === 'CONTENT_REVIEW' ? t('dashboard.common.actions.review') : t('dashboard.common.actions.view')}</span>
                            </Link>
                            {submission.finalNotes && (
                              <button
                                className="text-soe-green-600 hover:text-soe-green-900 flex items-center"
                                title={t('dashboard.common.actions.notes')}
                              >
                                <AlertTriangle className="h-4 w-4 xl:mr-1" />
                                <span className="hidden xl:inline">{t('dashboard.common.actions.notes')}</span>
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

        {/* Activity Feed */}
        <div className="mt-8">
          <ActivityFeed limit={10} days={7} />
        </div>
      </div>
    </div>
  );
}