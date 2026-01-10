'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  DashboardHeader,
  DashboardStatsCard,
  DashboardSection,
  DashboardLoadingState,
  DashboardErrorState
} from '@/components/dashboard';
import { BarChart3, Users, GraduationCap, Building2, TrendingUp, BookOpen } from 'lucide-react';

interface Analytics {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalBooks: number;
  completionRate: number;
  engagementScore: number;
}

export default function InstitutionAnalyticsPage() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
      return;
    }
    if (session.user?.role !== 'INSTITUTION') {
      redirect('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [session, status, dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/institution/analytics?type=overview&range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setAnalytics({
        totalTeachers: 0,
        totalStudents: 0,
        totalClasses: 0,
        totalBooks: 0,
        completionRate: 0,
        engagementScore: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <DashboardLoadingState message="Loading analytics..." />;
  }

  if (error) {
    return <DashboardErrorState error={error} onRetry={fetchAnalytics} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader
          title="Institution Analytics"
          subtitle="Monitor your institution's performance"
          icon={BarChart3}
          iconColor="from-purple-500 to-purple-600"
          actions={
            <select
              name="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
              className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="date-range"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <DashboardStatsCard
            title="Teachers"
            value={analytics?.totalTeachers ?? 0}
            icon={Users}
            iconColor="blue"
          />
          <DashboardStatsCard
            title="Students"
            value={analytics?.totalStudents ?? 0}
            icon={GraduationCap}
            iconColor="green"
          />
          <DashboardStatsCard
            title="Classes"
            value={analytics?.totalClasses ?? 0}
            icon={Building2}
            iconColor="purple"
          />
          <DashboardStatsCard
            title="Books"
            value={analytics?.totalBooks ?? 0}
            icon={BookOpen}
            iconColor="orange"
          />
          <DashboardStatsCard
            title="Completion Rate"
            value={`${analytics?.completionRate ?? 0}%`}
            icon={TrendingUp}
            iconColor="emerald"
          />
          <DashboardStatsCard
            title="Engagement"
            value={`${analytics?.engagementScore ?? 0}%`}
            icon={BarChart3}
            iconColor="pink"
          />
        </div>

        <DashboardSection title="Performance Overview" icon={BarChart3}>
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg" data-testid="progress-chart">
            <div className="text-center">
              <canvas className="mx-auto mb-2" />
              <span>Chart visualization coming soon</span>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Teacher Performance" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="teacher-performance">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Teacher</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No teacher data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
