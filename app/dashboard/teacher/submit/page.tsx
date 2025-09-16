'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import TextSubmissionForm from '@/components/teacher/TextSubmissionForm';

interface Submission {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  studentName?: string;
  latestFeedback?: {
    id: string;
    customMessage: string;
    createdAt: string;
    reviewer: {
      name: string;
      role: string;
    };
  } | null;
  canEdit: boolean;
}

export default function TeacherSubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'TEACHER') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubmissions();
    }
  }, [status]);

  const fetchSubmissions = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await fetch('/api/teacher/submit-story');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmissions(result.submissions);
      } else {
        throw new Error(result.error || 'Failed to fetch submissions');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmissionSuccess = (submissionId: string) => {
    // Refresh submissions list after successful submission
    fetchSubmissions();
  };

  const handleGoBack = () => {
    router.push('/dashboard/teacher');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100';
      case 'SUBMITTED':
        return 'text-blue-600 bg-blue-100';
      case 'IN_REVIEW':
        return 'text-yellow-600 bg-yellow-100';
      case 'EDITING':
        return 'text-orange-600 bg-orange-100';
      case 'APPROVED':
        return 'text-green-600 bg-green-100';
      case 'PUBLISHED':
        return 'text-green-700 bg-green-200';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />;
      case 'SUBMITTED':
      case 'IN_REVIEW':
        return <Clock className="w-4 h-4" />;
      case 'APPROVED':
      case 'PUBLISHED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      case 'EDITING':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'TEACHER') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Story</h1>
              <p className="text-gray-600">Submit stories on behalf of your class</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Submission Form */}
          <div className="lg:col-span-2">
            <TextSubmissionForm
              onSuccess={handleSubmissionSuccess}
              onCancel={handleGoBack}
            />
          </div>

          {/* Sidebar - Existing Submissions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Submissions</h2>
                <button
                  onClick={fetchSubmissions}
                  disabled={refreshing}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {submissions.length > 0 ? (
                  submissions.slice(0, 10).map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {submission.title}
                          </h3>
                          {submission.studentName && (
                            <p className="text-xs text-gray-500">
                              Student: {submission.studentName}
                            </p>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {getStatusIcon(submission.status)}
                          {submission.status}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{submission.wordCount} words</span>
                        <span>
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {submission.latestFeedback && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <p className="font-medium text-gray-700 mb-1">
                            Latest feedback from {submission.latestFeedback.reviewer.name}:
                          </p>
                          <p className="text-gray-600 line-clamp-2">
                            {submission.latestFeedback.customMessage}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {submission.canEdit && (
                            <span className="text-xs text-blue-600 font-medium">
                              Can edit
                            </span>
                          )}
                        </div>
                        <button
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                          onClick={() => {
                            // TODO: Navigate to submission detail view
                            console.log('View submission:', submission.id);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No submissions yet</p>
                    <p className="text-xs">Your submitted stories will appear here</p>
                  </div>
                )}
              </div>

              {submissions.length > 10 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/dashboard/teacher/submissions"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all {submissions.length} submissions
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}