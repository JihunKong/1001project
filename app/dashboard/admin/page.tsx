'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Users,
  BookOpen,
  Shield,
  Database,
  CheckCircle,
  Settings,
  FileText,
  Activity,
  BarChart3,
  Globe,
  Server
} from 'lucide-react';
import {
  DashboardHeader,
  DashboardLoadingState,
  DashboardErrorState,
  DashboardStatsCard,
  DashboardStatusBadge,
  DashboardTable,
  DashboardSection,
  DashboardProgressBar,
  DashboardEmptyState,
  type Column
} from '@/components/dashboard';

interface SystemStats {
  totalUsers: number;
  totalBooks: number;
  totalSubmissions: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  diskUsage: number;
  memoryUsage: number;
  uptime: string;
}

interface UsersByRole {
  LEARNER: number;
  TEACHER: number;
  WRITER: number;
  STORY_MANAGER: number;
  BOOK_MANAGER: number;
  CONTENT_ADMIN: number;
  INSTITUTION: number;
  ADMIN: number;
}

interface PendingReview {
  id: string;
  type: 'submission' | 'user' | 'report';
  title: string;
  submitter: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [usersByRole, setUsersByRole] = useState<UsersByRole | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'ADMIN') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      // Fetch real statistics from API
      const response = await fetch('/api/admin/stats?timeframe=30d');

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();

      // Map API response to dashboard state
      setSystemStats({
        totalUsers: data.overview.users.total,
        totalBooks: data.overview.content.totalBooks,
        totalSubmissions: data.overview.content.submissions.total,
        activeUsers: data.overview.users.active,
        systemHealth: 'healthy', // Keep as static for now
        diskUsage: 0, // System metrics not yet implemented
        memoryUsage: 0,
        uptime: 'N/A'
      });

      setUsersByRole(data.overview.users.byRole);

      // Clear pending reviews and system alerts - these should come from dedicated endpoints
      setPendingReviews([]);
      setSystemAlerts([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return <DashboardLoadingState role="admin" message={t('dashboard.common.loadingAdminDashboard')} />;
  }

  if (error) {
    return <DashboardErrorState role="admin" error={error} />;
  }

  const reviewColumns: Column<PendingReview>[] = [
    {
      key: 'type',
      header: t('dashboard.common.table.type'),
      accessor: (review) => (
        <span className="capitalize text-sm font-medium text-gray-900">
          {review.type}
        </span>
      )
    },
    {
      key: 'title',
      header: t('dashboard.common.table.title'),
      accessor: (review) => (
        <div className="text-sm font-medium text-gray-900">{review.title}</div>
      )
    },
    {
      key: 'submitter',
      header: t('dashboard.common.table.submitter'),
      accessor: (review) => (
        <span className="text-sm text-gray-500">{review.submitter}</span>
      )
    },
    {
      key: 'priority',
      header: t('dashboard.common.table.priority'),
      accessor: (review) => (
        <DashboardStatusBadge
          status={review.priority}
          variant="priority"
          size="sm"
        />
      )
    },
    {
      key: 'submittedAt',
      header: t('dashboard.common.table.submitted'),
      accessor: (review) => (
        <span className="text-sm text-gray-500">
          {new Date(review.submittedAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('dashboard.common.table.actions'),
      accessor: (review) => (
        <div className="flex space-x-2">
          <button className="text-soe-green-600 hover:text-soe-green-900">
            {t('dashboard.common.actions.review')}
          </button>
          <button className="text-green-600 hover:text-green-900">
            {t('dashboard.common.actions.approve')}
          </button>
          <button className="text-red-600 hover:text-red-900">
            {t('dashboard.common.actions.reject')}
          </button>
        </div>
      )
    }
  ];

  return (
    <div data-role="admin" className="min-h-screen bg-gray-50">
      <DashboardHeader
        title={t('dashboard.admin.title')}
        subtitle={t('dashboard.admin.subtitle', { name: session?.user?.name })}
        actions={
          <>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('dashboard.admin.actions.analytics')}
            </button>
            <button className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('dashboard.admin.actions.settings')}
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardStatsCard
              title={t('dashboard.admin.stats.totalUsers')}
              value={systemStats.totalUsers.toLocaleString()}
              subValue={t('dashboard.admin.stats.activeUsers', { count: systemStats.activeUsers.toLocaleString() })}
              icon={Users}
              iconColor="text-soe-green-600"
            />
            <DashboardStatsCard
              title={t('dashboard.admin.stats.totalBooks')}
              value={systemStats.totalBooks.toLocaleString()}
              icon={BookOpen}
              iconColor="text-green-600"
            />
            <DashboardStatsCard
              title={t('dashboard.admin.stats.submissions')}
              value={systemStats.totalSubmissions.toLocaleString()}
              icon={FileText}
              iconColor="text-purple-600"
            />
            <DashboardStatsCard
              title={t('dashboard.admin.stats.systemHealth')}
              value={systemStats.systemHealth}
              subValue={t('dashboard.admin.stats.uptime', { uptime: systemStats.uptime })}
              icon={Server}
              iconColor={
                systemStats.systemHealth === 'healthy' ? 'text-green-600' :
                systemStats.systemHealth === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Users by Role */}
          <DashboardSection title={t('dashboard.admin.sections.usersByRole')} icon={Shield}>
            {usersByRole && (
              <div className="space-y-4">
                {Object.entries(usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {role.toLowerCase()}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          {/* System Alerts */}
          <DashboardSection title={t('dashboard.admin.sections.systemAlerts')}>
            {systemAlerts.length === 0 ? (
              <DashboardEmptyState
                icon={CheckCircle}
                iconColor="from-green-100 to-green-200"
                title={t('dashboard.admin.alerts.noActiveAlerts')}
                description={t('dashboard.admin.alerts.allSystemsNormal')}
              />
            ) : (
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${
                    alert.resolved ? 'opacity-50' : ''
                  }`}>
                    <div className="flex items-start gap-2">
                      <DashboardStatusBadge
                        status={alert.level}
                        variant="alert"
                        size="sm"
                      />
                      {alert.resolved && (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mt-2">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          {/* System Resources */}
          {systemStats && (
            <DashboardSection title={t('dashboard.admin.sections.systemResources')} icon={Server}>
              <div className="space-y-4">
                <DashboardProgressBar
                  label={t('dashboard.admin.resources.diskUsage')}
                  value={systemStats.diskUsage}
                  showPercentage
                  colorScheme="default"
                />
                <DashboardProgressBar
                  label={t('dashboard.admin.resources.memoryUsage')}
                  value={systemStats.memoryUsage}
                  showPercentage
                  colorScheme="default"
                />
                <div className="pt-4">
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('dashboard.admin.resources.viewMetrics')}
                  </button>
                </div>
              </div>
            </DashboardSection>
          )}
        </div>

        {/* Pending Reviews */}
        <DashboardSection
          title={t('dashboard.admin.sections.pendingReviews')}
          badge={
            <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded-full">
              {t('dashboard.admin.reviews.pendingCount', { count: pendingReviews.length })}
            </span>
          }
          noPadding
        >
          <DashboardTable
            columns={reviewColumns}
            data={pendingReviews}
            keyExtractor={(review) => review.id}
            emptyState={{
              icon: <CheckCircle className="h-12 w-12 text-green-300" />,
              title: t('dashboard.admin.reviews.noPendingReviews'),
              description: t('dashboard.admin.reviews.allUpToDate')
            }}
          />
        </DashboardSection>

        {/* Quick Actions */}
        <DashboardSection title={t('dashboard.admin.sections.quickActions')} className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/admin/users" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
              <Users className="h-6 w-6 text-soe-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{t('dashboard.admin.quickActions.userManagement.title')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.admin.quickActions.userManagement.description')}</p>
              </div>
            </Link>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{t('dashboard.admin.quickActions.contentModeration.title')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.admin.quickActions.contentModeration.description')}</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <Database className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{t('dashboard.admin.quickActions.databaseBackup.title')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.admin.quickActions.databaseBackup.description')}</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <Globe className="h-6 w-6 text-orange-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{t('dashboard.admin.quickActions.systemSettings.title')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.admin.quickActions.systemSettings.description')}</p>
              </div>
            </button>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}