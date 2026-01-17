'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Search,
  BookOpen,
  Award,
  TrendingUp,
  MoreVertical,
  Mail,
  UserMinus,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Student {
  id: string;
  status: string;
  enrolledAt: string;
  grade?: number;
  attendance?: number;
  progress?: number;
  student: {
    id: string;
    name: string;
    email: string;
    displayName: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  statistics: {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    pendingAssignments: number;
    averageGrade: number | null;
    completionRate: number;
  };
}

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
}

export default function ClassStudentsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const { data: session, status } = useSession();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'TEACHER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, studentsRes] = await Promise.all([
          fetch(`/api/classes/${classId}`),
          fetch(`/api/classes/${classId}/students`),
        ]);

        if (classRes.ok) {
          const classData = await classRes.json();
          setClassInfo(classData.class);
        } else {
          setError(t('dashboard.teacher.students.classNotFound'));
          return;
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (classId && session?.user?.role === 'TEACHER') {
      fetchData();
    }
  }, [classId, session, t]);

  const filteredStudents = students.filter(
    (enrollment) =>
      enrollment.student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm(t('dashboard.teacher.students.confirmRemove'))) return;

    try {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
      }
    } catch (err) {
      console.error('Failed to remove student:', err);
    }
    setShowMenu(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/teacher')}
            className="bg-soe-green-500 text-white px-4 py-2 rounded-lg"
          >
            {t('dashboard.common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/teacher')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {classInfo?.name || t('dashboard.teacher.students.title')}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {classInfo && (
                  <>
                    <span className="text-sm text-gray-500">
                      {t('dashboard.teacher.myClasses.classCode')}: <span className="font-mono font-semibold">{classInfo.code}</span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{classInfo.subject}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{classInfo.gradeLevel}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-soe-green-500" />
              <span className="text-2xl font-bold text-gray-900">{students.length}</span>
              <span className="text-gray-500">{t('dashboard.teacher.myClasses.students')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-soe-green-100 rounded-lg">
                <Users className="h-6 w-6 text-soe-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.teacher.students.totalStudents')}</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.teacher.students.avgAssignments')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0
                    ? (students.reduce((sum, s) => sum + s.statistics.submittedAssignments, 0) / students.length).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.teacher.students.avgGrade')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0 && students.some(s => s.statistics.averageGrade !== null)
                    ? Math.round(
                        students
                          .filter(s => s.statistics.averageGrade !== null)
                          .reduce((sum, s) => sum + (s.statistics.averageGrade || 0), 0) /
                        students.filter(s => s.statistics.averageGrade !== null).length
                      )
                    : '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.teacher.students.avgCompletion')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0
                    ? Math.round(students.reduce((sum, s) => sum + s.statistics.completionRate, 0) / students.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('dashboard.teacher.students.searchPlaceholder')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                />
              </div>
              {selectedStudents.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    {selectedStudents.length} {t('dashboard.teacher.students.selected')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('dashboard.teacher.students.noStudents')}</p>
              <p className="text-sm text-gray-400 mt-2">
                {t('dashboard.teacher.students.shareCode', { code: classInfo?.code || '' })}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-soe-green-500 focus:ring-soe-green-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {t('dashboard.teacher.students.student')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {t('dashboard.teacher.students.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {t('dashboard.teacher.students.assignments')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {t('dashboard.teacher.students.grade')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {t('dashboard.teacher.students.enrolledAt')}
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(enrollment.student.id)}
                          onChange={() => toggleSelectStudent(enrollment.student.id)}
                          className="rounded border-gray-300 text-soe-green-500 focus:ring-soe-green-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-soe-green-400 to-soe-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {enrollment.student.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{enrollment.student.displayName}</p>
                            <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          enrollment.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-700' :
                          enrollment.status === 'DROPPED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-soe-green-400 to-soe-green-500 h-2 rounded-full"
                              style={{ width: `${enrollment.statistics.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{enrollment.statistics.completionRate}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {enrollment.statistics.submittedAssignments}/{enrollment.statistics.totalAssignments} {t('dashboard.teacher.students.completed')}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.statistics.averageGrade !== null
                            ? `${Math.round(enrollment.statistics.averageGrade)}%`
                            : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 relative">
                        <button
                          onClick={() => setShowMenu(showMenu === enrollment.student.id ? null : enrollment.student.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                        {showMenu === enrollment.student.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => window.open(`mailto:${enrollment.student.email}`, '_blank')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              {t('dashboard.teacher.students.sendEmail')}
                            </button>
                            <button
                              onClick={() => handleRemoveStudent(enrollment.student.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <UserMinus className="h-4 w-4" />
                              {t('dashboard.teacher.students.removeStudent')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
