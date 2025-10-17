'use client';

import { useState } from 'react';
import { Sparkles, Wand2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface AIReviewCardProps {
  submissionId: string;
  existingReview?: {
    id: string;
    feedback: any;
    suggestions: string[];
    score?: number;
    createdAt: string;
  } | null;
}

export default function AIReviewCard({ submissionId, existingReview }: AIReviewCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(existingReview);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRequestReview = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          reviewType: 'GRAMMAR'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request AI review');
      }

      const data = await response.json();
      setReview(data.review);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request AI review');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#5951E7]" />
          <h3
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: '1.221',
              color: '#141414'
            }}
          >
            AI Review
          </h3>
        </div>

        <p
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '1.193',
            color: '#8E8E93'
          }}
        >
          Get instant feedback on grammar, structure, and style to improve your story&apos;s quality.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {review ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-md py-3 px-4 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#5951E7]" />
                <span
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.221',
                    color: '#5951E7'
                  }}
                >
                  View AI Feedback
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-[#5951E7]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#5951E7]" />
              )}
            </button>

            {isExpanded && (
              <div className="bg-[#F9FAFB] rounded-md p-4 space-y-3">
                {review.score !== undefined && review.score !== null && (
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#8E8E93'
                      }}
                    >
                      Quality Score
                    </span>
                    <span
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '18px',
                        fontWeight: 500,
                        color: review.score >= 80 ? '#065F46' : review.score >= 60 ? '#92400E' : '#C2410C'
                      }}
                    >
                      {review.score}/100
                    </span>
                  </div>
                )}

                {review.suggestions && review.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#141414'
                      }}
                    >
                      Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {review.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="text-sm text-[#141414] pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#5951E7]"
                          style={{
                            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                            fontSize: '14px',
                            lineHeight: '1.5'
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p
                  className="text-xs text-[#AEAEB2]"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif'
                  }}
                >
                  Generated {new Date(review.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleRequestReview}
            disabled={isRequesting}
            className="w-full bg-[#EEF2FF] hover:bg-[#E0E7FF] disabled:opacity-50 disabled:cursor-not-allowed rounded-md py-3 transition-colors flex items-center justify-center gap-2"
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-5 w-5 text-[#5951E7] animate-spin" />
                <span
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.221',
                    color: '#5951E7'
                  }}
                >
                  Analyzing...
                </span>
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 text-[#5951E7]" />
                <span
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.221',
                    color: '#5951E7'
                  }}
                >
                  Request AI Review
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
