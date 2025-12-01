'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
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
  Package,
  Layout
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
  author: {
    id: string;
    name: string;
    email: string;
  };
  storyFeedback?: string;
}

interface Stats {
  awaitingDecision: number;
  formatReview: number;
  bookFormat: number;
  textFormat: number;
  collectionFormat: number;
  totalDecisions: number;
  totalSubmissions: number;
}

export default function BookManagerReviewsPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'BOOK_MANAGER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusParam = selectedStatus === 'all'
          ? 'STORY_APPROVED,FORMAT_REVIEW'
          : selectedStatus;

        const [submissionsRes, statsRes] = await Promise.all([
          fetch('/api/text-submissions?status=' + statusParam),
          fetch('/api/book-manager/stats')
        ]);

        if (!submissionsRes.ok) {
          const errorData = await submissionsRes.json().catch(() => ({}));
          throw new Error(`Failed to fetch submissions (${submissionsRes.status}): ${errorData.error || 'Unknown error'}`);
        }

        if (!statsRes.ok) {
          const errorData = await statsRes.json().catch(() => ({}));
          throw new Error(`Failed to fetch stats (${statsRes.status}): ${errorData.error || 'Unknown error'}`);
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
      case 'CONTENT_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'STORY_APPROVED': return 'bg-yellow-100 text-yellow-800';
      case 'FORMAT_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4" />;
      case 'CONTENT_REVIEW': return <Eye className="h-4 w-4" />;
      case 'STORY_APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'FORMAT_REVIEW': return <Layout className="h-4 w-4" />;
      case 'NEEDS_REVISION': return <AlertCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (decision?: string) => {
    switch (decision) {
      case 'BOOK': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'TEXT': return <FileText className="h-4 w-4 text-green-600" />;
      case 'COLLECTION': return <Package className="h-4 w-4 text-purple-600" />;
      default: return null;
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.common.loadingStoryQueue')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
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
    <>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('nav.formatReview')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('dashboard.bookManager.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                <option value="all">{t('dashboard.bookManager.filter.all')}</option>
                <option value="STORY_APPROVED">{t('dashboard.bookManager.filter.awaitingDecision')}</option>
                <option value="FORMAT_REVIEW">{t('dashboard.bookManager.filter.inReview')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('dashboard.bookManager.stats.awaitingDecision')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.awaitingDecision}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Layout className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('dashboard.bookManager.stats.formatReview')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.formatReview}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('dashboard.bookManager.stats.bookFormat')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.bookFormat}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('dashboard.bookManager.stats.textFormat')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.textFormat}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-soe-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('dashboard.bookManager.stats.totalDecisions')}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDecisions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('dashboard.bookManager.queue.title')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.priority')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.storyDetails')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.author')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.format')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.submitted')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.common.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-300 mb-4" />
                          <p>{t('dashboard.bookManager.queue.empty')}</p>
                          <p className="text-sm">{t('dashboard.bookManager.queue.emptySubtitle')}</p>
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
                              {t(`dashboard.common.priority.${priority}`).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {submission.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {t('dashboard.storyManager.queue.words', { words: submission.wordCount })} • {submission.language}
                                {submission.ageRange && ` • ${t('dashboard.storyManager.queue.ages', { ageRange: submission.ageRange })}`}
                              </div>
                              {(submission.category || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(submission.category || []).slice(0, 2).map((cat, index) => (
                                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-soe-green-100 text-soe-green-800 rounded">
                                      {cat}
                                    </span>
                                  ))}
                                  {(submission.category || []).length > 2 && (
                                    <span className="text-xs text-gray-500">{t('dashboard.storyManager.queue.moreCategories', { count: (submission.category || []).length - 2 })}</span>
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
                            {submission.bookDecision ? (
                              <div className="flex items-center">
                                {getFormatIcon(submission.bookDecision)}
                                <span className="ml-1 text-sm text-gray-700">{submission.bookDecision}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
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
                                href={`/dashboard/book-manager/decide/${submission.id}`}
                                className="text-soe-green-600 hover:text-soe-green-900 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t('dashboard.common.actions.review')}
                              </Link>
                              {submission.storyFeedback && (
                                <button className="text-soe-green-600 hover:text-soe-green-900 flex items-center">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {t('dashboard.common.actions.feedback')}
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
    </>
  );
}
