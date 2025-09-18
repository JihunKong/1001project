'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText,
  AlertTriangle,
  Loader2,
  Settings,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import TextReviewPanel from '../../../../../components/review/TextReviewPanel';
import ReviewActions from '../../../../../components/review/ReviewActions';

interface TextSubmissionDetail {
  id: string;
  title: string;
  contentMd: string;
  chaptersJson?: string;
  summary?: string;
  authorId: string;
  authorRole: string;
  source?: string;
  classId?: string;
  status: string;
  revisionNo: number;
  language: string;
  ageRange?: string;
  category: string[];
  tags: string[];
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    name: string;
    teacher: {
      name: string;
    };
  };
  workflowTransitions?: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    comment?: string;
    createdAt: string;
    performedBy: {
      name: string;
    };
  }>;
}

export default function TextSubmissionFormatPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const submissionId = params.id as string;
  
  const [submission, setSubmission] = useState<TextSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);

  // Redirect if not authorized
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== UserRole.BOOK_MANAGER) {
    redirect('/dashboard');
  }

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionDetail();
    }
  }, [submissionId]);

  const fetchSubmissionDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/book-manager/text-submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmission(data.submission);
      }
    } catch (error) {
      console.error('Error fetching submission detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: 'approve' | 'reject' | 'request_revision', feedback?: string, metadata?: any) => {
    try {
      setProcessingAction(true);
      const response = await fetch(`/api/book-manager/text-submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          feedback,
          metadata,
        }),
      });

      if (response.ok) {
        await fetchSubmissionDetail(); // Refresh to show updated status
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Review action failed');
      }
    } catch (error) {
      console.error('Error performing review action:', error);
      throw error;
    } finally {
      setProcessingAction(false);
    }
  };

  const handleFeedbackAdd = async (feedback: string, line?: number) => {
    try {
      const response = await fetch(`/api/book-manager/text-submissions/${submissionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback,
          line,
        }),
      });

      if (response.ok) {
        await fetchSubmissionDetail(); // Refresh to show new feedback
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'NEEDS_REVISION': return 'bg-red-100 text-red-800';
      case 'PUBLISHED': return 'bg-emerald-100 text-emerald-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Submission Not Found</h2>
          <p className="text-gray-600 mb-4">The submission you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard/book-manager" className="text-indigo-600 hover:text-indigo-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/book-manager"
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600">by {submission.author.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{new Date(submission.createdAt).toLocaleDateString()}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">Revision #{submission.revisionNo}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-medium text-indigo-900">Format Decision</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Review Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TextReviewPanel
                submission={submission}
                onFeedbackAdd={handleFeedbackAdd}
                showLineNumbers={true}
                readOnly={false}
              />
            </motion.div>

            {/* Format Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Publication Format Recommendations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Book Format</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Enhanced with AI-generated images, professional layout, and multimedia features.
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• AI-generated illustrations</li>
                    <li>• Text-to-speech audio</li>
                    <li>• Interactive features</li>
                    <li>• Professional formatting</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-medium text-indigo-900">Text-Only Format</h4>
                  </div>
                  <p className="text-sm text-indigo-700 mb-3">
                    Clean text format optimized for ESL learning with interactive word explanations.
                  </p>
                  <ul className="text-xs text-indigo-600 space-y-1">
                    <li>• Word-by-word definitions</li>
                    <li>• Difficulty adaptation</li>
                    <li>• Reading comprehension tools</li>
                    <li>• Faster publication</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Workflow History */}
            {submission.workflowTransitions && submission.workflowTransitions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Review History</h2>
                <div className="space-y-4">
                  {submission.workflowTransitions.map((transition, idx) => (
                    <div key={transition.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {transition.fromStatus ? `${transition.fromStatus} → ` : ''}{transition.toStatus}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(transition.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">by {transition.performedBy.name}</p>
                      {transition.comment && (
                        <p className="text-sm text-gray-700 mt-2">{transition.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Review Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ReviewActions
                submissionId={submission.id}
                currentStatus={submission.status}
                userRole={session?.user.role || UserRole.LEARNER}
                onAction={handleReviewAction}
                disabled={processingAction}
              />
            </motion.div>

            {/* Submission Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Author:</span>
                  <p className="text-gray-600">{submission.author.name}</p>
                  <p className="text-gray-500">{submission.author.email}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <p className="text-gray-600">{submission.authorRole}</p>
                </div>

                {submission.class && (
                  <div>
                    <span className="font-medium text-gray-700">Class:</span>
                    <p className="text-gray-600">{submission.class.name}</p>
                    <p className="text-gray-500">Teacher: {submission.class.teacher.name}</p>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Language:</span>
                  <p className="text-gray-600">{submission.language}</p>
                </div>

                {submission.ageRange && (
                  <div>
                    <span className="font-medium text-gray-700">Age Range:</span>
                    <p className="text-gray-600">{submission.ageRange}</p>
                  </div>
                )}

                {submission.category.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Categories:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {submission.category.map((cat, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {submission.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {submission.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <p className="text-gray-600">{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-600">{new Date(submission.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            {/* Processing Status */}
            {processingAction && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">Processing format decision...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}