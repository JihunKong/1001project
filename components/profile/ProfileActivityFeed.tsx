'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Activity {
  id: string;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'ACHIEVEMENT';
  createdAt: string;
  author?: {
    id: string;
    name: string;
    image?: string;
  };
  content?: string;
  submissionId?: string;
  submissionTitle?: string;
  oldStatus?: string;
  newStatus?: string;
  achievementName?: string;
}

interface ProfileActivityFeedProps {
  userId: string;
}

export function ProfileActivityFeed({ userId }: ProfileActivityFeedProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch('/api/profile/activity');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();

    // TODO: Set up SSE for real-time updates
    // const eventSource = new EventSource('/api/notifications/stream');
    // eventSource.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   // Add new activity to the feed
    // };
    // return () => eventSource.close();

  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#141414] rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-[#8E8E93]" style={{ fontSize: '18px' }}>
        {t('profile.activity.noActivity')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[#141414] font-medium" style={{ fontSize: '24px' }}>
        {t('profile.activity.title')}
      </h2>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 rounded-r"
          >
            {activity.type === 'COMMENT' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {activity.author?.image ? (
                    <Image
                      src={activity.author.image}
                      alt={activity.author.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#E5E5EA] flex items-center justify-center text-xs">
                      {activity.author?.name?.[0] || 'U'}
                    </div>
                  )}
                  <span className="font-medium text-[#141414]" style={{ fontSize: '16px' }}>
                    {activity.author?.name}
                  </span>
                  <span className="text-[#8E8E93]" style={{ fontSize: '14px' }}>
                    {t('profile.activity.commented')}
                  </span>
                </div>

                {activity.content && (
                  <p className="text-[#484C56] mb-2" style={{ fontSize: '16px' }}>
                    {activity.content}
                  </p>
                )}

                {activity.submissionId && activity.submissionTitle && (
                  <Link
                    href={`/dashboard/writer/story/${activity.submissionId}`}
                    className="text-[#16A34A] hover:underline inline-flex items-center gap-1"
                    style={{ fontSize: '14px' }}
                  >
                    {t('profile.activity.viewStory')} {activity.submissionTitle}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </>
            )}

            {activity.type === 'STATUS_CHANGE' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#484C56]" style={{ fontSize: '16px' }}>
                    {t('profile.activity.statusChanged')}{' '}
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-medium">
                      {activity.newStatus}
                    </span>
                  </span>
                </div>

                {activity.submissionTitle && (
                  <p className="text-[#8E8E93]" style={{ fontSize: '14px' }}>
                    {activity.submissionTitle}
                  </p>
                )}
              </>
            )}

            {activity.type === 'ACHIEVEMENT' && (
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[#141414] font-medium" style={{ fontSize: '16px' }}>
                  {t('profile.activity.achievementUnlocked')} {activity.achievementName}
                </span>
              </div>
            )}

            <div className="text-[#8E8E93] text-xs mt-2">
              {new Date(activity.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
