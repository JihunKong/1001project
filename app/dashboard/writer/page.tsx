'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import {
  PenTool,
  CheckCircle,
  FileText,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Globe,
  Calendar,
  Bookmark,
  Bell
} from 'lucide-react';
import DashboardLoadingState from '@/components/dashboard/DashboardLoadingState';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState';

interface TextSubmission {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  PenTool,
  BookOpen,
  Award,
  Globe,
  FileText,
  Calendar
};

export default function WriterHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<TextSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [statsRes, submissionsRes] = await Promise.all([
        fetch('/api/writer/text-stats'),
        fetch('/api/text-submissions?limit=5')
      ]);

      if (!statsRes.ok || !submissionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const statsData = await statsRes.json();
      const submissionsData = await submissionsRes.json();

      setStats(statsData);
      setRecentSubmissions(submissionsData.submissions || []);
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-[#E5E5EA] text-[#8E8E93]';
      case 'PENDING':
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-700';
      case 'STORY_REVIEW':
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700';
      case 'NEEDS_REVISION':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-[#E5E5EA] text-[#8E8E93]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'PENDING':
      case 'SUBMITTED':
        return 'Pending';
      case 'STORY_REVIEW':
      case 'IN_REVIEW':
        return 'In Review';
      case 'PUBLISHED':
        return 'Published';
      case 'NEEDS_REVISION':
        return 'Needs Revision';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 30) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (status === 'loading' || loading) {
    return <DashboardLoadingState message="Loading your dashboard..." role="writer" />;
  }

  if (error) {
    return <DashboardErrorState error={error} role="writer" />;
  }

  if (!stats) {
    return <DashboardErrorState error="Failed to load statistics" role="writer" />;
  }

  return (
    <div className="pb-20 lg:pb-4">
      <div id="main-content" className="max-w-[1240px] px-4 sm:px-8 lg:px-12 py-10 pb-20 lg:pb-10">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1
            className="text-[#141414] mb-2"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '48px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Writer'}
          </h1>
          <p
            className="text-[#8E8E93]"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: '1.5'
            }}
          >
            Continue your writing journey and inspire young readers around the world
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Stories */}
          <div className="bg-white rounded-lg border border-[#E5E5EA] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#F9FAFB] flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#141414]" />
              </div>
            </div>
            <p
              className="text-[#8E8E93] mb-1"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              Total Stories
            </p>
            <p
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '36px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {stats.submissionsTotal}
            </p>
          </div>

          {/* Published */}
          <div className="bg-white rounded-lg border border-[#E5E5EA] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p
              className="text-[#8E8E93] mb-1"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              Published
            </p>
            <p
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '36px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {stats.submissionsPublished}
            </p>
          </div>

          {/* In Review */}
          <div className="bg-white rounded-lg border border-[#E5E5EA] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p
              className="text-[#8E8E93] mb-1"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              In Review
            </p>
            <p
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '36px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {stats.submissionsInReview}
            </p>
          </div>

          {/* Readers Reached */}
          <div className="bg-white rounded-lg border border-[#E5E5EA] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p
              className="text-[#8E8E93] mb-1"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              Readers Reached
            </p>
            <p
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '36px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {stats.readersReached.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2
            className="text-[#141414] mb-6"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard/writer/submit-text')}
              className="bg-[#141414] hover:bg-[#1f1f1f] text-white p-6 rounded-lg transition-all hover:shadow-md flex flex-col items-center gap-3"
            >
              <PenTool className="h-8 w-8" />
              <span
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                Write Story
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard/writer/library')}
              className="bg-white hover:bg-[#F9FAFB] border border-[#E5E5EA] p-6 rounded-lg transition-all hover:shadow-md flex flex-col items-center gap-3"
            >
              <Bookmark className="h-8 w-8 text-[#141414]" />
              <span
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                View Library
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard/writer/stories')}
              className="bg-white hover:bg-[#F9FAFB] border border-[#E5E5EA] p-6 rounded-lg transition-all hover:shadow-md flex flex-col items-center gap-3"
            >
              <FileText className="h-8 w-8 text-[#141414]" />
              <span
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                My Stories
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard/writer/notifications')}
              className="bg-white hover:bg-[#F9FAFB] border border-[#E5E5EA] p-6 rounded-lg transition-all hover:shadow-md flex flex-col items-center gap-3"
            >
              <Bell className="h-8 w-8 text-[#141414]" />
              <span
                className="text-[#141414]"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                Notifications
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '24px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              Recent Activity
            </h2>
            <button
              onClick={() => router.push('/dashboard/writer/stories')}
              className="text-[#007AFF] hover:underline"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              View all
            </button>
          </div>
          {recentSubmissions.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#E5E5EA] py-12 px-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F9FAFB] flex items-center justify-center">
                <FileText className="h-8 w-8 text-[#AEAEB2]" />
              </div>
              <p
                className="text-[#8E8E93] mb-6"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.5'
                }}
              >
                No stories yet. Start writing to see your activity here.
              </p>
              <button
                onClick={() => router.push('/dashboard/writer/submit-text')}
                className="bg-[#141414] hover:bg-[#1f1f1f] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                <PenTool className="h-5 w-5" />
                Write Your First Story
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => router.push(`/dashboard/writer/story/${submission.id}`)}
                  className="p-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[#141414] truncate mb-1"
                        style={{
                          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                          fontSize: '16px',
                          fontWeight: 500,
                          lineHeight: '1.221'
                        }}
                      >
                        {submission.title}
                      </p>
                      <p
                        className="text-[#8E8E93]"
                        style={{
                          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                          fontSize: '14px',
                          fontWeight: 400,
                          lineHeight: '1.5'
                        }}
                      >
                        Updated {formatDate(submission.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={`ml-4 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusBadgeColor(submission.status)}`}
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '1.221'
                      }}
                    >
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div>
          <h2
            className="text-[#141414] mb-6"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            Achievements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.achievements.map((achievement) => {
              const IconComponent = ICON_MAP[achievement.icon] || Award;
              return (
                <div
                  key={achievement.name}
                  className={`bg-white rounded-lg border p-4 text-center transition-all ${
                    achievement.earned
                      ? 'border-green-500 shadow-sm'
                      : 'border-[#E5E5EA] opacity-50'
                  }`}
                  title={achievement.description}
                >
                  <div
                    className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      achievement.earned ? 'bg-green-50' : 'bg-[#F9FAFB]'
                    }`}
                  >
                    <IconComponent
                      className={`h-6 w-6 ${achievement.earned ? 'text-green-600' : 'text-[#AEAEB2]'}`}
                    />
                  </div>
                  <p
                    className={achievement.earned ? 'text-[#141414]' : 'text-[#8E8E93]'}
                    style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '12px',
                      fontWeight: 500,
                      lineHeight: '1.221'
                    }}
                  >
                    {achievement.name}
                  </p>
                  {achievement.earned && (
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
