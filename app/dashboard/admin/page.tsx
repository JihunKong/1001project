'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  VOLUNTEER: number;
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
      // These APIs would need to be implemented
      // For now, using mock data since APIs don't exist yet
      setSystemStats({
        totalUsers: 15420,
        totalBooks: 2850,
        totalSubmissions: 1240,
        activeUsers: 8350,
        systemHealth: 'healthy',
        diskUsage: 68,
        memoryUsage: 45,
        uptime: '12 days, 8 hours'
      });

      setUsersByRole({
        LEARNER: 12500,
        TEACHER: 2100,
        VOLUNTEER: 650,
        INSTITUTION: 145,
        ADMIN: 25
      });

      setPendingReviews([
        {
          id: '1',
          type: 'submission',
          title: 'The Magic Garden - Children\'s Story',
          submitter: 'Maria Garcia',
          submittedAt: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: '2',
          type: 'user',
          title: 'New Institution Registration - Lincoln Elementary',
          submitter: 'James Wilson',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'medium'
        },
        {
          id: '3',
          type: 'report',
          title: 'Inappropriate Content Report',
          submitter: 'System',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent'
        }
      ]);

      setSystemAlerts([
        {
          id: '1',
          level: 'warning',
          message: 'Database backup took longer than usual (45 minutes)',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          level: 'info',
          message: 'New version 1.2.3 deployed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: true
        }
      ]);

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
    return <DashboardLoadingState role="admin" message="Loading admin dashboard..." />;
  }

  if (error) {
    return <DashboardErrorState role="admin" error={error} />;
  }

  const reviewColumns: Column<PendingReview>[] = [
    {
      key: 'type',
      header: 'Type',
      accessor: (review) => (
        <span className="capitalize text-sm font-medium text-gray-900">
          {review.type}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Title',
      accessor: (review) => (
        <div className="text-sm font-medium text-gray-900">{review.title}</div>
      )
    },
    {
      key: 'submitter',
      header: 'Submitter',
      accessor: (review) => (
        <span className="text-sm text-gray-500">{review.submitter}</span>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
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
      header: 'Submitted',
      accessor: (review) => (
        <span className="text-sm text-gray-500">
          {new Date(review.submittedAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (review) => (
        <div className="flex space-x-2">
          <button className="text-soe-green-600 hover:text-soe-green-900">
            Review
          </button>
          <button className="text-green-600 hover:text-green-900">
            Approve
          </button>
          <button className="text-red-600 hover:text-red-900">
            Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div data-role="admin" className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle={`System overview and management for ${session?.user?.name}`}
        actions={
          <>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </button>
            <button className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardStatsCard
              title="Total Users"
              value={systemStats.totalUsers.toLocaleString()}
              subValue={`${systemStats.activeUsers.toLocaleString()} active`}
              icon={Users}
              iconColor="text-soe-green-600"
            />
            <DashboardStatsCard
              title="Total Books"
              value={systemStats.totalBooks.toLocaleString()}
              icon={BookOpen}
              iconColor="text-green-600"
            />
            <DashboardStatsCard
              title="Submissions"
              value={systemStats.totalSubmissions.toLocaleString()}
              icon={FileText}
              iconColor="text-purple-600"
            />
            <DashboardStatsCard
              title="System Health"
              value={systemStats.systemHealth}
              subValue={`Uptime: ${systemStats.uptime}`}
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
          <DashboardSection title="Users by Role" icon={Shield}>
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
          <DashboardSection title="System Alerts">
            {systemAlerts.length === 0 ? (
              <DashboardEmptyState
                icon={CheckCircle}
                iconColor="from-green-100 to-green-200"
                title="No active alerts"
                description="All systems operating normally"
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
            <DashboardSection title="System Resources" icon={Server}>
              <div className="space-y-4">
                <DashboardProgressBar
                  label="Disk Usage"
                  value={systemStats.diskUsage}
                  showPercentage
                  colorScheme="default"
                />
                <DashboardProgressBar
                  label="Memory Usage"
                  value={systemStats.memoryUsage}
                  showPercentage
                  colorScheme="default"
                />
                <div className="pt-4">
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <Activity className="h-4 w-4" />
                    View Detailed Metrics
                  </button>
                </div>
              </div>
            </DashboardSection>
          )}
        </div>

        {/* Pending Reviews */}
        <DashboardSection
          title="Pending Reviews"
          badge={
            <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded-full">
              {pendingReviews.length} pending
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
              title: 'No pending reviews',
              description: 'All submissions and reports are up to date'
            }}
          />
        </DashboardSection>

        {/* Quick Actions */}
        <DashboardSection title="Quick Actions" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <Users className="h-6 w-6 text-soe-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Manage user accounts and roles</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Content Moderation</p>
                <p className="text-sm text-gray-500">Review and approve content</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <Database className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Database Backup</p>
                <p className="text-sm text-gray-500">Manage system backups</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3">
              <Globe className="h-6 w-6 text-orange-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">System Settings</p>
                <p className="text-sm text-gray-500">Configure platform settings</p>
              </div>
            </button>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}