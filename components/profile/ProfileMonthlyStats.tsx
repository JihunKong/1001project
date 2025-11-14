'use client';

import { useState, useMemo } from 'react';
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
  const { t, isLoading } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const statCards = useMemo(() => [
    {
      label: t('profile.stats.published'),
      value: stats.submissions?.published || 0
    },
    {
      label: t('profile.stats.draft'),
      value: stats.submissions?.draft || 0
    },
    {
      label: t('profile.stats.submitted'),
      value: stats.submissions?.submitted || 0
    },
    {
      label: t('profile.stats.underReview'),
      value: stats.submissions?.underReview || 0
    },
    {
      label: t('profile.stats.feedback'),
      value: stats.submissions?.needsRevision || 0
    }
  ], [t, stats]);

  const getMonthName = useMemo(() => {
    const monthKeys = [
      'profile.monthly.months.january', 'profile.monthly.months.february', 'profile.monthly.months.march',
      'profile.monthly.months.april', 'profile.monthly.months.may', 'profile.monthly.months.june',
      'profile.monthly.months.july', 'profile.monthly.months.august', 'profile.monthly.months.september',
      'profile.monthly.months.october', 'profile.monthly.months.november', 'profile.monthly.months.december'
    ];
    return (monthIndex: number) => t(monthKeys[monthIndex]);
  }, [t]);

  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push({
        value: date.toISOString(),
        label: `${getMonthName(date.getMonth())} ${date.getFullYear()}`
      });
    }

    return options;
  }, [getMonthName]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedMonth(newDate);

    if (onDateRangeChange) {
      const startDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const endDate = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
      onDateRangeChange(startDate.toISOString(), endDate.toISOString());
    }
  };

  if (isLoading) {
    return <div className="mb-8 text-center py-8">Loading...</div>;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '32px',
          fontWeight: 500,
          lineHeight: '1.221',
          color: '#141414'
        }}>
          {t('profile.monthly.title')}
        </h2>
        <select
          value={selectedMonth.toISOString()}
          onChange={handleMonthChange}
          className="px-4 py-2 border border-[#E5E5EA] rounded-lg"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            color: '#141414'
          }}
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="text-center">
            <div style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '48px',
              fontWeight: 500,
              lineHeight: '1.221',
              color: '#141414',
              marginBottom: '8px'
            }}>
              {stat.value}
            </div>
            <p style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: '1.193',
              color: '#8E8E93'
            }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
