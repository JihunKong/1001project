'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useSSENotifications } from '@/hooks/useSSENotifications';
import { SSEEvent } from '@/types/api';
import { PenTool, CheckCircle } from 'lucide-react';

import SubmissionTabs, { SubmissionStatus } from '@/components/SubmissionTabs';
import SubmissionList from '@/components/SubmissionList';
import DashboardLoadingState from '@/components/dashboard/DashboardLoadingState';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState';

interface TextSubmission {
  id: string;
  title: string;
  authorAlias: string | null;
  content: string;
  status: string;
  wordCount?: number | null;
  category: string[];
  tags: string[];
  summary: string;
  language?: string;
  ageRange?: string | null;
  storyFeedback?: string | null;
  bookDecision?: string | null;
  finalNotes?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  submissionsTotal: number;
  submissionsApproved: number;
  submissionsPublished: number;
  submissionsInReview: number;
  readersReached: number;
  totalContributions: number;
  rank: string;
  workflowInsights: {
    averageReviewTime: number;
    successRate: number;
    currentInReview: number;
    needsRevision: number;
  };
  recentSubmissions: number;
  achievements: Array<{
    name: string;
    icon: string;
    earned: boolean;
    description: string;
  }>;
}

export default function WriterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SubmissionStatus>('DRAFT');

  const { isConnected, error: sseError, reconnect } = useSSENotifications({
    onStatusUpdate: (event: SSEEvent) => {
      setNotification(`Your story "${event.data.title}" status changed to ${event.data.status}`);
      fetchData();
      setTimeout(() => setNotification(null), 5000);
    },
    onFeedbackReceived: (event: SSEEvent) => {
      setNotification(`New feedback received for "${event.data.title}"`);
      fetchData();
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error) => {
      console.error('SSE error:', error);
    },
    enabled: session?.user?.role === 'WRITER'
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'WRITER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  const fetchData = async () => {
    try {
      const [submissionsRes, statsRes] = await Promise.all([
        fetch('/api/text-submissions?limit=20'),
        fetch('/api/writer/text-stats')
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'WRITER') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [session, status]);

  const handleViewStory = (id: string) => {
    router.push(`/dashboard/writer/story/${id}`);
  };

  const handleEditStory = (id: string) => {
    router.push(`/dashboard/writer/submit-text?edit=${id}`);
  };

  const handleDeleteStory = async (id: string) => {
    try {
      const response = await fetch(`/api/text-submissions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete story');
      await fetchData();
      setNotification('Story deleted successfully');
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Error deleting story:', err);
      setNotification('Failed to delete story. Please try again.');
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleWithdrawStory = async (id: string) => {
    try {
      const response = await fetch(`/api/text-submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'withdraw' })
      });
      if (!response.ok) throw new Error('Failed to withdraw story');
      await fetchData();
      setActiveTab('DRAFT');
      setNotification('Story withdrawn successfully. You can now edit it.');
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Error withdrawing story:', err);
      setNotification('Failed to withdraw story. Please try again.');
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const filteredSubmissions = submissions.filter(s => s.status === activeTab);

  const statusCounts = {
    DRAFT: submissions.filter(s => s.status === 'DRAFT').length,
    PENDING: submissions.filter(s => s.status === 'PENDING' || s.status === 'SUBMITTED').length,
    STORY_REVIEW: submissions.filter(s => s.status === 'STORY_REVIEW' || s.status === 'IN_REVIEW').length,
    PUBLISHED: submissions.filter(s => s.status === 'PUBLISHED').length,
    NEEDS_REVISION: submissions.filter(s => s.status === 'NEEDS_REVISION').length,
  };

  if (status === 'loading' || loading) {
    return <DashboardLoadingState message="Loading your dashboard..." role="writer" />;
  }

  if (error) {
    return <DashboardErrorState error={error} role="writer" />;
  }

  return (
    <>
      <div className="pb-20 lg:pb-4">
        {notification && (
          <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 fixed top-20 left-0 right-0 z-30 shadow-lg"
          >
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p className="font-medium">{notification}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-green-700 hover:text-green-900 focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {sseError && (
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 fixed top-20 left-0 right-0 z-30 shadow-lg"
          >
            <div className="flex items-center justify-between px-6">
              <p className="text-sm">
                Notification service disconnected. <button onClick={reconnect} className="underline">Reconnect</button>
              </p>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>
        )}

        <div id="main-content" className="max-w-[1240px] px-4 sm:px-8 lg:px-12 py-10 pb-20 lg:pb-10">
          <div className="flex items-center justify-between mb-12">
            <h1
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '48px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              Stories
            </h1>
            <button
              onClick={() => router.push('/dashboard/writer/submit-text')}
              className="bg-[#141414] hover:bg-[#1f1f1f] !text-white px-8 py-3.5 rounded-lg flex items-center gap-2.5 transition-all hover:shadow-md"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.221',
                color: '#ffffff'
              }}
            >
              <PenTool className="h-5 w-5 !text-white" style={{ color: '#ffffff' }} />
              Write Story
            </button>
          </div>

          <div className="mb-8">
            <SubmissionTabs
              statusCounts={statusCounts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="mt-8">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#E5E5EA] py-16 px-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F9FAFB] flex items-center justify-center">
                  <PenTool className="h-8 w-8 text-[#AEAEB2]" />
                </div>
                <h3
                  className="text-[#141414] mb-3"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '24px',
                    fontWeight: 500,
                    lineHeight: '1.221'
                  }}
                >
                  No stories yet
                </h3>
                <p
                  className="text-[#8E8E93] mb-8"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.5'
                  }}
                >
                  Start your writing journey by creating your first story. Share your creativity with children around the world.
                </p>
                <button
                  onClick={() => router.push('/dashboard/writer/submit-text')}
                  className="bg-[#141414] hover:bg-[#1f1f1f] !text-white px-8 py-3.5 rounded-lg inline-flex items-center gap-2 transition-all hover:shadow-md"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.221',
                    color: '#ffffff'
                  }}
                >
                  <PenTool className="h-5 w-5 !text-white" style={{ color: '#ffffff' }} />
                  Write Your First Story
                </button>
              </div>
            </div>
          ) : (
            <SubmissionList
              submissions={filteredSubmissions}
              onViewClick={handleViewStory}
              onEditClick={handleEditStory}
              onDeleteClick={handleDeleteStory}
              onWithdrawClick={handleWithdrawStory}
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
}
