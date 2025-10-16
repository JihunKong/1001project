'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit,
  User,
  Calendar,
  FileText,
  MessageSquare,
  BookOpen,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TextSubmission {
  id: string;
  title: string;
  authorAlias: string;
  status: string;
  language: string;
  ageRange?: string;
  categories: string[];
  tags: string[];
  summary?: string;
  content: string;
  wordCount?: number;
  visibility: string;
  targetAudience?: string;
  licenseType?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  storyFeedback?: string;
  workflowHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    comment?: string;
    createdAt: string;
    performedBy: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function StoryReviewPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<TextSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState<'approve' | 'revision' | 'reject' | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Redirect if not authenticated or not a story manager
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'STORY_MANAGER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch submission details
  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }
      const data = await response.json();
      setSubmission(data.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'STORY_MANAGER' && params.id) {
      fetchSubmission();
    }
  }, [session, params.id]);

  const handleAction = async (actionType: 'approve' | 'revision' | 'reject') => {
    if (!submission) return;

    setSubmitting(true);
    try {
      const actionMap = {
        approve: 'story_approve',
        revision: 'story_needs_revision',
        reject: 'reject'
      };

      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionMap[actionType],
          feedback: feedback.trim() || undefined,
          comment: `Story Manager ${actionType}: ${feedback.trim() || 'No additional comments'}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process action');
      }

      const data = await response.json();
      setSubmission(data.submission);
      setShowFeedbackForm(false);
      setFeedback('');
      setAction(null);

      toast.success(
        actionType === 'approve'
          ? 'Story approved successfully!'
          : actionType === 'revision'
          ? 'Revision requested successfully!'
          : 'Story rejected successfully!'
      );

      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/story-manager');
      }, 2000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'STORY_APPROVED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'STORY_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canTakeAction = (status: string) => {
    return ['PENDING', 'STORY_REVIEW', 'NEEDS_REVISION'].includes(status);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Submission not found'}</p>
          <Link
            href="/dashboard/story-manager"
            className="mt-4 inline-block px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard/story-manager"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Story Review</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review and provide feedback on story submission
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                {submission.status.replace('_', ' ')}
              </span>
              {canTakeAction(submission.status) && (
                <>
                  <button
                    onClick={() => {
                      setAction('approve');
                      setShowFeedbackForm(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setAction('revision');
                      setShowFeedbackForm(true);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Request Revision
                  </button>
                  <button
                    onClick={() => {
                      setAction('reject');
                      setShowFeedbackForm(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{submission.title}</h2>
                <p className="text-gray-600 mt-2">by {submission.authorAlias}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {submission.wordCount} words
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {submission.language}
                  </div>
                  {submission.ageRange && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Ages {submission.ageRange}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Categories and Tags */}
                {(submission.categories.length > 0 || submission.tags.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {submission.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">Categories:</span>
                        {submission.categories.map((category, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                    {submission.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">Tags:</span>
                        {submission.tags.map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              {submission.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{submission.summary}</p>
                </div>
              )}

              {/* Story Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Content</h3>
                <div
                  className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: submission.content }}
                />
              </div>
            </div>

            {/* Previous Feedback */}
            {submission.storyFeedback && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Previous Feedback
                </h3>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <p className="text-gray-700">{submission.storyFeedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Author Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Author Alias:</span>
                  <p className="font-medium">{submission.authorAlias}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Real Name:</span>
                  <p className="font-medium">{submission.author.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{submission.author.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Visibility:</span>
                  <p className="font-medium">{submission.visibility}</p>
                </div>
                {submission.targetAudience && (
                  <div>
                    <span className="text-sm text-gray-500">Target Audience:</span>
                    <p className="font-medium">{submission.targetAudience}</p>
                  </div>
                )}
                {submission.licenseType && (
                  <div>
                    <span className="text-sm text-gray-500">License:</span>
                    <p className="font-medium">{submission.licenseType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review History</h3>
              <div className="space-y-3">
                {submission.workflowHistory.length > 0 ? (
                  submission.workflowHistory.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {entry.fromStatus} → {entry.toStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{entry.performedBy.name}</p>
                      {entry.comment && (
                        <p className="text-sm text-gray-700 mt-1">{entry.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'approve' && 'Approve Story'}
              {action === 'revision' && 'Request Revision'}
              {action === 'reject' && 'Reject Story'}
            </h3>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                action === 'approve'
                  ? 'Optional: Add any final comments...'
                  : action === 'revision'
                  ? 'Explain what needs to be revised...'
                  : 'Explain why this story is being rejected...'
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              required={action !== 'approve'}
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedbackForm(false);
                  setAction(null);
                  setFeedback('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(action)}
                disabled={submitting || (action !== 'approve' && !feedback.trim())}
                className={`px-4 py-2 text-white rounded-lg ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : action === 'revision'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : action === 'revision' ? 'Revision Request' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}