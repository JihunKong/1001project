'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Translation {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  fromLanguage: string;
  toLanguage: string;
  status: string;
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
    summary: string | null;
    content: string | null;
    authorName: string;
    coverImage: string | null;
    language: string;
  };
  translator: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
  ar: 'العربية',
  hi: 'हिन्दी',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  pt: 'Português',
  ru: 'Русский',
  it: 'Italiano',
  zh: '中文'
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: '번역 중',
  REVIEW: '검토 중',
  APPROVED: '승인됨',
  PUBLISHED: '게시됨',
  REJECTED: '반려됨'
};

export default function TranslationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!session?.user || !['ADMIN', 'CONTENT_ADMIN'].includes(session.user.role as string)) {
      router.push('/login');
      return;
    }

    fetchTranslation();
  }, [session, sessionStatus, router, id]);

  const fetchTranslation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/translations/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('번역을 찾을 수 없습니다.');
        } else {
          throw new Error('Failed to fetch translation');
        }
        return;
      }
      const data = await res.json();
      setTranslation(data.translation);
    } catch (err) {
      setError('번역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!translation) return;

    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setTranslation(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleHumanReviewToggle = async () => {
    if (!translation) return;

    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ humanReviewed: !translation.humanReviewed })
      });

      if (!res.ok) throw new Error('Failed to update review status');

      setTranslation(prev => prev ? { ...prev, humanReviewed: !prev.humanReviewed } : null);
    } catch (err) {
      alert('검토 상태 변경에 실패했습니다.');
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Link
            href="/dashboard/content-admin/translations"
            className="mt-4 inline-block text-brand-orange hover:underline"
          >
            ← 번역 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!translation) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/content-admin/translations"
            className="text-gray-500 hover:text-gray-700"
          >
            ← 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">번역 상세</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/content-admin/translations/${id}/edit`}
            className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors"
          >
            편집하기
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Translation Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">원본 책 정보</h2>
            <div className="flex gap-4">
              {translation.book.coverImage && (
                <div className="flex-shrink-0">
                  <Image
                    src={translation.book.coverImage}
                    alt={translation.book.title}
                    width={120}
                    height={160}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-lg">{translation.book.title}</h3>
                <p className="text-sm text-gray-600 mt-1">저자: {translation.book.authorName}</p>
                <p className="text-sm text-gray-600">
                  원본 언어: {LANGUAGE_NAMES[translation.book.language] || translation.book.language}
                </p>
                {translation.book.summary && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">{translation.book.summary}</p>
                )}
              </div>
            </div>
          </div>

          {/* Translation Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                번역된 콘텐츠 ({LANGUAGE_NAMES[translation.toLanguage]})
              </h2>
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-sm text-brand-orange hover:underline"
              >
                {showOriginal ? '번역본 보기' : '원본과 비교'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {showOriginal ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">원본</p>
                        <p className="text-gray-900">{translation.book.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">번역</p>
                        <p className="text-gray-900">{translation.title}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900">{translation.title}</p>
                  )}
                </div>
              </div>

              {(translation.summary || translation.book.summary) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {showOriginal ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">원본</p>
                          <p className="text-gray-900 text-sm">{translation.book.summary || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">번역</p>
                          <p className="text-gray-900 text-sm">{translation.summary || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-900 text-sm">{translation.summary || '-'}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">본문</label>
                <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  {showOriginal ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">원본</p>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: translation.book.content || '' }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">번역</p>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: translation.content }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: translation.content }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Meta Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">번역 상태</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현재 상태</label>
                <select
                  value={translation.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border border-gray-300 ${STATUS_COLORS[translation.status]}`}
                >
                  <option value="IN_PROGRESS">번역 중</option>
                  <option value="REVIEW">검토 중</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="PUBLISHED">게시됨</option>
                  <option value="REJECTED">반려됨</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">사람이 검토함</span>
                <button
                  onClick={handleHumanReviewToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    translation.humanReviewed ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      translation.humanReviewed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {translation.qualityScore !== null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품질 점수</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange transition-all"
                        style={{ width: `${translation.qualityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{translation.qualityScore}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Translation Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">번역 정보</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">번역 방향</span>
                <span className="text-gray-900">
                  {LANGUAGE_NAMES[translation.fromLanguage]} → {LANGUAGE_NAMES[translation.toLanguage]}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">AI 생성</span>
                <span className={translation.isAIGenerated ? 'text-blue-600' : 'text-gray-500'}>
                  {translation.isAIGenerated ? '예' : '아니오'}
                </span>
              </div>

              {translation.isAIGenerated && translation.aiModel && (
                <div className="flex justify-between">
                  <span className="text-gray-600">AI 모델</span>
                  <span className="text-gray-900">{translation.aiModel}</span>
                </div>
              )}

              {translation.translator && (
                <div className="flex justify-between">
                  <span className="text-gray-600">번역자</span>
                  <span className="text-gray-900">{translation.translator.name || translation.translator.email}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">생성일</span>
                  <span className="text-gray-900">
                    {new Date(translation.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">수정일</span>
                  <span className="text-gray-900">
                    {new Date(translation.updatedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {translation.publishedAt && (
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">게시일</span>
                    <span className="text-gray-900">
                      {new Date(translation.publishedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">작업</h2>

            <div className="space-y-3">
              <Link
                href={`/dashboard/content-admin/translations/${id}/edit`}
                className="block w-full px-4 py-2 bg-brand-orange text-white text-center rounded-lg hover:bg-brand-orange/90 transition-colors"
              >
                번역 편집
              </Link>

              <Link
                href={`/books/${translation.book.id}`}
                className="block w-full px-4 py-2 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                원본 책 보기
              </Link>

              {translation.status === 'PUBLISHED' && (
                <Link
                  href={`/books/${translation.book.id}?lang=${translation.toLanguage}`}
                  className="block w-full px-4 py-2 bg-green-100 text-green-700 text-center rounded-lg hover:bg-green-200 transition-colors"
                >
                  번역본 미리보기
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
