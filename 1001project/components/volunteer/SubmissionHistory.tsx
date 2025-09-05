'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Globe
} from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  status: string;
  type: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
  rejectionReason?: string;
  publishDate?: string;
  reviewer?: {
    name: string;
  };
}

interface SubmissionHistoryProps {
  onViewDetails?: (submissionId: string) => void;
}

export default function SubmissionHistory({ onViewDetails }: SubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/volunteer/submit-pdf');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'IN_REVIEW':
        return <Eye className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PUBLISHED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'NEEDS_CHANGES':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'NEEDS_CHANGES':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Submitted';
      case 'IN_REVIEW':
        return 'In Review';
      case 'APPROVED':
        return 'Approved';
      case 'PUBLISHED':
        return 'Published';
      case 'REJECTED':
        return 'Rejected';
      case 'NEEDS_CHANGES':
        return 'Needs Changes';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Submissions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSubmissions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
        <p className="text-gray-600">
          You haven't submitted any PDFs yet. Upload your first story to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Your Submissions</h2>
        <p className="text-sm text-gray-600 mt-1">
          Track the status of your submitted stories
        </p>
      </div>

      <div className="divide-y">
        {submissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => setSelectedSubmission(submission)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(submission.status)}
                  <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {formatStatus(submission.status)}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted {formatDate(submission.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>{submission.language.toUpperCase()}</span>
                  </div>

                  {submission.reviewer && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Reviewed by {submission.reviewer.name}</span>
                    </div>
                  )}
                </div>

                {/* Show review notes or rejection reason if available */}
                {submission.reviewNotes && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Review Notes:</p>
                        <p className="text-sm text-blue-800">{submission.reviewNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {submission.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{submission.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {submission.publishDate && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Published on {formatDate(submission.publishDate)}
                        </p>
                        <p className="text-sm text-green-800">
                          Your story is now available to readers worldwide!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-4">
                {onViewDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(submission.id);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{selectedSubmission.title}</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedSubmission.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSubmission.status)}`}>
                    {formatStatus(selectedSubmission.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <p className="text-gray-600">{formatDate(selectedSubmission.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-600">{formatDate(selectedSubmission.updatedAt)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="text-gray-600">{selectedSubmission.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Language:</span>
                  <p className="text-gray-600">{selectedSubmission.language.toUpperCase()}</p>
                </div>
              </div>

              {selectedSubmission.reviewer && (
                <div>
                  <span className="font-medium text-gray-700">Reviewer:</span>
                  <p className="text-gray-600">{selectedSubmission.reviewer.name}</p>
                </div>
              )}

              {selectedSubmission.reviewNotes && (
                <div>
                  <span className="font-medium text-gray-700">Review Notes:</span>
                  <p className="text-gray-600 mt-1">{selectedSubmission.reviewNotes}</p>
                </div>
              )}

              {selectedSubmission.rejectionReason && (
                <div>
                  <span className="font-medium text-gray-700">Rejection Reason:</span>
                  <p className="text-gray-600 mt-1">{selectedSubmission.rejectionReason}</p>
                </div>
              )}

              {selectedSubmission.publishDate && (
                <div>
                  <span className="font-medium text-gray-700">Published:</span>
                  <p className="text-gray-600">{formatDate(selectedSubmission.publishDate)}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}