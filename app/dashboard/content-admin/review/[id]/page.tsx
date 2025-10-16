'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  XCircle,
  Shield,
  User,
  Calendar,
  FileText,
  BookOpen,
  Package,
  MessageSquare,
  Star,
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
  bookDecision?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  storyManager?: {
    id: string;
    name: string;
    email: string;
  };
  bookManager?: {
    id: string;
    name: string;
    email: string;
  };
  storyFeedback?: string;
  finalNotes?: string;
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

export default function ContentAdminReviewPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<TextSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [showActionForm, setShowActionForm] = useState(false);

  // Redirect if not authenticated or not a content admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'CONTENT_ADMIN') {
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

      // Set existing notes if any
      if (data.submission.finalNotes) {
        setNotes(data.submission.finalNotes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'CONTENT_ADMIN' && params.id) {
      fetchSubmission();
    }
  }, [session, params.id]);

  const handleFinalAction = async (actionType: 'approve' | 'reject') => {
    if (!submission) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType === 'approve' ? 'final_approve' : 'reject',
          notes: notes.trim() || undefined,
          comment: `Content Admin ${actionType}: ${notes.trim() || 'Final review completed'}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process final action');
      }

      const data = await response.json();
      setSubmission(data.submission);
      setShowActionForm(false);
      setAction(null);

      toast.success(
        actionType === 'approve'
          ? 'Story published successfully!'
          : 'Story rejected successfully!'
      );

      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/content-admin');
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
      case 'CONTENT_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (decision: string) => {
    switch (decision) {
      case 'BOOK': return <BookOpen className="h-5 w-5 text-soe-green-600" />;
      case 'TEXT': return <FileText className="h-5 w-5 text-green-600" />;
      case 'COLLECTION': return <Package className="h-5 w-5 text-purple-600" />;
      default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const canTakeAction = (status: string) => {
    return status === 'CONTENT_REVIEW';
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
            href="/dashboard/content-admin"
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
                href="/dashboard/content-admin"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Final Content Review</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Final approval and publication decision
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                {submission.status.replace('_', ' ')}
              </span>
              {submission.bookDecision && (
                <div className="flex items-center px-3 py-1 bg-soe-green-50 rounded-full">
                  {getFormatIcon(submission.bookDecision)}
                  <span className="ml-2 text-sm font-semibold text-soe-green-800">
                    {submission.bookDecision} Format
                  </span>
                </div>
              )}
              {canTakeAction(submission.status) && (
                <>
                  <button
                    onClick={() => {
                      setAction('approve');
                      setShowActionForm(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Publish
                  </button>
                  <button
                    onClick={() => {
                      setAction('reject');
                      setShowActionForm(true);
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
                  {submission.publishedAt && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      Published {new Date(submission.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Categories and Tags */}
                {(submission.categories.length > 0 || submission.tags.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {submission.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">Categories:</span>
                        {submission.categories.map((category, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-soe-green-100 text-soe-green-800 rounded">
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
                  Story Manager Feedback
                </h3>
                <div className="bg-soe-green-50 border border-soe-green-200 p-4 rounded-lg">
                  <p className="text-gray-700">{submission.storyFeedback}</p>
                </div>
              </div>
            )}

            {/* Final Notes */}
            {submission.finalNotes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Content Admin Notes
                </h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-gray-700">{submission.finalNotes}</p>
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

            {/* Review Team */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Team</h3>
              <div className="space-y-4">
                {submission.storyManager && (
                  <div>
                    <span className="text-sm text-gray-500">Story Manager:</span>
                    <p className="font-medium">{submission.storyManager.name}</p>
                    <p className="text-sm text-gray-500">{submission.storyManager.email}</p>
                  </div>
                )}
                {submission.bookManager && (
                  <div>
                    <span className="text-sm text-gray-500">Book Manager:</span>
                    <p className="font-medium">{submission.bookManager.name}</p>
                    <p className="text-sm text-gray-500">{submission.bookManager.email}</p>
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

      {/* Action Modal */}
      {showActionForm && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'approve' && 'Publish Story'}
              {action === 'reject' && 'Reject Story'}
            </h3>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                action === 'approve'
                  ? 'Optional: Add publication notes...'
                  : 'Explain why this story is being rejected...'
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              required={action === 'reject'}
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowActionForm(false);
                  setAction(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleFinalAction(action)}
                disabled={submitting || (action === 'reject' && !notes.trim())}
                className={`px-4 py-2 text-white rounded-lg ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting ? 'Processing...' : `Confirm ${action === 'approve' ? 'Publication' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}