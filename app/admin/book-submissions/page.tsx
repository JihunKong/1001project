'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  ChevronRight,
  Filter,
  Search,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type BookSubmissionStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVIEWED'
  | 'PENDING_COORDINATOR'
  | 'APPROVED_COORDINATOR'
  | 'PENDING_ADMIN'
  | 'PUBLISHED'
  | 'REJECTED';

interface BookSubmission {
  id: string;
  title: string;
  authorName: string;
  authorAge?: number;
  authorLocation?: string;
  summary?: string;
  language: string;
  format: string;
  status: BookSubmissionStatus;
  submittedBy: {
    id: string;
    name?: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name?: string;
    email: string;
  };
  coordinator?: {
    id: string;
    name?: string;
    email: string;
  };
  admin?: {
    id: string;
    name?: string;
    email: string;
  };
  createdAt: string;
  reviewedAt?: string;
  coordinatorApprovedAt?: string;
  adminApprovedAt?: string;
  publishedAt?: string;
  rejectionReason?: string;
}

export default function BookSubmissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookSubmissionStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<BookSubmission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }
      
      const response = await fetch(`/api/book-submissions?${params}`);
      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (submissionId: string, action: string, notes?: string) => {
    try {
      const response = await fetch(`/api/book-submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, notes }),
      });

      if (response.ok) {
        fetchSubmissions();
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const getStatusColor = (status: BookSubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'PENDING_REVIEW':
      case 'PENDING_COORDINATOR':
      case 'PENDING_ADMIN':
        return 'bg-yellow-100 text-yellow-700';
      case 'REVIEWED':
      case 'APPROVED_COORDINATOR':
        return 'bg-blue-100 text-blue-700';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: BookSubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />;
      case 'PENDING_REVIEW':
      case 'PENDING_COORDINATOR':
      case 'PENDING_ADMIN':
        return <Clock className="w-4 h-4" />;
      case 'REVIEWED':
      case 'APPROVED_COORDINATOR':
        return <CheckCircle className="w-4 h-4" />;
      case 'PUBLISHED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderApprovalChain = (submission: BookSubmission) => {
    const stages = [
      { 
        label: 'Submitted', 
        completed: true, 
        user: submission.submittedBy,
        date: submission.createdAt
      },
      { 
        label: 'Reviewed', 
        completed: !!submission.reviewedBy,
        pending: submission.status === 'PENDING_REVIEW',
        user: submission.reviewedBy,
        date: submission.reviewedAt
      },
      { 
        label: 'Coordinator', 
        completed: !!submission.coordinator,
        pending: submission.status === 'PENDING_COORDINATOR',
        user: submission.coordinator,
        date: submission.coordinatorApprovedAt
      },
      { 
        label: 'Admin', 
        completed: !!submission.admin,
        pending: submission.status === 'PENDING_ADMIN',
        user: submission.admin,
        date: submission.adminApprovedAt
      },
      { 
        label: 'Published', 
        completed: submission.status === 'PUBLISHED',
        date: submission.publishedAt
      }
    ];

    return (
      <div className="flex items-center space-x-2 overflow-x-auto">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center min-w-fit">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${stage.completed ? 'bg-green-500 text-white' : 
                  stage.pending ? 'bg-yellow-500 text-white animate-pulse' : 
                  'bg-gray-300 text-gray-600'}
              `}>
                {stage.completed ? <CheckCircle className="w-5 h-5" /> : 
                 stage.pending ? <Clock className="w-5 h-5" /> : 
                 <span className="text-xs">{index + 1}</span>}
              </div>
              <span className="text-xs mt-1 text-center">{stage.label}</span>
              {stage.user && (
                <span className="text-xs text-gray-500">{stage.user.name || stage.user.email.split('@')[0]}</span>
              )}
              {stage.date && (
                <span className="text-xs text-gray-400">
                  {new Date(stage.date).toLocaleDateString()}
                </span>
              )}
            </div>
            {index < stages.length - 1 && (
              <ChevronRight className={`w-4 h-4 ${
                stages[index + 1].completed || stages[index + 1].pending ? 'text-gray-600' : 'text-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const filteredSubmissions = submissions.filter(sub =>
    sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Publishing Progress</h1>
        <p className="text-gray-600">Monitor and manage book submissions through the approval workflow</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {submissions.filter(s => s.status === 'PENDING_REVIEW').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {submissions.filter(s => ['REVIEWED', 'PENDING_COORDINATOR', 'APPROVED_COORDINATOR', 'PENDING_ADMIN'].includes(s.status)).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'PUBLISHED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {submissions.filter(s => s.status === 'REJECTED').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as BookSubmissionStatus | 'ALL')}
              className="border rounded-lg px-3 py-2"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="PENDING_COORDINATOR">Pending Coordinator</option>
              <option value="APPROVED_COORDINATOR">Approved by Coordinator</option>
              <option value="PENDING_ADMIN">Pending Admin</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            />
          </div>
          <button
            onClick={() => router.push('/admin/book-submissions/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>New Submission</span>
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No submissions found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{submission.title}</h3>
                    <p className="text-sm text-gray-600">
                      by {submission.authorName} 
                      {submission.authorAge && ` (${submission.authorAge} years)`}
                      {submission.authorLocation && ` from ${submission.authorLocation}`}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1 ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span>{submission.status.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Format: {submission.format.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Language: {submission.language}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {submission.format === 'pdf' && (
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Approval Chain Visualization */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  {renderApprovalChain(submission)}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center space-x-2">
                  {submission.status === 'PENDING_REVIEW' && (
                    <button
                      onClick={() => handleAction(submission.id, 'review', 'Reviewed and approved')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Mark as Reviewed
                    </button>
                  )}
                  {submission.status === 'REVIEWED' && (
                    <button
                      onClick={() => handleAction(submission.id, 'request_coordinator')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Send to Coordinator
                    </button>
                  )}
                  {submission.status === 'PENDING_COORDINATOR' && (
                    <button
                      onClick={() => handleAction(submission.id, 'approve_coordinator', 'Approved by coordinator')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Coordinator Approve
                    </button>
                  )}
                  {submission.status === 'APPROVED_COORDINATOR' && (
                    <button
                      onClick={() => handleAction(submission.id, 'request_admin')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Send to Admin
                    </button>
                  )}
                  {submission.status === 'PENDING_ADMIN' && (
                    <button
                      onClick={() => handleAction(submission.id, 'approve_admin', 'Final approval and published')}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Publish Book
                    </button>
                  )}
                  {!['PUBLISHED', 'REJECTED'].includes(submission.status) && (
                    <button
                      onClick={() => handleAction(submission.id, 'reject', 'Does not meet quality standards')}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}