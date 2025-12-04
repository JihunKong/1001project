'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';
import {
  MessageSquare,
  CheckCircle,
  Edit,
  Send,
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';

interface ActivityPerformer {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ActivitySubmission {
  id: string;
  title: string;
  type: 'text' | 'volunteer';
  authorName: string | null;
}

interface ActivityEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  comment: string | null;
  createdAt: string;
  performedBy: ActivityPerformer;
  submission: ActivitySubmission | null;
}

interface ActivityFeedProps {
  limit?: number;
  days?: number;
  showRefresh?: boolean;
}

const getActionText = (fromStatus: string | null, toStatus: string, t: (key: string) => string): string => {
  if (toStatus === 'NEEDS_REVISION') {
    return t('dashboard.common.activityFeed.actions.requestedRevision');
  }
  if (toStatus === 'STORY_APPROVED') {
    return t('dashboard.common.activityFeed.actions.approved');
  }
  if (toStatus === 'PENDING' && fromStatus === 'DRAFT') {
    return t('dashboard.common.activityFeed.actions.submitted');
  }
  if (toStatus === 'PENDING' && fromStatus === 'NEEDS_REVISION') {
    return t('dashboard.common.activityFeed.actions.resubmitted');
  }
  if (toStatus === 'STORY_REVIEW') {
    return t('dashboard.common.activityFeed.actions.startedReview');
  }
  if (toStatus === 'FORMAT_REVIEW') {
    return t('dashboard.common.activityFeed.actions.sentToBookManager');
  }
  if (toStatus === 'PUBLISHED') {
    return t('dashboard.common.activityFeed.actions.published');
  }
  return t('dashboard.common.activityFeed.actions.statusChanged');
};

const getActionIcon = (toStatus: string) => {
  switch (toStatus) {
    case 'NEEDS_REVISION':
      return <Edit className="h-4 w-4" />;
    case 'STORY_APPROVED':
    case 'PUBLISHED':
      return <CheckCircle className="h-4 w-4" />;
    case 'PENDING':
      return <Send className="h-4 w-4" />;
    case 'STORY_REVIEW':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getActionIconColor = (toStatus: string): string => {
  switch (toStatus) {
    case 'NEEDS_REVISION':
      return 'text-orange-500';
    case 'STORY_APPROVED':
    case 'PUBLISHED':
      return 'text-green-500';
    case 'PENDING':
      return 'text-blue-500';
    case 'STORY_REVIEW':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
};

const getRoleName = (role: string, t: (key: string) => string): string => {
  switch (role) {
    case 'STORY_MANAGER':
      return t('dashboard.common.activityFeed.roles.storyManager');
    case 'BOOK_MANAGER':
      return t('dashboard.common.activityFeed.roles.bookManager');
    case 'CONTENT_ADMIN':
      return t('dashboard.common.activityFeed.roles.contentAdmin');
    case 'ADMIN':
      return t('dashboard.common.activityFeed.roles.admin');
    case 'WRITER':
      return t('dashboard.common.activityFeed.roles.writer');
    default:
      return role;
  }
};

const formatRelativeTime = (dateString: string, t: (key: string, params?: Record<string, string | number>) => string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return t('dashboard.common.activityFeed.time.justNow');
  }
  if (diffMins < 60) {
    return t('dashboard.common.activityFeed.time.minutesAgo', { count: diffMins });
  }
  if (diffHours < 24) {
    return t('dashboard.common.activityFeed.time.hoursAgo', { count: diffHours });
  }
  if (diffDays < 7) {
    return t('dashboard.common.activityFeed.time.daysAgo', { count: diffDays });
  }
  return date.toLocaleDateString();
};

export default function ActivityFeed({ limit = 10, days = 7, showRefresh = true }: ActivityFeedProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/activity-log?limit=${limit}&days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit, days]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.common.activityFeed.title')}</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.common.activityFeed.title')}</h3>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.common.activityFeed.title')}</h3>
        </div>
        {showRefresh && (
          <button
            onClick={fetchActivities}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title={t('dashboard.common.activityFeed.refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          {t('dashboard.common.activityFeed.empty')}
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 ${getActionIconColor(activity.toStatus)}`}>
                {getActionIcon(activity.toStatus)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.performedBy.name}</span>
                  <span className="text-gray-500"> ({getRoleName(activity.performedBy.role, t)})</span>
                  <span className="text-gray-700"> {getActionText(activity.fromStatus, activity.toStatus, t)} </span>
                  {activity.submission && (
                    <Link
                      href={`/dashboard/story-manager/review/${activity.submission.id}`}
                      className="text-soe-green-600 hover:text-soe-green-800 font-medium"
                    >
                      &quot;{activity.submission.title}&quot;
                    </Link>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatRelativeTime(activity.createdAt, t)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
