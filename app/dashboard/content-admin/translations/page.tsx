'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  BookOpen,
  Check,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Bot,
  User
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Card } from '@/components/figma/ui';
import { LANGUAGE_DISPLAY_NAMES } from '@/components/library/LibraryModeSelector';
import type { SupportedLanguage } from '@/lib/i18n/language-cookie';

interface TranslationStats {
  total: number;
  byStatus: {
    published: number;
    inProgress: number;
    review: number;
    approved: number;
    rejected: number;
  };
  aiGenerated: number;
  humanReviewed: number;
  byLanguage: { language: string; count: number }[];
  coverage: {
    totalBooks: number;
    booksWithTranslations: number;
    percentage: number;
  };
}

interface Translation {
  id: string;
  title: string;
  summary: string | null;
  fromLanguage: string;
  toLanguage: string;
  status: 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  isAIGenerated: boolean;
  aiModel: string | null;
  humanReviewed: boolean;
  qualityScore: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    authorName: string;
    coverImage: string | null;
  };
  translator: {
    id: string;
    name: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700'
};

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: '진행 중',
  REVIEW: '검토 중',
  APPROVED: '승인됨',
  PUBLISHED: '게시됨',
  REJECTED: '반려됨'
};

export default function TranslationsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/translations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(languageFilter && { language: languageFilter })
      });

      const response = await fetch(`/api/translations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data.translations);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, languageFilter]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/content-admin/translations');
    } else if (authStatus === 'authenticated') {
      fetchStats();
      fetchTranslations();
    }
  }, [authStatus, router, fetchStats, fetchTranslations]);

  const handleStatusChange = async (translationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/translations/${translationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchTranslations();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (translationId: string) => {
    if (!confirm('이 번역을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/translations/${translationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTranslations();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  };

  const filteredTranslations = translations.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authStatus === 'loading' || (loading && translations.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-600" />
          번역 관리
        </h1>
        <p className="mt-2 text-gray-600">
          책의 다국어 번역을 관리하고 게시 상태를 조정합니다.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">전체 번역</div>
              </div>
            </div>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.byStatus.published}</div>
                <div className="text-sm text-gray-500">게시된 번역</div>
              </div>
            </div>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.aiGenerated}</div>
                <div className="text-sm text-gray-500">AI 번역</div>
              </div>
            </div>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.coverage.percentage}%</div>
                <div className="text-sm text-gray-500">번역 커버리지</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {stats && stats.byLanguage.length > 0 && (
        <Card variant="bordered" padding="md" className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">언어별 번역 현황</h2>
          <div className="flex flex-wrap gap-3">
            {stats.byLanguage.map(item => (
              <div
                key={item.language}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">
                  {LANGUAGE_DISPLAY_NAMES[item.language as SupportedLanguage] || item.language}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card variant="bordered" padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="번역 또는 원본 제목으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 상태</option>
              <option value="IN_PROGRESS">진행 중</option>
              <option value="REVIEW">검토 중</option>
              <option value="APPROVED">승인됨</option>
              <option value="PUBLISHED">게시됨</option>
              <option value="REJECTED">반려됨</option>
            </select>

            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 언어</option>
              {Object.entries(LANGUAGE_DISPLAY_NAMES).map(([code, name]) => (
                code !== 'en' && (
                  <option key={code} value={code}>{name}</option>
                )
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번역
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  원본 책
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  언어
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>번역이 없습니다.</p>
                  </td>
                </tr>
              ) : (
                filteredTranslations.map((translation) => (
                  <tr key={translation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate">
                        {translation.title}
                      </div>
                      {translation.summary && (
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {translation.summary}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {translation.book.coverImage && (
                          <img
                            src={translation.book.coverImage}
                            alt={translation.book.title}
                            className="w-10 h-14 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 max-w-[150px] truncate">
                            {translation.book.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {translation.book.authorName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {LANGUAGE_DISPLAY_NAMES[translation.fromLanguage as SupportedLanguage] || translation.fromLanguage}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">
                          {LANGUAGE_DISPLAY_NAMES[translation.toLanguage as SupportedLanguage] || translation.toLanguage}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={translation.status}
                        onChange={(e) => handleStatusChange(translation.id, e.target.value)}
                        className={`px-2 py-1 text-sm rounded-full border-0 ${STATUS_COLORS[translation.status]}`}
                      >
                        <option value="IN_PROGRESS">진행 중</option>
                        <option value="REVIEW">검토 중</option>
                        <option value="APPROVED">승인됨</option>
                        <option value="PUBLISHED">게시됨</option>
                        <option value="REJECTED">반려됨</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {translation.isAIGenerated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            <Bot className="h-3 w-3" />
                            AI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            <User className="h-3 w-3" />
                            수동
                          </span>
                        )}
                        {translation.humanReviewed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <Check className="h-3 w-3" />
                            검토됨
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/content-admin/translations/${translation.id}`)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/content-admin/translations/${translation.id}/edit`)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(translation.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              페이지 {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
