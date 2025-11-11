'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Stats {
  submissions?: { published: number; draft: number; submitted: number; underReview: number; needsRevision: number };
  reading?: { booksRead: number; hoursReading: number };
  engagement?: { commentsPosted: number; achievementsEarned: number };
}

interface ProfileMonthlyStatsProps {
  stats: Stats;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export default function ProfileMonthlyStats({ stats, onDateRangeChange }: ProfileMonthlyStatsProps) {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  const statCards = [
    { label: t('profile.stats.published'), value: stats.submissions?.published || 0, color: 'bg-blue-500' },
    { label: t('profile.stats.draft'), value: stats.submissions?.draft || 0, color: 'bg-gray-500' },
    { label: t('profile.stats.submitted'), value: stats.submissions?.submitted || 0, color: 'bg-purple-500' },
    { label: t('profile.stats.underReview'), value: stats.submissions?.underReview || 0, color: 'bg-yellow-500' },
    { label: t('profile.stats.booksRead'), value: stats.reading?.booksRead || 0, color: 'bg-green-500' },
    { label: t('profile.stats.hoursReading'), value: stats.reading?.hoursReading || 0, color: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('profile.monthly.title')}</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="thisMonth">{t('profile.monthly.thisMonth')}</option>
          <option value="lastMonth">{t('profile.monthly.lastMonth')}</option>
          <option value="last3Months">{t('profile.monthly.last3Months')}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mb-2`}>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
