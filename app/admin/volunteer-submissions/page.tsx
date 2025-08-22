'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Download,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';

interface VolunteerSubmission {
  id: string;
  title: string;
  authorAlias: string;
  language: string;
  status: string;
  priority: string;
  ageRange?: string;
  category: string[];
  tags: string[];
  summary: string;
  pdfRef?: string;
  originalName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
  rejectionReason?: string;
  volunteer: {
    name: string;
    email: string;
  };
  reviewer?: {
    name: string;
  };
}

export default function VolunteerSubmissionsAdmin() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<VolunteerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<VolunteerSubmission | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/volunteer-submissions');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filterStatus !== 'all' && submission.status !== filterStatus) return false;
    if (filterPriority !== 'all' && submission.priority !== filterPriority) return false;
    return true;
  });

  const statusCounts = submissions.reduce((acc, submission) => {
    acc[submission.status] = (acc[submission.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Submissions</h1>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Volunteer Submissions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Review and manage story submissions from volunteers
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{statusCounts.SUBMITTED || 0}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{statusCounts.IN_REVIEW || 0}</p>
                <p className="text-sm text-gray-600">In Review</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{statusCounts.APPROVED || 0}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{statusCounts.PUBLISHED || 0}</p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{statusCounts.REJECTED || 0}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_CHANGES">Needs Changes</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-600">
                No volunteer submissions match your current filters.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(submission.status)}
                        <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(submission.priority)}`}>
                          {submission.priority}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{submission.summary}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{submission.authorAlias}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(submission.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{formatFileSize(submission.fileSize)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>{submission.language.toUpperCase()}</span>
                        </div>
                      </div>

                      {submission.category.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {submission.category.map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {submission.pdfRef && (
                        <a
                          href={submission.pdfRef}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                      
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setReviewModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Review"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* TODO: Add Review Modal and Detail Modal components */}
        {selectedSubmission && !reviewModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
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

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Story Information</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Title:</span>
                        <p className="text-gray-900">{selectedSubmission.title}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Author:</span>
                        <p className="text-gray-900">{selectedSubmission.authorAlias}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Language:</span>
                        <p className="text-gray-900">{selectedSubmission.language.toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Age Range:</span>
                        <p className="text-gray-900">{selectedSubmission.ageRange || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Submission Details</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-900">{selectedSubmission.status}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Priority:</span>
                        <p className="text-gray-900">{selectedSubmission.priority}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">File Size:</span>
                        <p className="text-gray-900">{formatFileSize(selectedSubmission.fileSize)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Submitted:</span>
                        <p className="text-gray-900">{formatDate(selectedSubmission.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-700">{selectedSubmission.summary}</p>
                </div>

                {selectedSubmission.category.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.category.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSubmission.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Volunteer Information</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Name:</strong> {selectedSubmission.volunteer.name}</p>
                    <p><strong>Email:</strong> {selectedSubmission.volunteer.email}</p>
                  </div>
                </div>

                {selectedSubmission.reviewNotes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Review Notes</h4>
                    <p className="text-blue-800">{selectedSubmission.reviewNotes}</p>
                  </div>
                )}

                {selectedSubmission.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                    <p className="text-red-800">{selectedSubmission.rejectionReason}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  {selectedSubmission.pdfRef && (
                    <a
                      href={selectedSubmission.pdfRef}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View PDF
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setReviewModalOpen(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Review Submission
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}