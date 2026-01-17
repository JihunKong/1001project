'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  Save,
  Trash2,
  Calendar,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  subject: string;
  gradeLevel: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  enrollmentCount: number;
}

export default function ClassSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const { data: session, status } = useSession();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    description: '',
    startDate: '',
    endDate: '',
  });

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
    const fetchClassInfo = async () => {
      try {
        const res = await fetch(`/api/classes/${classId}`);
        if (res.ok) {
          const data = await res.json();
          setClassInfo(data.class);
          setFormData({
            name: data.class.name || '',
            subject: data.class.subject || '',
            gradeLevel: data.class.gradeLevel || '',
            description: data.class.description || '',
            startDate: data.class.startDate ? new Date(data.class.startDate).toISOString().split('T')[0] : '',
            endDate: data.class.endDate ? new Date(data.class.endDate).toISOString().split('T')[0] : '',
          });
        } else {
          setError('Class not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (classId && session?.user?.role === 'TEACHER') {
      fetchClassInfo();
    }
  }, [classId, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setClassInfo(data.class);
        setSuccess('Class settings updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update class');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/teacher');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete class');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setShowDeleteConfirm(false);
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

  if (error && !classInfo) {
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

  const gradeLevelOptions = [
    'Pre-K', 'Kindergarten',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  ];

  const subjectOptions = [
    'Reading', 'English', 'Literature', 'Language Arts',
    'ESL/ELL', 'Social Studies', 'Science', 'Other',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/teacher')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-7 w-7 text-gray-600" />
                Class Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {classInfo?.name} - {classInfo?.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {error && classInfo && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-soe-green-100 rounded-lg">
                <Users className="h-6 w-6 text-soe-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Students Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{classInfo?.enrollmentCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Code</p>
                <p className="text-2xl font-bold font-mono text-gray-900">{classInfo?.code}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${classInfo?.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Calendar className={`h-6 w-6 ${classInfo?.isActive ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`text-lg font-bold ${classInfo?.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {classInfo?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Class Information</h2>
            <p className="text-sm text-gray-500 mt-1">Update your class details and settings</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level *
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                  required
                >
                  <option value="">Select Grade Level</option>
                  {gradeLevelOptions.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                placeholder="Optional class description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Class
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/teacher')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-soe-green-500 to-soe-green-600 hover:from-soe-green-600 hover:to-soe-green-700 text-white rounded-lg disabled:opacity-50 transition-all"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Class?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{classInfo?.name}&quot;? This action cannot be undone.
                All student enrollments and assignments associated with this class will also be removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Class
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
