"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Clock,
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PENDING' | 'STORY_REVIEW' | 'FORMAT_REVIEW' | 'CONTENT_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'NEEDS_REVISION' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  wordCount?: number;
  characterCount?: number;
  feedback?: Array<{
    id: string;
    content: string;
    createdAt: string;
    role: string;
  }>;
  reviewHistory?: Array<{
    stage: string;
    reviewer: string;
    action: string;
    timestamp: string;
    comment?: string;
  }>;
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit },
  PENDING: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  STORY_REVIEW: { label: 'Story Review', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  FORMAT_REVIEW: { label: 'Format Review', color: 'bg-purple-100 text-purple-700', icon: BookOpen },
  CONTENT_REVIEW: { label: 'Content Review', color: 'bg-indigo-100 text-indigo-700', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PUBLISHED: { label: 'Published', color: 'bg-teal-100 text-teal-700', icon: BookOpen },
  NEEDS_REVISION: { label: 'Needs Revision', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
};

export default function MyLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/writer/library');
    } else if (status === 'authenticated') {
      fetchSubmissions();
    }
  }, [status]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/writer/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions
    .filter(sub => {
      const matchesSearch = sub.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getSubmissionStats = () => {
    return {
      total: submissions.length,
      drafts: submissions.filter(s => s.status === 'DRAFT').length,
      inReview: submissions.filter(s => ['STORY_REVIEW', 'FORMAT_REVIEW', 'CONTENT_REVIEW'].includes(s.status)).length,
      published: submissions.filter(s => s.status === 'PUBLISHED').length,
      needsAction: submissions.filter(s => s.status === 'NEEDS_REVISION').length
    };
  };

  const stats = getSubmissionStats();

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div id="main-content" data-role="volunteer" className="max-w-[1240px] mx-auto px-8 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#141414]">Library</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Stories</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-700">{stats.drafts}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-yellow-600">{stats.inReview}</div>
          <div className="text-sm text-gray-600">In Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-teal-600">{stats.published}</div>
          <div className="text-sm text-gray-600">Published</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">{stats.needsAction}</div>
          <div className="text-sm text-gray-600">Needs Action</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'status')}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="status">Sort by Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* New Story Button */}
          <button
            onClick={() => router.push('/dashboard/writer/submit-text')}
            className="flex items-center gap-2 bg-[#141414] !text-white px-4 py-2 rounded-lg hover:bg-[#1f1f1f] transition-colors"
            style={{ color: '#ffffff' }}
          >
            <Plus className="h-4 w-4 !text-white" style={{ color: '#ffffff' }} />
            New Story
          </button>
        </div>
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by writing your first story'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => router.push('/dashboard/writer/submit-text')}
              className="bg-[#141414] text-white px-4 py-2 rounded-lg hover:bg-[#1f1f1f] transition-colors"
            >
              Write Your First Story
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {submission.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(submission.updatedAt).toLocaleDateString()}
                      </span>
                      {submission.wordCount && (
                        <span>{submission.wordCount} words</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig[submission.status].color}`}>
                      {React.createElement(statusConfig[submission.status].icon, { className: 'h-3 w-3' })}
                      {statusConfig[submission.status].label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  {submission.status === 'DRAFT' && (
                    <button
                      onClick={() => router.push(`/dashboard/writer/submit-text?id=${submission.id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#141414] !text-white rounded hover:bg-[#1f1f1f] transition-colors"
                      style={{ color: '#ffffff' }}
                    >
                      <Edit className="h-3 w-3 !text-white" style={{ color: '#ffffff' }} />
                      Continue Writing
                    </button>
                  )}
                  {submission.status === 'NEEDS_REVISION' && (
                    <button
                      onClick={() => router.push(`/dashboard/writer/submit-text?id=${submission.id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                      Revise Story
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowTimeline(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    View Timeline
                  </button>
                  {submission.status === 'PUBLISHED' && (
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 border border-teal-600 rounded hover:bg-teal-50 transition-colors"
                    >
                      <BookOpen className="h-3 w-3" />
                      View Published Story
                    </button>
                  )}
                </div>

                {/* Feedback Preview */}
                {submission.feedback && submission.feedback.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Latest Feedback:</span>
                      <p className="mt-1 text-gray-700 line-clamp-2">
                        {submission.feedback[0].content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Modal */}
      {showTimeline && selectedSubmission && (
        <TimelineModal
          submission={selectedSubmission}
          onClose={() => {
            setShowTimeline(false);
            setSelectedSubmission(null);
          }}
        />
      )}
    </div>
  );
}

function TimelineModal({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const stages = [
    { key: 'DRAFT', label: 'Writing', icon: Edit },
    { key: 'PENDING', label: 'Submitted', icon: Clock },
    { key: 'STORY_REVIEW', label: 'Story Review', icon: FileText },
    { key: 'FORMAT_REVIEW', label: 'Format Review', icon: BookOpen },
    { key: 'CONTENT_REVIEW', label: 'Content Review', icon: AlertCircle },
    { key: 'PUBLISHED', label: 'Published', icon: CheckCircle }
  ];

  const getCurrentStageIndex = () => {
    const index = stages.findIndex(s => s.key === submission.status);
    return index >= 0 ? index : 0;
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{submission.title}</h2>
              <p className="text-gray-600 mt-1">Submission Timeline</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>
            <div
              className="absolute left-8 top-8 w-0.5 bg-[#141414] transition-all duration-500"
              style={{ height: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
            ></div>

            <div className="space-y-8">
              {stages.map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isRejected = submission.status === 'REJECTED';
                const needsRevision = submission.status === 'NEEDS_REVISION';

                return (
                  <div key={stage.key} className="relative flex items-start gap-4">
                    <div
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center z-10
                        ${isCompleted
                          ? isRejected
                            ? 'bg-red-600 text-white'
                            : needsRevision
                              ? 'bg-orange-600 text-white'
                              : 'bg-[#141414] text-white'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }
                        ${isCurrent ? 'ring-4 ring-gray-200' : ''}
                      `}
                    >
                      {React.createElement(stage.icon, { className: 'h-6 w-6' })}
                    </div>

                    <div className="flex-1 pb-8">
                      <h3 className={`text-lg font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stage.label}
                      </h3>

                      {isCurrent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-[#141414] mt-1">
                          Current Stage
                        </span>
                      )}

                      {/* Stage Details */}
                      {submission.reviewHistory?.filter(h => h.stage === stage.key).map((history, idx) => (
                        <div key={idx} className="mt-3 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{history.reviewer}</span>
                              <span className="text-gray-600"> · {history.action}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(history.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {history.comment && (
                            <p className="text-sm text-gray-700">{history.comment}</p>
                          )}
                        </div>
                      ))}

                      {/* Show feedback at current stage */}
                      {isCurrent && submission.feedback && submission.feedback.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {submission.feedback.map((fb) => (
                            <div key={fb.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{fb.role}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(fb.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{fb.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {submission.status === 'NEEDS_REVISION' && (
              <button
                onClick={() => window.location.href = `/dashboard/writer/submit-text?id=${submission.id}`}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Revise Story
              </button>
            )}
            {submission.status === 'DRAFT' && (
              <button
                onClick={() => window.location.href = `/dashboard/writer/submit-text?id=${submission.id}`}
                className="px-4 py-2 bg-[#141414] text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
              >
                Continue Writing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}