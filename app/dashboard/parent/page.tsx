'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Shield,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Download,
  ChevronRight,
} from 'lucide-react';

interface ChildInfo {
  id: string;
  name: string;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    isMinor: boolean;
    parentalConsentStatus: string;
    parentalConsentDate?: string;
  };
}

interface ReadingRecord {
  id: string;
  book: {
    id: string;
    title: string;
    authorName: string;
    coverImage?: string;
  };
  percentComplete: number;
  totalReadingTime: number;
  lastReadAt: string;
  isCompleted: boolean;
}

interface QuizRecord {
  id: string;
  quiz: {
    id: string;
    title?: string;
    book: { title: string };
  };
  score: number;
  passed: boolean;
  completedAt: string;
}

interface ClassRecord {
  id: string;
  class: {
    id: string;
    name: string;
    subject: string;
    teacher: { name: string; email: string };
  };
  status: string;
  progress: number;
}

interface AccessLog {
  id: string;
  entityType: string;
  action: string;
  accessedByRole: string;
  purpose?: string;
  timestamp: string;
}

interface AmendmentRequest {
  id: string;
  recordType: string;
  status: string;
  createdAt: string;
  appealDeadline: string;
}

interface ChildData {
  child: ChildInfo;
  educationalRecords: {
    readingProgress: ReadingRecord[];
    quizAttempts: QuizRecord[];
    classEnrollments: ClassRecord[];
  };
  accessHistory: {
    recentAccesses: AccessLog[];
  };
}

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [amendmentRequests, setAmendmentRequests] = useState<AmendmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
  }, [session, status]);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
      fetchAmendmentRequests(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/parent/children');
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children || []);
        if (data.children?.length > 0) {
          setSelectedChild(data.children[0].id);
        }
      }
    } catch {
      setError('Failed to load children list');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/child-records?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setChildData(data);
      } else {
        setError('Failed to load child records');
      }
    } catch {
      setError('Failed to load child records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAmendmentRequests = async (childId: string) => {
    try {
      const res = await fetch(`/api/parent/amendment-request?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setAmendmentRequests(data.requests || []);
      }
    } catch {
      console.error('Failed to load amendment requests');
    }
  };

  const handleExportData = async () => {
    if (!selectedChild) return;
    try {
      const res = await fetch('/api/user/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedChild, format: 'json' }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Data export initiated. Export ID: ${data.exportId}`);
      }
    } catch {
      alert('Failed to initiate data export');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600 mt-2">
            View and manage your child&apos;s educational records (FERPA Rights)
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-blue-800 font-medium">Your FERPA Rights</h3>
              <p className="text-blue-700 text-sm mt-1">
                Under the Family Educational Rights and Privacy Act (FERPA), you
                have the right to inspect and review your child&apos;s education
                records, request amendments to inaccurate records, and consent to
                disclosures of personally identifiable information.
              </p>
            </div>
          </div>
        </div>

        {children.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <select
              value={selectedChild || ''}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {childData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {childData.child.name}&apos;s Profile
                </h2>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{childData.child.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Consent Status</p>
                  <p className="font-medium flex items-center gap-2">
                    {childData.child.profile.parentalConsentStatus === 'GRANTED' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Granted</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600">
                          {childData.child.profile.parentalConsentStatus}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Language</p>
                  <p className="font-medium">English</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Minor Status</p>
                  <p className="font-medium">
                    {childData.child.profile.isMinor ? 'Yes (Under 13)' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Reading Progress
                </h2>
              </div>
              {childData.educationalRecords.readingProgress.length === 0 ? (
                <p className="text-gray-500">No reading progress recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {childData.educationalRecords.readingProgress.map((progress) => (
                    <div
                      key={progress.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{progress.book.title}</p>
                          <p className="text-sm text-gray-500">
                            by {progress.book.authorName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${progress.percentComplete}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round(progress.percentComplete)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {progress.totalReadingTime} min reading time
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Quiz Attempts
                </h2>
              </div>
              {childData.educationalRecords.quizAttempts.length === 0 ? (
                <p className="text-gray-500">No quiz attempts recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                          Book
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                          Score
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {childData.educationalRecords.quizAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            {attempt.quiz.book.title}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {attempt.score}%
                          </td>
                          <td className="py-3 px-4">
                            {attempt.passed ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" /> Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-4 h-4" /> Not Passed
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Class Enrollments
                </h2>
              </div>
              {childData.educationalRecords.classEnrollments.length === 0 ? (
                <p className="text-gray-500">Not enrolled in any classes yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {childData.educationalRecords.classEnrollments.map(
                    (enrollment) => (
                      <div
                        key={enrollment.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <h3 className="font-medium">{enrollment.class.name}</h3>
                        <p className="text-sm text-gray-500">
                          {enrollment.class.subject}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Teacher: {enrollment.class.teacher.name}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              enrollment.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {enrollment.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            Progress: {Math.round(enrollment.progress)}%
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Record Access History
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                This shows who has accessed your child&apos;s educational records.
              </p>
              {childData.accessHistory.recentAccesses.length === 0 ? (
                <p className="text-gray-500">No access history recorded.</p>
              ) : (
                <div className="space-y-3">
                  {childData.accessHistory.recentAccesses.slice(0, 10).map(
                    (log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {log.accessedByRole} accessed {log.entityType}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.purpose || 'No purpose specified'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">{log.action}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Amendment Requests
                  </h2>
                </div>
                <a
                  href="/dashboard/parent/request-amendment"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Request Amendment <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Under FERPA, you can request amendments to records you believe are
                inaccurate.
              </p>
              {amendmentRequests.length === 0 ? (
                <p className="text-gray-500">No amendment requests submitted.</p>
              ) : (
                <div className="space-y-3">
                  {amendmentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {request.recordType} Amendment
                        </p>
                        <p className="text-xs text-gray-500">
                          Response due by:{' '}
                          {new Date(request.appealDeadline).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          request.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {children.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Children Linked
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              You don&apos;t have any children linked to your account yet. Contact
              your child&apos;s school administrator to link your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
