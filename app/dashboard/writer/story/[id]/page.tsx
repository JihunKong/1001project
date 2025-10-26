'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Edit } from 'lucide-react';
import {
  StoryTrackingCard,
  PublishingStatusTimeline,
  ReviewerFeedbackList,
  StoryContentViewer
} from '../../components';

interface TextSubmission {
  id: string;
  title: string;
  content: string;
  summary?: string;
  thumbnailUrl?: string;
  status: string;
  wordCount?: number | null;
  targetAudience?: string;
  updatedAt: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  workflowHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    comment?: string;
    createdAt: string;
    performedBy: {
      id: string;
      name: string;
      email: string;
    };
  }>;
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

  const feedbacks = submission.workflowHistory
    ?.filter(entry => entry.comment && entry.comment.trim() !== '')
    .map(entry => ({
      id: entry.id,
      authorName: entry.performedBy.name,
      authorEmail: entry.performedBy.email,
      content: entry.comment || '',
      createdAt: entry.createdAt
    })) || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 lg:pb-4">
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

          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <h1
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '40px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                Track Your Story
              </h1>

              <button
                onClick={() => router.push(`/dashboard/writer/submit-text?edit=${submission.id}`)}
                className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-[#F9FAFB] border border-[#141414] text-[#141414] rounded-full transition-colors"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                <Edit className="w-5 h-5" />
                Edit a story
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex gap-5">
                <div className="flex flex-col gap-5">
                  <StoryTrackingCard
                    title={submission.title || 'Untitled'}
                    description={submission.summary || submission.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                    thumbnailUrl={submission.thumbnailUrl}
                    status={submission.status}
                    submissionDate={submission.createdAt}
                    targetAudience={submission.targetAudience}
                    wordCount={submission.wordCount || undefined}
                  />

                  <PublishingStatusTimeline currentStatus={submission.status} />
                </div>

                <ReviewerFeedbackList feedbacks={feedbacks} />
              </div>

              <StoryContentViewer
                title={submission.title || 'Untitled'}
                content={submission.content}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
