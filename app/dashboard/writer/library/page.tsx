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
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, StatusBadge, Button, Input, Select } from '@/components/figma/ui';
import Modal from '@/components/figma/ui/Modal';

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
  }, [status, router]);

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

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    ...Object.entries(statusConfig).map(([value, config]) => ({
      value,
      label: config.label
    }))
  ];

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'title', label: 'Sort by Title' },
    { value: 'status', label: 'Sort by Status' }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soe-green-600"></div>
      </div>
    );
  }

  return (
    <div data-role="volunteer" className="max-w-[1240px] mx-auto px-8 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-figma-black">Library</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card variant="bordered" padding="md">
          <div className="text-3xl font-semibold text-figma-black">{stats.total}</div>
          <div className="text-sm text-figma-gray-inactive mt-1">Total Stories</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-3xl font-semibold text-gray-700">{stats.drafts}</div>
          <div className="text-sm text-figma-gray-inactive mt-1">Drafts</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-3xl font-semibold text-yellow-600">{stats.inReview}</div>
          <div className="text-sm text-figma-gray-inactive mt-1">In Review</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-3xl font-semibold text-teal-600">{stats.published}</div>
          <div className="text-sm text-figma-gray-inactive mt-1">Published</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-3xl font-semibold text-orange-600">{stats.needsAction}</div>
          <div className="text-sm text-figma-gray-inactive mt-1">Needs Action</div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card variant="bordered" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="min-h-[44px]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-figma-gray-inactive flex-shrink-0" />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                className="min-h-[44px] min-w-[140px]"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-figma-gray-inactive flex-shrink-0" />
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(value) => setSortBy(value as 'date' | 'title' | 'status')}
                placeholder="Sort by"
                className="min-h-[44px] min-w-[140px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="min-h-[44px] min-w-[44px] px-3"
                aria-label={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* New Story Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/dashboard/writer/submit-text')}
            leftIcon={<Plus className="h-4 w-4" />}
            className="min-h-[44px]"
          >
            New Story
          </Button>
        </div>
      </Card>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <Card variant="bordered" padding="lg" className="text-center">
          <BookOpen className="h-12 w-12 text-figma-gray-inactive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-figma-black mb-2">No stories found</h3>
          <p className="text-figma-gray-inactive mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by writing your first story'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/dashboard/writer/submit-text')}
              className="min-h-[44px]"
            >
              Write Your First Story
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              variant="bordered"
              padding="lg"
              hoverable
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-figma-black mb-2">
                    {submission.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-figma-gray-inactive">
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
                  <StatusBadge status={submission.status} size="md" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {submission.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/dashboard/writer/submit-text?id=${submission.id}`)}
                    leftIcon={<Edit className="h-3 w-3" />}
                    className="min-h-[44px]"
                  >
                    Continue Writing
                  </Button>
                )}
                {submission.status === 'NEEDS_REVISION' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => router.push(`/dashboard/writer/submit-text?id=${submission.id}`)}
                    leftIcon={<Edit className="h-3 w-3" />}
                    className="min-h-[44px] bg-orange-600 hover:bg-orange-700 focus:ring-orange-300"
                  >
                    Revise Story
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setShowTimeline(true);
                  }}
                  leftIcon={<Eye className="h-3 w-3" />}
                  className="min-h-[44px]"
                >
                  View Timeline
                </Button>
                {submission.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] text-teal-600 border-teal-600 hover:bg-teal-50"
                    leftIcon={<BookOpen className="h-3 w-3" />}
                  >
                    View Published Story
                  </Button>
                )}
              </div>

              {/* Feedback Preview */}
              {submission.feedback && submission.feedback.length > 0 && (
                <div className="mt-4 pt-4 border-t border-figma-gray-border">
                  <div className="text-sm text-figma-gray-inactive">
                    <span className="font-medium text-figma-black">Latest Feedback:</span>
                    <p className="mt-1 text-figma-black line-clamp-2">
                      {submission.feedback[0].content}
                    </p>
                  </div>
                </div>
              )}
            </Card>
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={submission.title}
      size="xl"
    >
      <div className="py-2">
        <p className="text-figma-gray-inactive mb-6">Submission Timeline</p>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-figma-gray-border"></div>
          <div
            className="absolute left-8 top-8 w-0.5 bg-figma-black transition-all duration-500"
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
                            : 'bg-figma-black text-white'
                        : 'bg-gray-100 text-figma-gray-inactive border-2 border-figma-gray-border'
                      }
                      ${isCurrent ? 'ring-4 ring-gray-200' : ''}
                    `}
                  >
                    {React.createElement(stage.icon, { className: 'h-6 w-6' })}
                  </div>

                  <div className="flex-1 pb-8">
                    <h3 className={`text-lg font-semibold ${isCompleted ? 'text-figma-black' : 'text-figma-gray-inactive'}`}>
                      {stage.label}
                    </h3>

                    {isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-figma-black mt-1">
                        Current Stage
                      </span>
                    )}

                    {/* Stage Details */}
                    {submission.reviewHistory?.filter(h => h.stage === stage.key).map((history, idx) => (
                      <div key={idx} className="mt-3 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm">
                            <span className="font-medium text-figma-black">{history.reviewer}</span>
                            <span className="text-figma-gray-inactive"> · {history.action}</span>
                          </div>
                          <span className="text-xs text-figma-gray-inactive">
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {history.comment && (
                          <p className="text-sm text-figma-black">{history.comment}</p>
                        )}
                      </div>
                    ))}

                    {/* Show feedback at current stage */}
                    {isCurrent && submission.feedback && submission.feedback.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {submission.feedback.map((fb) => (
                          <div key={fb.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-figma-black">{fb.role}</span>
                              <span className="text-xs text-figma-gray-inactive">
                                {new Date(fb.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-figma-black">{fb.content}</p>
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
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            className="min-h-[44px]"
          >
            Close
          </Button>
          {submission.status === 'NEEDS_REVISION' && (
            <Button
              variant="danger"
              size="md"
              onClick={() => window.location.href = `/dashboard/writer/submit-text?id=${submission.id}`}
              className="min-h-[44px] bg-orange-600 hover:bg-orange-700 focus:ring-orange-300"
            >
              Revise Story
            </Button>
          )}
          {submission.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.href = `/dashboard/writer/submit-text?id=${submission.id}`}
              className="min-h-[44px]"
            >
              Continue Writing
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
