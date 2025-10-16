'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Package,
  Layout,
  User,
  Calendar,
  Tag,
  MessageSquare,
  CheckCircle
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
  storyManager?: {
    id: string;
    name: string;
    email: string;
  };
  storyFeedback?: string;
  bookDecision?: string;
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

const formatOptions = [
  {
    value: 'TEXT',
    label: 'Standalone Text',
    description: 'Publish as an individual story in the text library',
    icon: FileText,
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  {
    value: 'BOOK',
    label: 'Book Format',
    description: 'Include in a themed book collection with other stories',
    icon: BookOpen,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    value: 'COLLECTION',
    label: 'Series Collection',
    description: 'Add to a multi-part series or anthology',
    icon: Package,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  }
];

export default function FormatDecisionPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<TextSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Redirect if not authenticated or not a book manager
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'BOOK_MANAGER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch submission details
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/text-submissions/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }
        const data = await response.json();
        setSubmission(data.submission);

        // Set current decision if exists
        if (data.submission.bookDecision) {
          setSelectedFormat(data.submission.bookDecision);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'BOOK_MANAGER' && params.id) {
      fetchSubmission();
    }
  }, [session, params.id]);

  const handleDecision = async () => {
    if (!submission || !selectedFormat) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'format_decision',
          decision: selectedFormat,
          notes: notes.trim() || undefined,
          comment: `Book Manager decision: ${selectedFormat} format. ${notes.trim() || ''}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit decision');
      }

      const data = await response.json();
      setSubmission(data.submission);

      toast.success('Format decision submitted successfully!');

      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/book-manager');
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
      case 'CONTENT_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'STORY_APPROVED': return 'bg-yellow-100 text-yellow-800';
      case 'FORMAT_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            href="/dashboard/book-manager"
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
                href="/dashboard/book-manager"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Format Decision</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the publication format for this approved story
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                {submission.status.replace('_', ' ')}
              </span>
              {submission.bookDecision && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {submission.bookDecision} Format
                </span>
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

              {/* Story Content Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Content</h3>
                <div
                  className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: submission.content }}
                />
              </div>
            </div>

            {/* Format Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Layout className="h-5 w-5 mr-2" />
                Publication Format Decision
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedFormat === option.value
                          ? option.color
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFormat(option.value)}
                    >
                      <div className="flex items-center mb-2">
                        <Icon className={`h-6 w-6 mr-2 ${
                          selectedFormat === option.value
                            ? option.color.split(' ')[0]
                            : 'text-gray-400'
                        }`} />
                        <h4 className="font-semibold">{option.label}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Additional Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this format decision..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard/book-manager"
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleDecision}
                  disabled={!selectedFormat || submitting}
                  className="px-6 py-2 bg-soe-green-400 text-white rounded-lg hover:bg-soe-green-500 disabled:opacity-50 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </div>

            {/* Previous Feedback */}
            {submission.storyFeedback && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Story Manager Feedback
                </h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
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
                {submission.targetAudience && (
                  <div>
                    <span className="text-sm text-gray-500">Target Audience:</span>
                    <p className="font-medium">{submission.targetAudience}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Information */}
            {submission.storyManager && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Approval</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Approved By:</span>
                    <p className="font-medium">{submission.storyManager.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="font-medium">{submission.storyManager.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Approved On:</span>
                    <p className="font-medium">{new Date(submission.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

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
    </div>
  );
}