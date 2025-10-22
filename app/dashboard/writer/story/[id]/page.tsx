'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import StoryMetadataCard from '@/components/StoryMetadataCard';
import WritingTipsCard from '@/components/WritingTipsCard';
import { AIReviewCard } from '@/components/story-publication/writer';

interface TextSubmission {
  id: string;
  title: string;
  content: string;
  status: string;
  wordCount?: number | null;
  updatedAt: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  aiReviews?: Array<{
    id: string;
    feedback: any;
    suggestions: string[];
    score?: number;
    createdAt: string;
  }>;
}

export default function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<TextSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams?.id) return;

    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/text-submissions/${resolvedParams.id}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch story');
        }

        const data = await response.json();
        setSubmission(data.submission);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [resolvedParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#141414] animate-spin" />
          <p
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: '#8E8E93'
            }}
          >
            Loading story...
          </p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen pb-20 lg:pb-4">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-[100px] py-10">
          <div className="max-w-[1240px] mx-auto">
          <button
            onClick={() => router.push('/dashboard/writer')}
            className="flex items-center gap-2 text-[#8E8E93] hover:text-[#141414] transition-colors mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            <span
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400
              }}
            >
              Back to Stories
            </span>
          </button>

          <div className="bg-white rounded-lg border border-[#E5E5EA] p-12 text-center">
            <h2
              className="text-[#141414] mb-3"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '24px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              Story Not Found
            </h2>
            <p
              className="text-[#8E8E93] mb-6"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {error || 'The story you\'re looking for could not be found.'}
            </p>
            <button
              onClick={() => router.push('/dashboard/writer')}
              className="bg-[#141414] hover:bg-[#1f1f1f] text-white px-6 py-3 rounded-lg transition-colors"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Return to Dashboard
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const latestAIReview = submission.aiReviews && submission.aiReviews.length > 0
    ? submission.aiReviews[submission.aiReviews.length - 1]
    : null;

  return (
    <div className="min-h-screen pb-20 lg:pb-4">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-[100px] py-10">
        <div className="max-w-[1240px] mx-auto">
        <button
          onClick={() => router.push('/dashboard/writer')}
          className="flex items-center gap-2 text-[#8E8E93] hover:text-[#141414] transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 400
            }}
          >
            Back to Stories
          </span>
        </button>

        <div className="flex gap-5">
          <div className="flex-1 bg-white border border-[#E5E5EA] rounded-lg p-10" style={{ width: '820px' }}>
            <div className="space-y-4">
              <h1
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '24px',
                  fontWeight: 500,
                  lineHeight: '1.221',
                  color: '#141414'
                }}
              >
                {submission.title || 'Untitled'}
              </h1>

              <div
                className="prose prose-slate max-w-none"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193',
                  color: '#141414'
                }}
                dangerouslySetInnerHTML={{ __html: submission.content }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4" style={{ width: '400px' }}>
            <StoryMetadataCard
              status={submission.status}
              updatedAt={submission.updatedAt}
              wordCount={submission.wordCount}
            />

            <WritingTipsCard />

            <AIReviewCard
              submissionId={submission.id}
              existingReview={latestAIReview}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
