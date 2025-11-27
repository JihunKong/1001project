'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Tag,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CommentableTextEditor,
  CommentPopup,
  RevisionRequestModal,
  AIReviewSection,
  type RevisionRequestData
} from '@/components/story-publication/admin';
import Popover from '@/components/ui/Popover';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Comment {
  id: string;
  content: string;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  authorId: string;
  status: 'OPEN' | 'RESOLVED' | 'ARCHIVED';
  isResolved: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  replies?: Comment[];
}

interface AIReview {
  id: string;
  feedback: any;
  suggestions: string[];
  score: number | null;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  storyFeedback?: string;
  aiReviews?: AIReview[];
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
  const { t } = useTranslation();
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
  const [showEditRevisionModal, setShowEditRevisionModal] = useState(false);
  const [editRevisionFeedback, setEditRevisionFeedback] = useState('');

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [commentAnchor, setCommentAnchor] = useState<HTMLElement | null>(null);
  const [commentFilter, setCommentFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'STORY_MANAGER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  const fetchSubmission = useCallback(async () => {
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
  }, [params.id]);

  const fetchComments = useCallback(async () => {
    if (!params.id) return;

    setLoadingComments(true);
    try {
      const response = await fetch(`/api/text-submissions/${params.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      toast.error(t('dashboard.storyManager.review.toast.loadCommentsFailed'));
    } finally {
      setLoadingComments(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session?.user?.role === 'STORY_MANAGER' && params.id) {
      fetchSubmission();
      fetchComments();
    }
  }, [session, params.id, fetchComments, fetchSubmission]);

  const handleAddComment = async (highlightedText: string, startOffset: number, endOffset: number, content: string) => {
    if (!submission || !session?.user?.id) return;

    try {
      const response = await fetch(`/api/text-submissions/${submission.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          highlightedText,
          startOffset,
          endOffset
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      await fetchComments();
      toast.success(t('dashboard.storyManager.review.toast.commentAdded'));
    } catch (err) {
      toast.error(t('dashboard.storyManager.review.toast.commentAddFailed'));
    }
  };

  const handleCommentClick = (comment: Comment) => {
    setSelectedComment(comment);

    const virtualAnchor = document.createElement('div');
    virtualAnchor.style.position = 'fixed';
    virtualAnchor.style.top = '50%';
    virtualAnchor.style.right = '400px';
    virtualAnchor.style.width = '1px';
    virtualAnchor.style.height = '1px';
    document.body.appendChild(virtualAnchor);

    setCommentAnchor(virtualAnchor);
  };

  const handleCloseCommentPopup = () => {
    setSelectedComment(null);
    if (commentAnchor && document.body.contains(commentAnchor)) {
      document.body.removeChild(commentAnchor);
    }
    setCommentAnchor(null);
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${parentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      await fetchComments();
      toast.success(t('dashboard.storyManager.review.toast.replyAdded'));
    } catch (err) {
      toast.error(t('dashboard.storyManager.review.toast.replyAddFailed'));
    }
  };

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isResolved }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve comment');
      }

      await fetchComments();
      toast.success(isResolved ? t('dashboard.storyManager.review.toast.commentResolved') : t('dashboard.storyManager.review.toast.commentReopened'));
    } catch (err) {
      toast.error(t('dashboard.storyManager.review.toast.commentResolveFailed'));
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      await fetchComments();
      toast.success(t('dashboard.storyManager.review.toast.commentUpdated'));
    } catch (err) {
      toast.error(t('dashboard.storyManager.review.toast.commentUpdateFailed'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      await fetchComments();
      handleCloseCommentPopup();
      toast.success(t('dashboard.storyManager.review.toast.commentDeleted'));
    } catch (err) {
      toast.error(t('dashboard.storyManager.review.toast.commentDeleteFailed'));
    }
  };

  const handleRevisionRequest = async (data: RevisionRequestData) => {
    if (!submission) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'story_needs_revision',
          feedback: data.notes,
          comment: `Revision requested with ${data.priority} priority${data.dueDate ? `, due ${data.dueDate}` : ''}`,
          metadata: {
            priority: data.priority,
            dueDate: data.dueDate,
            revisionTypes: data.revisionTypes
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request revision');
      }

      const result = await response.json();
      setSubmission(result.submission);
      setShowFeedbackForm(false);
      setAction(null);

      toast.success(t('dashboard.storyManager.review.toast.revisionRequested'));

      setTimeout(() => {
        router.push('/dashboard/story-manager');
      }, 2000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

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
          ? t('dashboard.storyManager.review.toast.storyApproved')
          : actionType === 'revision'
          ? t('dashboard.storyManager.review.toast.revisionRequested')
          : t('dashboard.storyManager.review.toast.storyRejected')
      );

      setTimeout(() => {
        router.push('/dashboard/story-manager');
      }, 2000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndoReject = async () => {
    if (!submission) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'undo_reject',
          comment: 'Rejection undone by Story Manager'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to undo rejection');
      }

      const data = await response.json();
      setSubmission(data.submission);
      toast.success(t('dashboard.storyManager.review.toast.rejectionUndone'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRevisionFeedback = async () => {
    if (!submission || !editRevisionFeedback.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_revision_feedback',
          feedback: editRevisionFeedback.trim(),
          comment: 'Revision feedback updated by Story Manager'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update revision feedback');
      }

      const data = await response.json();
      setSubmission(data.submission);
      setShowEditRevisionModal(false);
      setEditRevisionFeedback('');
      toast.success(t('dashboard.storyManager.review.toast.feedbackUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditRevisionModal = () => {
    setEditRevisionFeedback(submission?.storyFeedback || '');
    setShowEditRevisionModal(true);
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

  const getStatusLabel = (status: string) => {
    const statusKey = `dashboard.storyManager.review.statusLabels.${status}`;
    return t(statusKey);
  };

  const canTakeAction = (status: string) => {
    return ['PENDING', 'STORY_REVIEW', 'NEEDS_REVISION'].includes(status);
  };

  const canUndoReject = (status: string) => {
    return status === 'REJECTED';
  };

  const canEditRevision = (status: string) => {
    return status === 'NEEDS_REVISION';
  };

  const filteredComments = comments.filter(comment => {
    if (commentFilter === 'all') return true;
    if (commentFilter === 'open') return comment.status === 'OPEN';
    if (commentFilter === 'resolved') return comment.status === 'RESOLVED';
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.storyManager.review.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600">{t('dashboard.storyManager.review.error.message', { error: error || t('dashboard.storyManager.review.error.notFound') })}</p>
          <Link
            href="/dashboard/story-manager"
            className="mt-4 inline-block px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            {t('dashboard.storyManager.review.backToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard/story-manager"
              className="mr-4 bg-soe-green-400 hover:bg-soe-green-500 text-white p-2 rounded-lg inline-flex items-center"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.storyManager.review.title')}</h1>
              <p className="mt-2 text-gray-600">
                {t('dashboard.storyManager.review.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
              {getStatusLabel(submission.status)}
            </span>
            {canTakeAction(submission.status) && (
              <>
                <button
                  onClick={() => {
                    setAction('approve');
                    setShowFeedbackForm(true);
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('dashboard.storyManager.review.actions.approve')}
                </button>
                <button
                  onClick={() => {
                    setAction('revision');
                    setShowFeedbackForm(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('dashboard.storyManager.review.actions.requestRevision')}
                </button>
                <button
                  onClick={() => {
                    setAction('reject');
                    setShowFeedbackForm(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('dashboard.storyManager.review.actions.reject')}
                </button>
              </>
            )}
            {canUndoReject(submission.status) && (
              <button
                onClick={handleUndoReject}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('dashboard.storyManager.review.actions.undoReject')}
              </button>
            )}
            {canEditRevision(submission.status) && (
              <button
                onClick={openEditRevisionModal}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('dashboard.storyManager.review.actions.editRevision')}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Story Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{submission.title}</h2>
                <p className="text-gray-600 mt-2">{t('dashboard.storyManager.review.metadata.author', { name: submission.authorAlias })}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {submission.wordCount} {t('dashboard.storyManager.review.metadata.words')}
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {submission.language}
                  </div>
                  {submission.ageRange && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {t('dashboard.storyManager.review.metadata.ages', { range: submission.ageRange })}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {t('dashboard.storyManager.review.metadata.submittedOn')} {new Date(submission.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {((submission.category || []).length > 0 || submission.tags.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {(submission.category || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.metadata.categories')}</span>
                        {(submission.category || []).map((category, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                    {submission.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.metadata.tags')}</span>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.storyManager.review.sections.summary')}</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{submission.summary}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.storyManager.review.sections.storyContent')}</h3>
                <CommentableTextEditor
                  content={submission.content}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onCommentClick={handleCommentClick}
                  readOnly={false}
                />
              </div>
            </div>

            {submission.storyFeedback && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t('dashboard.storyManager.review.sections.previousFeedback')}
                </h3>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <p className="text-gray-700">{submission.storyFeedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Review Assistant */}
            <AIReviewSection
              submissionId={submission.id}
              existingReview={submission.aiReviews && submission.aiReviews.length > 0 ? submission.aiReviews[0] : null}
            />

            {/* Comments Sidebar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.storyManager.review.comments.title')}</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={commentFilter}
                    onChange={(e) => setCommentFilter(e.target.value as 'all' | 'open' | 'resolved')}
                    className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
                  >
                    <option value="all">{t('dashboard.storyManager.review.comments.filter.all', { count: comments.length })}</option>
                    <option value="open">{t('dashboard.storyManager.review.comments.filter.open', { count: comments.filter(c => c.status === 'OPEN').length })}</option>
                    <option value="resolved">{t('dashboard.storyManager.review.comments.filter.resolved', { count: comments.filter(c => c.status === 'RESOLVED').length })}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loadingComments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : filteredComments.length > 0 ? (
                  filteredComments.map((comment) => (
                    <button
                      key={comment.id}
                      onClick={() => handleCommentClick(comment)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {comment.author.name || comment.author.email}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          comment.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {t(`dashboard.storyManager.review.comments.status.${comment.status}`)}
                        </span>
                      </div>
                      {comment.highlightedText && (
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          &quot;{comment.highlightedText}&quot;
                        </p>
                      )}
                      <p className="text-sm text-gray-900 line-clamp-2 font-normal">{comment.content}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t('dashboard.storyManager.review.comments.empty')}</p>
                )}
              </div>
            </div>

            {/* Author Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.storyManager.review.authorInfo.title')}</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.authorInfo.authorAlias')}</span>
                  <p className="font-medium text-gray-900">{submission.authorAlias}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.authorInfo.realName')}</span>
                  <p className="font-medium text-gray-900">{submission.author.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.authorInfo.email')}</span>
                  <p className="font-medium text-gray-900">{submission.author.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.authorInfo.visibility')}</span>
                  <p className="font-medium text-gray-900">{submission.visibility}</p>
                </div>
                {submission.targetAudience && (
                  <div>
                    <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.authorInfo.targetAudience')}</span>
                    <p className="font-medium text-gray-900">{submission.targetAudience}</p>
                  </div>
                )}
                {submission.licenseType && (
                  <div>
                    <span className="text-sm text-gray-500">{t('dashboard.storyManager.review.authorInfo.license')}</span>
                    <p className="font-medium text-gray-900">{submission.licenseType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.storyManager.review.workflowHistory.title')}</h3>
              <div className="space-y-3">
                {submission.workflowHistory.length > 0 ? (
                  submission.workflowHistory.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {t('dashboard.storyManager.review.workflowHistory.transition', { fromStatus: entry.fromStatus, toStatus: entry.toStatus })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{t('dashboard.storyManager.review.workflowHistory.performedBy', { name: entry.performedBy.name })}</p>
                      {entry.comment && (
                        <p className="text-sm text-gray-700 mt-1">{entry.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">{t('dashboard.storyManager.review.workflowHistory.empty')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      {action === 'revision' && (
        <RevisionRequestModal
          isOpen={showFeedbackForm}
          onClose={() => {
            setShowFeedbackForm(false);
            setAction(null);
          }}
          onSubmit={handleRevisionRequest}
          isSubmitting={submitting}
          submissionTitle={submission.title}
        />
      )}

      {/* Approve/Reject Feedback Modal */}
      {action !== 'revision' && showFeedbackForm && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'approve' && t('dashboard.storyManager.review.modals.approve.title')}
              {action === 'reject' && t('dashboard.storyManager.review.modals.reject.title')}
            </h3>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                action === 'approve'
                  ? t('dashboard.storyManager.review.modals.approve.placeholder')
                  : t('dashboard.storyManager.review.modals.reject.placeholder')
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900"
              required={action !== 'approve'}
              autoComplete="off"
              name="story-manager-feedback"
              data-form-type="other"
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
                {t('dashboard.storyManager.review.modals.cancel')}
              </button>
              <button
                onClick={() => handleAction(action)}
                disabled={submitting || (action !== 'approve' && !feedback.trim())}
                className={`px-4 py-2 text-white rounded-lg ${
                  action === 'approve'
                    ? 'bg-gray-900 hover:bg-gray-800'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting ? t('dashboard.storyManager.review.modals.processing') : (action === 'approve' ? t('dashboard.storyManager.review.modals.approve.confirm') : t('dashboard.storyManager.review.modals.reject.confirm'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Revision Feedback Modal */}
      {showEditRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.storyManager.review.modals.editRevision.title')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('dashboard.storyManager.review.modals.editRevision.description')}
            </p>
            <textarea
              value={editRevisionFeedback}
              onChange={(e) => setEditRevisionFeedback(e.target.value)}
              placeholder={t('dashboard.storyManager.review.modals.editRevision.placeholder')}
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900"
              autoComplete="off"
              name="edit-revision-feedback"
              data-form-type="other"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowEditRevisionModal(false);
                  setEditRevisionFeedback('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                {t('dashboard.storyManager.review.modals.cancel')}
              </button>
              <button
                onClick={handleUpdateRevisionFeedback}
                disabled={submitting || !editRevisionFeedback.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? t('dashboard.storyManager.review.modals.processing') : t('dashboard.storyManager.review.modals.editRevision.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Detail Popover */}
      {selectedComment && session?.user && submission && (
        <Popover
          isOpen={true}
          onClose={handleCloseCommentPopup}
          anchorElement={commentAnchor}
          placement="left"
        >
          <div className="p-4 max-w-md">
            <CommentPopup
              comment={selectedComment}
              currentUserId={session.user.id}
              currentUserRole={session.user.role}
              submissionAuthorId={submission.author.id}
              onReply={handleReply}
              onResolve={handleResolve}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          </div>
        </Popover>
      )}
    </div>
  );
}
