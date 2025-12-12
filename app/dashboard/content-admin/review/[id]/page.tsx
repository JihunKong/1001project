'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
  Tag,
  AlertTriangle,
  Filter,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  CommentableTextEditor,
  CommentPopup,
  ContentAdminRevisionModal,
  AIReviewSection,
  type ContentAdminRevisionData
} from '@/components/story-publication/admin';

interface Comment {
  id: string;
  content: string;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  authorId: string;
  status: 'OPEN' | 'RESOLVED' | 'ARCHIVED';
  isResolved: boolean;
  resolved?: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  replies?: Comment[];
}

interface TextSubmission {
  id: string;
  title: string;
  authorAlias: string;
  status: string;
  language: string;
  ageRange?: string;
  category: string[];
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
  const { t } = useTranslation();
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

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [commentFilter, setCommentFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.user?.role !== 'CONTENT_ADMIN') {
      router.replace('/dashboard');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/text-submissions/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }
        const data = await response.json();
        setSubmission(data.submission);

        if (data.submission.finalNotes) {
          setNotes(data.submission.finalNotes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'CONTENT_ADMIN' && params.id) {
      fetchSubmission();
    }
  }, [session, params.id]);

  const fetchComments = useCallback(async () => {
    if (!params.id) return;
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session?.user?.role === 'CONTENT_ADMIN' && params.id) {
      fetchComments();
    }
  }, [session, params.id, fetchComments]);

  const handleAddComment = async (
    highlightedText: string,
    startOffset: number,
    endOffset: number,
    content: string
  ) => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          startOffset,
          endOffset,
          selectedText: highlightedText,
        }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      toast.success(t('dashboard.contentAdmin.review.comments.added'));
      fetchComments();
    } catch (err) {
      toast.error(t('dashboard.contentAdmin.review.comments.addError'));
    }
  };

  const handleCommentClick = (comment: Comment) => {
    setSelectedComment(selectedComment?.id === comment.id ? null : comment);
  };

  const handleSidebarCommentClick = (comment: Comment) => {
    setSelectedComment(selectedComment?.id === comment.id ? null : comment);
  };

  const handleReplyToComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to add reply');

      toast.success(t('dashboard.contentAdmin.review.comments.replyAdded'));
      fetchComments();
    } catch (err) {
      toast.error(t('dashboard.contentAdmin.review.comments.replyError'));
    }
  };

  const handleResolveComment = async (commentId: string, isResolved: boolean) => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: isResolved }),
      });

      if (!response.ok) throw new Error('Failed to update comment');

      toast.success(isResolved
        ? t('dashboard.contentAdmin.review.comments.resolved')
        : t('dashboard.contentAdmin.review.comments.reopened'));
      fetchComments();
    } catch (err) {
      toast.error(t('dashboard.contentAdmin.review.comments.resolveError'));
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to edit comment');

      toast.success(t('dashboard.contentAdmin.review.comments.edited'));
      fetchComments();
    } catch (err) {
      toast.error(t('dashboard.contentAdmin.review.comments.editError'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      toast.success(t('dashboard.contentAdmin.review.comments.deleted'));
      setSelectedComment(null);
      fetchComments();
    } catch (err) {
      toast.error(t('dashboard.contentAdmin.review.comments.deleteError'));
    }
  };

  const handleRevisionRequest = async (data: ContentAdminRevisionData) => {
    if (!submission) return;

    setRevisionSubmitting(true);
    try {
      let actionType = 'ca_needs_revision';
      if (data.targetRole === 'STORY_MANAGER') {
        actionType = 'story_needs_revision';
      } else if (data.targetRole === 'WRITER') {
        actionType = 'ca_needs_revision';
      }

      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          feedback: data.notes,
          comment: `Revision requested by Content Admin: ${data.revisionTypes.join(', ') || 'General revision'}`,
          metadata: {
            priority: data.priority,
            dueDate: data.dueDate,
            revisionTypes: data.revisionTypes,
            targetRole: data.targetRole,
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to request revision');

      const responseData = await response.json();
      setSubmission(responseData.submission);
      setShowRevisionModal(false);

      toast.success(t('dashboard.contentAdmin.review.actions.revisionRequested'));
      setTimeout(() => router.push('/dashboard/content-admin'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('dashboard.contentAdmin.review.actions.revisionError'));
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const handleFinalAction = async (actionType: 'approve' | 'reject') => {
    if (!submission) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType === 'approve' ? 'final_approve' : 'reject',
          notes: notes.trim() || undefined,
          comment: `Content Admin ${actionType}: ${notes.trim() || 'Final review completed'}`
        }),
      });

      if (!response.ok) throw new Error('Failed to process final action');

      const data = await response.json();
      setSubmission(data.submission);
      setShowActionForm(false);
      setAction(null);

      toast.success(
        actionType === 'approve'
          ? t('dashboard.contentAdmin.review.actions.publishSuccess')
          : t('dashboard.contentAdmin.review.actions.rejectSuccess')
      );

      setTimeout(() => router.push('/dashboard/content-admin'), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (submissionStatus: string) => {
    switch (submissionStatus) {
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

  const canTakeAction = (submissionStatus: string) => {
    const actionableStatuses = ['CONTENT_REVIEW', 'NEEDS_REVISION'];
    return actionableStatuses.includes(submissionStatus);
  };

  const filteredComments = comments.filter(comment => {
    if (commentFilter === 'open') return !comment.isResolved;
    if (commentFilter === 'resolved') return comment.isResolved;
    return true;
  });

  const openCommentsCount = comments.filter(c => !c.isResolved).length;
  const resolvedCommentsCount = comments.filter(c => c.isResolved).length;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('common.error')}: {error || 'Submission not found'}</p>
          <Link
            href="/dashboard/content-admin"
            className="mt-4 inline-block px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            {t('common.backToDashboard')}
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
                <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.contentAdmin.review.title')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('dashboard.contentAdmin.review.subtitle')}</p>
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
                    onClick={() => setShowRevisionModal(true)}
                    className="bg-[#FF9500] hover:bg-[#FF8C00] text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t('dashboard.contentAdmin.review.actions.requestRevision')}
                  </button>
                  <button
                    onClick={() => {
                      setAction('approve');
                      setShowActionForm(true);
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {t('dashboard.contentAdmin.review.actions.publish')}
                  </button>
                  <button
                    onClick={() => {
                      setAction('reject');
                      setShowActionForm(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('dashboard.contentAdmin.review.actions.reject')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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

                {((submission.category || []).length > 0 || submission.tags.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {(submission.category || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">Categories:</span>
                        {(submission.category || []).map((category, index) => (
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

              {submission.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.contentAdmin.review.summary')}</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{submission.summary}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.contentAdmin.review.content')}</h3>
                <CommentableTextEditor
                  content={submission.content}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onCommentClick={handleCommentClick}
                  readOnly={!canTakeAction(submission.status)}
                />
              </div>
            </div>

            {submission.storyFeedback && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t('dashboard.contentAdmin.review.storyFeedback')}
                </h3>
                <div className="bg-soe-green-50 border border-soe-green-200 p-4 rounded-lg">
                  <p className="text-gray-700">{submission.storyFeedback}</p>
                </div>
              </div>
            )}

            {submission.finalNotes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  {t('dashboard.contentAdmin.review.adminNotes')}
                </h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-gray-700">{submission.finalNotes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t('dashboard.contentAdmin.review.comments.title')}
                </h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={commentFilter}
                    onChange={(e) => setCommentFilter(e.target.value as 'all' | 'open' | 'resolved')}
                    className="text-sm border-gray-200 rounded-lg"
                  >
                    <option value="all">{t('dashboard.contentAdmin.review.comments.all')} ({comments.length})</option>
                    <option value="open">{t('dashboard.contentAdmin.review.comments.open')} ({openCommentsCount})</option>
                    <option value="resolved">{t('dashboard.contentAdmin.review.comments.resolved')} ({resolvedCommentsCount})</option>
                  </select>
                </div>
              </div>

              {commentsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-soe-green-400 mx-auto"></div>
                </div>
              ) : filteredComments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      onClick={() => handleSidebarCommentClick(comment)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        comment.isResolved
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                        {comment.isResolved ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{comment.content}</p>
                      {comment.replies && comment.replies.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {comment.replies.length} {t('dashboard.contentAdmin.review.comments.replies')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t('dashboard.contentAdmin.review.comments.noComments')}
                </p>
              )}
            </div>

            <AIReviewSection
              submissionId={submission.id}
            />

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.contentAdmin.review.authorInfo')}</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.authorAlias')}:</span>
                  <p className="font-medium text-gray-900">{submission.authorAlias}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.realName')}:</span>
                  <p className="font-medium text-gray-900">{submission.author.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.email')}:</span>
                  <p className="font-medium text-gray-900">{submission.author.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.visibility')}:</span>
                  <p className="font-medium text-gray-900">{submission.visibility}</p>
                </div>
                {submission.targetAudience && (
                  <div>
                    <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.targetAudience')}:</span>
                    <p className="font-medium text-gray-900">{submission.targetAudience}</p>
                  </div>
                )}
                {submission.licenseType && (
                  <div>
                    <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.license')}:</span>
                    <p className="font-medium text-gray-900">{submission.licenseType}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.contentAdmin.review.reviewTeam')}</h3>
              <div className="space-y-4">
                {submission.storyManager && (
                  <div>
                    <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.storyManager')}:</span>
                    <p className="font-medium text-gray-900">{submission.storyManager.name}</p>
                    <p className="text-sm text-gray-500">{submission.storyManager.email}</p>
                  </div>
                )}
                {submission.bookManager && (
                  <div>
                    <span className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.bookManager')}:</span>
                    <p className="font-medium text-gray-900">{submission.bookManager.name}</p>
                    <p className="text-sm text-gray-500">{submission.bookManager.email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.contentAdmin.review.history')}</h3>
              <div className="space-y-3">
                {submission.workflowHistory.length > 0 ? (
                  submission.workflowHistory.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
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
                  <p className="text-sm text-gray-500">{t('dashboard.contentAdmin.review.noHistory')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('dashboard.contentAdmin.review.comments.title')}</h3>
              <button
                onClick={() => setSelectedComment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <CommentPopup
                comment={selectedComment}
                currentUserId={session?.user?.id || ''}
                currentUserRole={session?.user?.role || 'CONTENT_ADMIN'}
                submissionAuthorId={submission.author.id}
                onReply={handleReplyToComment}
                onResolve={handleResolveComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            </div>
          </div>
        </div>
      )}

      <ContentAdminRevisionModal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRevisionRequest}
        isSubmitting={revisionSubmitting}
        submissionTitle={submission.title}
      />

      {showActionForm && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'approve' && t('dashboard.contentAdmin.review.modal.publishTitle')}
              {action === 'reject' && t('dashboard.contentAdmin.review.modal.rejectTitle')}
            </h3>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                action === 'approve'
                  ? t('dashboard.contentAdmin.review.modal.publishPlaceholder')
                  : t('dashboard.contentAdmin.review.modal.rejectPlaceholder')
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-[#141414]"
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
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleFinalAction(action)}
                disabled={submitting || (action === 'reject' && !notes.trim())}
                className={`px-4 py-2 text-white rounded-lg ${
                  action === 'approve'
                    ? 'bg-gray-900 hover:bg-gray-800'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting
                  ? t('common.processing')
                  : action === 'approve'
                    ? t('dashboard.contentAdmin.review.modal.confirmPublish')
                    : t('dashboard.contentAdmin.review.modal.confirmReject')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
