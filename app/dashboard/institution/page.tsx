'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Users,
  BookOpen,
  TrendingUp,
  GraduationCap,
  Building2,
  Calendar,
  Award,
  BarChart3,
  Settings,
  UserPlus,
  Mail
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  classCount: number;
  studentCount: number;
  totalReadingHours: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

interface Department {
  id: string;
  name: string;
  teacherCount: number;
  studentCount: number;
  activeClasses: number;
  averageProgress: number;
}

interface Analytics {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalBooks: number;
  monthlyReadingHours: number;
  completionRate: number;
  engagementScore: number;
  topPerformingDepartment: string;
}

interface RecentActivity {
  id: string;
  type: 'new_teacher' | 'new_class' | 'assignment_completed' | 'book_published';
  message: string;
  timestamp: string;
  user: string;
}

export default function InstitutionDashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not an institution
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'INSTITUTION') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      // These APIs would need to be implemented
      // For now, using mock data since APIs don't exist yet
      setTeachers([
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@school.edu',
          department: 'English Department',
          classCount: 3,
          studentCount: 78,
          totalReadingHours: 420,
          lastActive: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          name: 'Mike Chen',
          email: 'mike.chen@school.edu',
          department: 'Elementary',
          classCount: 2,
          studentCount: 52,
          totalReadingHours: 340,
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ]);

      setDepartments([
        {
          id: '1',
          name: 'English Department',
          teacherCount: 8,
          studentCount: 240,
          activeClasses: 12,
          averageProgress: 85
        },
        {
          id: '2',
          name: 'Elementary',
          teacherCount: 12,
          studentCount: 360,
          activeClasses: 18,
          averageProgress: 78
        }
      ]);

      setAnalytics({
        totalTeachers: 24,
        totalStudents: 720,
        totalClasses: 36,
        totalBooks: 150,
        monthlyReadingHours: 8400,
        completionRate: 82,
        engagementScore: 89,
        topPerformingDepartment: 'English Department'
      });

      setRecentActivity([
        {
          id: '1',
          type: 'new_teacher',
          message: 'New teacher Lisa Brown joined Elementary Department',
          timestamp: new Date().toISOString(),
          user: 'System'
        },
        {
          id: '2',
          type: 'assignment_completed',
          message: '15 students completed "The Adventure Begins" assignment',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'Sarah Johnson'
        }
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'INSTITUTION') {
      fetchData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div data-role="institution" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.institution.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-role="institution" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('dashboard.institution.error.message', { error })}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            {t('dashboard.institution.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_teacher': return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'new_class': return <Calendar className="h-4 w-4 text-soe-green-600" />;
      case 'assignment_completed': return <BookOpen className="h-4 w-4 text-purple-600" />;
      case 'book_published': return <Award className="h-4 w-4 text-yellow-600" />;
      default: return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.institution.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('dashboard.institution.welcome', { name: session?.user?.name })}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t('dashboard.institution.actions.inviteTeacher')}
              </button>
              <button className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('dashboard.institution.actions.viewReports')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-soe-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.institution.stats.totalTeachers')}</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTeachers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.institution.stats.totalStudents')}</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.institution.stats.activeClasses')}</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalClasses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.institution.stats.completionRate')}</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Departments Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('dashboard.institution.departments.title')}</h2>
            </div>
            <div className="p-6">
              {departments.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('dashboard.institution.departments.empty')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{dept.name}</h3>
                        <span className="text-sm text-gray-500">{t('dashboard.institution.departments.avgProgress', { progress: dept.averageProgress })}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{t('dashboard.institution.departments.labels.teachers')}</p>
                          <p className="font-medium text-gray-900">{dept.teacherCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('dashboard.institution.departments.labels.students')}</p>
                          <p className="font-medium text-gray-900">{dept.studentCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('dashboard.institution.departments.labels.classes')}</p>
                          <p className="font-medium text-gray-900">{dept.activeClasses}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-soe-green-400 h-2 rounded-full"
                            style={{ width: `${dept.averageProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('dashboard.institution.recentActivity.title')}</h2>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('dashboard.institution.recentActivity.empty')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()} • {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teachers Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{t('dashboard.institution.teachers.title')}</h2>
              <button className="text-soe-green-600 hover:text-soe-green-800 text-sm font-medium">
                {t('dashboard.institution.actions.viewAll')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.teacher')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.department')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.classes')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.students')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.readingHours')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.institution.teachers.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <GraduationCap className="h-12 w-12 text-gray-300 mb-4" />
                        <p>{t('dashboard.institution.teachers.empty')}</p>
                        <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          {t('dashboard.institution.teachers.inviteFirst')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">{teacher.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.classCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.studentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.totalReadingHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          teacher.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {teacher.status === 'active' ? t('dashboard.institution.teachers.status.active') : t('dashboard.institution.teachers.status.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-soe-green-600 hover:text-soe-green-900">
                            {t('dashboard.institution.teachers.table.view')}
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Mail className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}