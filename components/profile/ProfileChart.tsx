'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface ChartData {
  submissionTrends?: Array<{ month: string; draft: number; submitted: number; published: number }>;
  readingAnalytics?: Array<{ month: string; booksCompleted: number; hoursRead: number }>;
  engagement?: Array<{ month: string; comments: number; activities: number }>;
}

interface ProfileChartProps {
  data: ChartData;
  role: string;
}

export default function ProfileChart({ data, role }: ProfileChartProps) {
  const { t } = useTranslation();

  const showSubmissions = ['WRITER', 'TEACHER', 'STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(role);
  const showReading = ['LEARNER', 'TEACHER', 'ADMIN'].includes(role);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.chart.submissionTrends')}</h2>

      {showSubmissions && data.submissionTrends && data.submissionTrends.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2 h-64">
            {data.submissionTrends.map((item, index) => {
              const total = item.draft + item.submitted + item.published;
              const maxHeight = Math.max(...data.submissionTrends!.map(d => d.draft + d.submitted + d.published));
              const height = total > 0 ? (total / maxHeight) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t" style={{ height: `${height}%`, minHeight: '20px' }}>
                    <div className="bg-blue-500 rounded-t" style={{ height: `${total > 0 ? (item.published / total) * 100 : 0}%` }} />
                    <div className="bg-yellow-500" style={{ height: `${total > 0 ? (item.submitted / total) * 100 : 0}%` }} />
                    <div className="bg-gray-400" style={{ height: `${total > 0 ? (item.draft / total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{item.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>{t('profile.stats.published')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>{t('profile.stats.submitted')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span>{t('profile.stats.draft')}</span>
            </div>
          </div>
        </div>
      ) : showReading && data.readingAnalytics && data.readingAnalytics.length > 0 ? (
        <div className="space-y-4">
          <p className="text-center text-gray-600">{t('profile.chart.readingAnalytics')}</p>
        </div>
      ) : (
        <p className="text-center text-gray-600 py-12">{t('profile.chart.noData')}</p>
      )}
    </div>
  );
}
