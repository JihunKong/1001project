'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/useTranslation';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

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
  book: {
    id: string;
    title: string;
    summary: string | null;
    content: string | null;
    authorName: string;
    coverImage: string | null;
    language: string;
  };
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

export default function TranslationEditPage({
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [humanReviewed, setHumanReviewed] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);

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
      const trans = data.translation;
      setTranslation(trans);
      setTitle(trans.title);
      setSummary(trans.summary || '');
      setContent(trans.content);
      setStatus(trans.status);
      setHumanReviewed(trans.humanReviewed);
      setQualityScore(trans.qualityScore);
    } catch (err) {
      setError('번역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/translations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || null,
          content,
          status,
          humanReviewed,
          qualityScore
        })
      });

      if (!res.ok) throw new Error('Failed to save translation');

      router.push(`/dashboard/content-admin/translations/${id}`);
    } catch (err) {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
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
            href={`/dashboard/content-admin/translations/${id}`}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 상세보기로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">번역 편집</h1>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Book Reference */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                {translation.book.coverImage && (
                  <Image
                    src={translation.book.coverImage}
                    alt={translation.book.title}
                    width={60}
                    height={80}
                    className="rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-sm text-blue-600 font-medium">원본 책 참조</p>
                  <p className="font-medium text-gray-900">{translation.book.title}</p>
                  <p className="text-sm text-gray-600">
                    {LANGUAGE_NAMES[translation.fromLanguage]} → {LANGUAGE_NAMES[translation.toLanguage]}
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                번역된 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                placeholder="번역된 제목을 입력하세요"
                required
              />
              <p className="mt-2 text-sm text-gray-500">원본: {translation.book.title}</p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                번역된 요약
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                placeholder="번역된 요약을 입력하세요"
              />
              {translation.book.summary && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">원본 요약:</p>
                  <p className="text-sm text-gray-600">{translation.book.summary}</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                번역된 본문 <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="번역된 본문을 입력하세요..."
                />
              </div>

              {translation.book.content && (
                <details className="mt-4">
                  <summary className="text-sm text-brand-orange cursor-pointer hover:underline">
                    원본 본문 보기
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: translation.book.content }}
                    />
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Status & Review */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">상태 설정</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
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
                    type="button"
                    onClick={() => setHumanReviewed(!humanReviewed)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      humanReviewed ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        humanReviewed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    품질 점수 (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={qualityScore ?? ''}
                    onChange={(e) => setQualityScore(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="점수 입력 (선택)"
                  />
                </div>
              </div>
            </div>

            {/* Translation Info */}
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
                    {translation.aiModel && ` (${translation.aiModel})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-3 bg-brand-orange text-white font-medium rounded-lg hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '저장 중...' : '변경사항 저장'}
              </button>

              <Link
                href={`/dashboard/content-admin/translations/${id}`}
                className="block w-full mt-3 px-4 py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
