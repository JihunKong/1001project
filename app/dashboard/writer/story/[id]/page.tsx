'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Edit } from 'lucide-react';
import {
  StoryTrackingCard,
  PublishingStatusCard,
  ReviewerFeedbackList,
  StoryContentViewer,
  RevisionTimeline
} from '../../components';
import AIReviewCard from '@/components/story-publication/writer/AIReviewCard';
import AnnotatedStoryViewer from '@/components/story-publication/writer/AnnotatedStoryViewer';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TextSubmission {
  id: string;
  title: string;
  content: string;
  summary?: string;
  generatedImages?: string[];
  status: string;
  wordCount?: number | null;
  targetAudience?: string;
  updatedAt: string;
  createdAt: string;
  storyFeedback?: string;
  bookDecision?: string;
  finalNotes?: string;
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
  contentAdmin?: {
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
      role: string;
    };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      email: string;
      role: string;
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
  const { t } = useTranslation();
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
            {t('dashboard.writer.storyDetail.loadingStory')}
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
              {t('dashboard.writer.storyDetail.backToStories')}
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
              {t('dashboard.writer.storyDetail.notFound.title')}
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
              {error || t('dashboard.writer.storyDetail.notFound.message')}
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
              {t('dashboard.writer.storyDetail.returnToDashboard')}
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const reviewerRoles = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'];

  // Get the latest feedback date from workflow history for different roles
  const getFeedbackDate = (role: string, fallbackStatus: string[]) => {
    const feedbackHistory = submission.workflowHistory?.find(
      h => fallbackStatus.includes(h.toStatus) && h.performedBy?.role === role
    );
    return feedbackHistory?.createdAt || submission.updatedAt;
  };

  const getStoryFeedbackDate = () => getFeedbackDate('STORY_MANAGER', ['NEEDS_REVISION', 'STORY_APPROVED']);
  const getBookDecisionDate = () => getFeedbackDate('BOOK_MANAGER', ['NEEDS_REVISION', 'FORMAT_REVIEW', 'CONTENT_REVIEW']);
  const getFinalNotesDate = () => getFeedbackDate('CONTENT_ADMIN', ['NEEDS_REVISION', 'PUBLISHED', 'REJECTED']);

  const feedbacks = [
    // Include storyFeedback from Story Manager if exists
    ...(submission.storyFeedback ? [{
      id: 'story-feedback',
      authorName: submission.storyManager?.name || t('dashboard.writer.feedback.storyManager'),
      authorEmail: submission.storyManager?.email || '',
      content: submission.storyFeedback,
      createdAt: getStoryFeedbackDate()
    }] : []),
    // Include bookDecision from Book Manager if exists
    ...(submission.bookDecision ? [{
      id: 'book-decision',
      authorName: submission.bookManager?.name || t('dashboard.writer.feedback.bookManager'),
      authorEmail: submission.bookManager?.email || '',
      content: submission.bookDecision,
      createdAt: getBookDecisionDate()
    }] : []),
    // Include finalNotes from Content Admin if exists
    ...(submission.finalNotes ? [{
      id: 'final-notes',
      authorName: submission.contentAdmin?.name || t('dashboard.writer.feedback.contentAdmin'),
      authorEmail: submission.contentAdmin?.email || '',
      content: submission.finalNotes,
      createdAt: getFinalNotesDate()
    }] : []),
    // Include inline comments from reviewers
    ...(submission.comments
      ?.filter(comment => {
        const isReviewer = reviewerRoles.includes(comment.author.role);
        const isNotAuthor = comment.author.id !== submission.author.id;
        return isReviewer && isNotAuthor;
      })
      .map(comment => ({
        id: comment.id,
        authorName: comment.author.name || comment.author.email,
        authorEmail: comment.author.email,
        content: comment.content,
        createdAt: comment.createdAt
      })) || [])
  ];

  return (
    <div key={resolvedParams?.id || 'loading'} className="min-h-screen bg-[#F9FAFB] pb-20 lg:pb-4">
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
              {t('dashboard.writer.storyDetail.backToStories')}
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
                {t('dashboard.writer.storyDetail.title')}
              </h1>

              {(submission.status === 'DRAFT' || submission.status === 'NEEDS_REVISION' || submission.status === 'REJECTED') && (
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
                  {t('dashboard.writer.storyDetail.editButton')}
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Two-column layout for cards (Figma design) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Left Column: Story Info + Publishing Status */}
                <div className="space-y-5">
                  <StoryTrackingCard
                    title={submission.title || t('dashboard.writer.storyDetail.untitled')}
                    description={submission.summary || submission.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                    thumbnailUrl={submission.generatedImages?.[0]}
                    status={submission.status}
                    submissionDate={submission.createdAt}
                    targetAudience={submission.targetAudience}
                    wordCount={submission.wordCount || undefined}
                  />
                  <PublishingStatusCard currentStatus={submission.status} />
                </div>

                {/* Right Column: Reviewer's Feedback */}
                <div className="h-full">
                  <ReviewerFeedbackList feedbacks={feedbacks} />
                </div>
              </div>

              {submission.workflowHistory && submission.workflowHistory.length > 0 && (
                <RevisionTimeline workflowHistory={submission.workflowHistory} />
              )}

              {(submission.status === 'DRAFT' || submission.status === 'NEEDS_REVISION') ? (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(350px,450px)_1fr] gap-5">
                  <div className="overflow-hidden">
                    <AIReviewCard submissionId={submission.id} />
                  </div>
                  <div className="overflow-hidden">
                    <AnnotatedStoryViewer
                      title={submission.title || t('dashboard.writer.storyDetail.untitled')}
                      content={submission.content}
                      submissionId={submission.id}
                    />
                  </div>
                </div>
              ) : (
                <StoryContentViewer
                  title={submission.title || t('dashboard.writer.storyDetail.untitled')}
                  content={submission.content}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
