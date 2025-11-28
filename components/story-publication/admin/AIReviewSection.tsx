'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ImprovementItem {
  text: string;
  suggestion: string;
}

interface AIReview {
  id: string;
  feedback: {
    summary: string;
    strengths: string[];
    improvements: (ImprovementItem | string)[];
    details?: any;
  };
  suggestions: string[];
  score: number | null;
  createdAt: string;
}

interface AIReviewSectionProps {
  submissionId: string;
  existingReview?: AIReview | null;
}

export default function AIReviewSection({ submissionId, existingReview }: AIReviewSectionProps) {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [review, setReview] = useState<AIReview | null>(existingReview || null);
  const [reviewType, setReviewType] = useState<'GRAMMAR' | 'STRUCTURE' | 'WRITING_HELP'>('GRAMMAR');

  const handleRequestReview = async (type: 'GRAMMAR' | 'STRUCTURE' | 'WRITING_HELP') => {
    setIsRequesting(true);
    setReviewType(type);

    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          reviewType: type
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request AI review');
      }

      const data = await response.json();
      setReview(data.review);
      toast.success('AI review completed successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request AI review');
    } finally {
      setIsRequesting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#F59E0B';
    return '#C2410C';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5" style={{ color: '#059669' }} />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5" style={{ color: '#F59E0B' }} />;
    return <AlertTriangle className="h-5 w-5" style={{ color: '#C2410C' }} />;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#5951E7]" />
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.admin.aiReview.title')}</h3>
          </div>
          {review && (
            <span className="text-xs text-gray-500">
              Generated {new Date(review.createdAt).toLocaleString()}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600">
          {t('dashboard.admin.aiReview.description')}
        </p>

        {!review ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleRequestReview('GRAMMAR')}
                disabled={isRequesting}
                className="w-full bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 px-4 transition-colors flex items-center justify-center gap-2"
              >
                {isRequesting && reviewType === 'GRAMMAR' ? (
                  <>
                    <Loader2 className="h-5 w-5 text-gray-900 animate-spin" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.admin.aiReview.analyzingGrammar')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-gray-900" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.admin.aiReview.checkGrammar')}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleRequestReview('STRUCTURE')}
                disabled={isRequesting}
                className="w-full bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 px-4 transition-colors flex items-center justify-center gap-2"
              >
                {isRequesting && reviewType === 'STRUCTURE' ? (
                  <>
                    <Loader2 className="h-5 w-5 text-gray-900 animate-spin" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.admin.aiReview.analyzingStructure')}</span>
                  </>
                ) : (
                  <>
                    <Info className="h-5 w-5 text-gray-900" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.admin.aiReview.analyzeStructure')}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleRequestReview('WRITING_HELP')}
                disabled={isRequesting}
                className="w-full bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 px-4 transition-colors flex items-center justify-center gap-2"
              >
                {isRequesting && reviewType === 'WRITING_HELP' ? (
                  <>
                    <Loader2 className="h-5 w-5 text-gray-900 animate-spin" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.admin.aiReview.analyzingWriting')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-gray-900" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.admin.aiReview.getWritingSuggestions')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg p-4 space-y-4">
              {review.score !== null && review.score !== undefined && (
                <div className="flex items-center justify-between pb-3 border-b border-[#C7D2FE]">
                  <div className="flex items-center gap-2">
                    {getScoreIcon(review.score)}
                    <span className="text-sm font-medium text-gray-700">{t('dashboard.admin.aiReview.qualityScore')}</span>
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(review.score) }}
                  >
                    {review.score}/100
                  </span>
                </div>
              )}

              {review.feedback.summary && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#5951E7]" />
                    {t('dashboard.admin.aiReview.summary')}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.feedback.summary}
                  </p>
                </div>
              )}

              {review.feedback.strengths && review.feedback.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('dashboard.admin.aiReview.strengths')}
                  </h4>
                  <ul className="space-y-1 pl-4">
                    {review.feedback.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="text-sm text-green-800 relative before:content-['✓'] before:absolute before:-left-4 before:text-green-600 before:font-bold"
                      >
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {review.feedback.improvements && review.feedback.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    {t('dashboard.admin.aiReview.improvements')}
                  </h4>
                  <ul className="space-y-1 pl-4">
                    {review.feedback.improvements.map((improvement, index) => {
                      const text = typeof improvement === 'object' && improvement !== null && 'text' in improvement
                        ? (improvement as ImprovementItem).text
                        : String(improvement);
                      return (
                        <li
                          key={index}
                          className="text-sm text-orange-800 relative before:content-['•'] before:absolute before:-left-4 before:text-orange-600"
                        >
                          {text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {review.suggestions && review.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[#5951E7] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#5951E7]" />
                    {t('dashboard.admin.aiReview.suggestions')}
                  </h4>
                  <ul className="space-y-1 pl-4">
                    {review.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 relative before:content-['→'] before:absolute before:-left-4 before:text-[#5951E7]"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setReview(null)}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                {t('dashboard.admin.aiReview.requestNew')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
