'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Globe, 
  Tag, 
  Calendar,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface SubmissionDetail {
  id: string;
  title: string;
  authorName: string;
  authorAge?: number;
  authorLocation?: string;
  summary: string;
  language: string;
  ageRange?: string;
  categories: string[];
  tags: string[];
  format: string;
  filePath: string;
  coverImagePath?: string;
  pageCount?: number;
  wordCount?: number;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  currentReviewer?: {
    id: string;
    name: string;
  };
  feedback: Array<{
    id: string;
    message: string;
    type: 'SUGGESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION';
    createdAt: string;
    reviewer: {
      name: string;
    };
  }>;
  aiAnalysis?: {
    readingLevel: string;
    themes: string[];
    suggestedCategories: string[];
    contentWarnings: string[];
  };
}

export default function SubmissionReviewPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const submissionId = params.id as string;
  
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'SUGGESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION'>('SUGGESTION');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(false);

  // Redirect if not authorized
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== UserRole.STORY_MANAGER) {
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
      const response = await fetch(`/api/story-manager/submissions/${submissionId}`);
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

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) return;

    try {
      setSubmittingFeedback(true);
      const response = await fetch(`/api/story-manager/submissions/${submissionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedbackMessage,
          type: feedbackType,
        }),
      });

      if (response.ok) {
        setFeedbackMessage('');
        await fetchSubmissionDetail(); // Refresh to show new feedback
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const updateSubmissionStatus = async (newStatus: string, additionalData?: any) => {
    try {
      setProcessingStatus(true);
      const response = await fetch(`/api/story-manager/submissions/${submissionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      });

      if (response.ok) {
        await fetchSubmissionDetail(); // Refresh to show updated status
      }
    } catch (error) {
      console.error('Error updating submission status:', error);
    } finally {
      setProcessingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED': return 'bg-blue-100 text-blue-800';
      case 'PENDING_COORDINATOR': return 'bg-purple-100 text-purple-800';
      case 'APPROVED_COORDINATOR': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'SUGGESTION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONCERN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVAL': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTION': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
          <Link href="/dashboard/story-manager" className="text-orange-600 hover:text-orange-700">
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
                href="/dashboard/story-manager"
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Submissions
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600">by {submission.authorName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{new Date(submission.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Story Content</h2>
              
              {/* File Preview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{submission.title}.{submission.format}</p>
                      <p className="text-sm text-gray-600">
                        {submission.wordCount && `${submission.wordCount} words`}
                        {submission.pageCount && ` • ${submission.pageCount} pages`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-700">{submission.summary}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Author Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{submission.authorName}</span>
                      {submission.authorAge && <span className="text-gray-600">({submission.authorAge} years old)</span>}
                    </div>
                    {submission.authorLocation && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span>{submission.authorLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Content Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>Language: {submission.language}</div>
                    {submission.ageRange && <div>Age Range: {submission.ageRange}</div>}
                    <div>Format: {submission.format.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              {/* Categories and Tags */}
              {(submission.categories.length > 0 || submission.tags.length > 0) && (
                <div className="mb-6">
                  {submission.categories.length > 0 && (
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900 mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {submission.categories.map((category, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {submission.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {submission.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Analysis */}
              {submission.aiAnalysis && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-3">AI Content Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-purple-800">Reading Level</p>
                      <p className="text-purple-700">{submission.aiAnalysis.readingLevel}</p>
                    </div>
                    {submission.aiAnalysis.themes.length > 0 && (
                      <div>
                        <p className="font-medium text-purple-800">Detected Themes</p>
                        <p className="text-purple-700">{submission.aiAnalysis.themes.join(', ')}</p>
                      </div>
                    )}
                    {submission.aiAnalysis.suggestedCategories.length > 0 && (
                      <div>
                        <p className="font-medium text-purple-800">Suggested Categories</p>
                        <p className="text-purple-700">{submission.aiAnalysis.suggestedCategories.join(', ')}</p>
                      </div>
                    )}
                    {submission.aiAnalysis.contentWarnings.length > 0 && (
                      <div>
                        <p className="font-medium text-red-800">Content Warnings</p>
                        <p className="text-red-700">{submission.aiAnalysis.contentWarnings.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Feedback History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback History</h2>
              
              {submission.feedback.length === 0 ? (
                <p className="text-gray-600">No feedback yet.</p>
              ) : (
                <div className="space-y-4">
                  {submission.feedback.map((feedback) => (
                    <div key={feedback.id} className={`border rounded-lg p-4 ${getFeedbackTypeColor(feedback.type)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feedback.reviewer.name}</span>
                          <span className="text-xs px-2 py-1 bg-white rounded">
                            {feedback.type}
                          </span>
                        </div>
                        <span className="text-sm">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p>{feedback.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Add Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Feedback</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value as any)}
                  >
                    <option value="SUGGESTION">Suggestion</option>
                    <option value="CONCERN">Concern</option>
                    <option value="APPROVAL">Approval</option>
                    <option value="REJECTION">Rejection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                    placeholder="Provide detailed feedback about the submission..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                  />
                </div>

                <button
                  onClick={submitFeedback}
                  disabled={!feedbackMessage.trim() || submittingFeedback}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingFeedback ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {submission.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => updateSubmissionStatus('REVIEWED')}
                      disabled={processingStatus}
                      className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve for Next Stage
                    </button>
                    
                    <button
                      onClick={() => updateSubmissionStatus('REJECTED')}
                      disabled={processingStatus}
                      className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Submission
                    </button>
                  </>
                )}

                <button
                  onClick={() => updateSubmissionStatus('PENDING_REVIEW')}
                  disabled={processingStatus}
                  className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Mark as Pending Review
                </button>
              </div>
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
                  <span className="font-medium text-gray-700">Submitted by:</span>
                  <p className="text-gray-600">{submission.submittedBy.name}</p>
                  <p className="text-gray-500">{submission.submittedBy.email}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Submission Date:</span>
                  <p className="text-gray-600">{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-600">{new Date(submission.updatedAt).toLocaleString()}</p>
                </div>

                {submission.currentReviewer && (
                  <div>
                    <span className="font-medium text-gray-700">Current Reviewer:</span>
                    <p className="text-gray-600">{submission.currentReviewer.name}</p>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getPriorityColor(submission.priority)}`}>
                    {submission.priority}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Workflow Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h3>
              
              <div className="space-y-3">
                {[
                  { key: 'PENDING_REVIEW', label: 'Story Review', current: submission.status === 'PENDING_REVIEW' },
                  { key: 'REVIEWED', label: 'Reviewed', current: submission.status === 'REVIEWED' },
                  { key: 'PENDING_COORDINATOR', label: 'Book Manager Review', current: submission.status === 'PENDING_COORDINATOR' },
                  { key: 'APPROVED_COORDINATOR', label: 'Content Admin Review', current: submission.status === 'APPROVED_COORDINATOR' },
                  { key: 'PUBLISHED', label: 'Published', current: submission.status === 'PUBLISHED' },
                ].map((step, index) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      step.current ? 'bg-orange-600' : 
                      index < ['PENDING_REVIEW', 'REVIEWED', 'PENDING_COORDINATOR', 'APPROVED_COORDINATOR', 'PUBLISHED'].indexOf(submission.status) 
                        ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                    <span className={`text-sm ${step.current ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'HIGH': return 'bg-red-100 text-red-800';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
    case 'LOW': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}