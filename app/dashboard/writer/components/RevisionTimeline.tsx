'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { MessageSquare, CheckCircle, Edit, Send, AlertCircle } from 'lucide-react';

interface WorkflowHistoryEntry {
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
}

interface RevisionTimelineProps {
  workflowHistory: WorkflowHistoryEntry[];
}

const getStatusActionText = (fromStatus: string, toStatus: string, t: (key: string) => string): string => {
  if (toStatus === 'NEEDS_REVISION') {
    return t('dashboard.writer.revisionTimeline.requestedRevision');
  }
  if (toStatus === 'STORY_APPROVED') {
    return t('dashboard.writer.revisionTimeline.approvedStory');
  }
  if (toStatus === 'PENDING' && fromStatus === 'DRAFT') {
    return t('dashboard.writer.revisionTimeline.submitted');
  }
  if (toStatus === 'PENDING' && fromStatus === 'NEEDS_REVISION') {
    return t('dashboard.writer.revisionTimeline.resubmitted');
  }
  if (toStatus === 'STORY_REVIEW') {
    return t('dashboard.writer.revisionTimeline.startedReview');
  }
  if (toStatus === 'FORMAT_REVIEW') {
    return t('dashboard.writer.revisionTimeline.sentToBookManager');
  }
  if (toStatus === 'PUBLISHED') {
    return t('dashboard.writer.revisionTimeline.published');
  }
  return t('dashboard.writer.revisionTimeline.statusChanged');
};

const getStatusIcon = (toStatus: string) => {
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

const getStatusColor = (toStatus: string): string => {
  switch (toStatus) {
    case 'NEEDS_REVISION':
      return 'bg-orange-100 text-orange-700';
    case 'STORY_APPROVED':
    case 'PUBLISHED':
      return 'bg-green-100 text-green-700';
    case 'PENDING':
      return 'bg-blue-100 text-blue-700';
    case 'STORY_REVIEW':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getRoleName = (role: string, t: (key: string) => string): string => {
  switch (role) {
    case 'STORY_MANAGER':
      return t('dashboard.writer.revisionTimeline.roles.storyManager');
    case 'BOOK_MANAGER':
      return t('dashboard.writer.revisionTimeline.roles.bookManager');
    case 'CONTENT_ADMIN':
      return t('dashboard.writer.revisionTimeline.roles.contentAdmin');
    case 'ADMIN':
      return t('dashboard.writer.revisionTimeline.roles.admin');
    case 'WRITER':
      return t('dashboard.writer.revisionTimeline.roles.writer');
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
    return t('dashboard.writer.revisionTimeline.time.justNow');
  }
  if (diffMins < 60) {
    return t('dashboard.writer.revisionTimeline.time.minutesAgo', { count: diffMins });
  }
  if (diffHours < 24) {
    return t('dashboard.writer.revisionTimeline.time.hoursAgo', { count: diffHours });
  }
  if (diffDays < 7) {
    return t('dashboard.writer.revisionTimeline.time.daysAgo', { count: diffDays });
  }
  return date.toLocaleDateString();
};

export default function RevisionTimeline({ workflowHistory }: RevisionTimelineProps) {
  const { t } = useTranslation();

  if (!workflowHistory || workflowHistory.length === 0) {
    return null;
  }

  const sortedHistory = [...workflowHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6">
      <h3
        className="text-[#141414] mb-6"
        style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 500,
          lineHeight: '1.221'
        }}
      >
        {t('dashboard.writer.revisionTimeline.title')}
      </h3>

      <div className="space-y-4">
        {sortedHistory.map((entry, index) => (
          <div key={entry.id} className="relative">
            {index < sortedHistory.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-[#E5E5EA]" />
            )}

            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(entry.toStatus)}`}>
                {getStatusIcon(entry.toStatus)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="text-[#141414]"
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '1.5'
                      }}
                    >
                      <span className="font-medium">{entry.performedBy.name}</span>
                      <span className="text-[#8E8E93] font-normal"> ({getRoleName(entry.performedBy.role, t)})</span>
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
                      {getStatusActionText(entry.fromStatus, entry.toStatus, t)}
                    </p>
                  </div>
                  <span
                    className="text-[#8E8E93] whitespace-nowrap"
                    style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400
                    }}
                  >
                    {formatRelativeTime(entry.createdAt, t)}
                  </span>
                </div>

                {entry.comment && (
                  <div className="mt-2 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5EA]">
                    <p
                      className="text-[#141414]"
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 400,
                        lineHeight: '1.5'
                      }}
                    >
                      {entry.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
