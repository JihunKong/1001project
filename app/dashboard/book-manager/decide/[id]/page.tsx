'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
  CheckCircle,
  Edit,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  CommentableTextEditor,
  CommentPopup,
  BookManagerRevisionModal,
  AIReviewSection,
  type BookManagerRevisionData
} from '@/components/story-publication/admin';
import Popover from '@/components/ui/Popover';

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
  storyManager?: {
    id: string;
    name: string;
    email: string;
  };
  storyFeedback?: string;
  bookDecision?: string;
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
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<TextSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [commentAnchor, setCommentAnchor] = useState<HTMLElement | null>(null);
  const [commentFilter, setCommentFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.user?.role !== 'BOOK_MANAGER') {
      router.replace('/dashboard');
      return;
    }
  }, [session, status, router]);

  const fetchSubmission = useCallback(async () => {
    try {
      const response = await fetch(`/api/text-submissions/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }
      const data = await response.json();
      setSubmission(data.submission);

      if (data.submission.bookDecision) {
        setSelectedFormat(data.submission.bookDecision);
      }
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
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session?.user?.role === 'BOOK_MANAGER' && params.id) {
      fetchSubmission();
      fetchComments();
    }
  }, [session, params.id, fetchSubmission, fetchComments]);

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
      toast.success('Comment added successfully');
    } catch (err) {
      toast.error('Failed to add comment');
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
      toast.success('Reply added');
    } catch (err) {
      toast.error('Failed to add reply');
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
      toast.success(isResolved ? 'Comment resolved' : 'Comment reopened');
    } catch (err) {
      toast.error('Failed to update comment status');
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
      toast.success('Comment updated');
    } catch (err) {
      toast.error('Failed to update comment');
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
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

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

      setTimeout(() => {
        router.push('/dashboard/book-manager');
      }, 2000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevisionRequest = async (data: BookManagerRevisionData) => {
    if (!submission) return;

    setSubmitting(true);
    try {
      const actionType = data.targetRole === 'WRITER' ? 'bm_needs_revision' : 'story_needs_revision';

      const response = await fetch(`/api/text-submissions/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType,
          feedback: data.notes,
          comment: `Revision requested to ${data.targetRole} with ${data.priority} priority${data.dueDate ? `, due ${data.dueDate}` : ''}`,
          metadata: {
            priority: data.priority,
            dueDate: data.dueDate,
            revisionTypes: data.revisionTypes,
            targetRole: data.targetRole
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request revision');
      }

      const result = await response.json();
      setSubmission(result.submission);
      setShowRevisionModal(false);

      toast.success('Revision request sent successfully!');

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

  const canTakeAction = (status: string) => {
    return ['STORY_APPROVED', 'FORMAT_REVIEW'].includes(status);
  };

  const filteredComments = comments.filter(comment => {
    if (commentFilter === 'all') return true;
    if (commentFilter === 'open') return comment.status === 'OPEN';
    if (commentFilter === 'resolved') return comment.status === 'RESOLVED';
    return true;
  });

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
                <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.bookManager.decide.title')}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {t('dashboard.bookManager.decide.subtitle')}
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
              {canTakeAction(submission.status) && (
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('dashboard.bookManager.decide.actions.requestRevision')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
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

                {((submission.category || []).length > 0 || submission.tags.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {(submission.category || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500">Categories:</span>
                        {(submission.category || []).map((category, index) => (
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

              {submission.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{submission.summary}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Content (Click text to add comments)</h3>
                <CommentableTextEditor
                  content={submission.content}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onCommentClick={handleCommentClick}
                  readOnly={false}
                />
              </div>
            </div>

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

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this format decision..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm text-[#141414]"
                />
              </div>

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
                  className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg disabled:opacity-50 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </div>

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

          <div className="space-y-6">
            <AIReviewSection
              submissionId={submission.id}
              existingReview={submission.aiReviews && submission.aiReviews.length > 0 ? submission.aiReviews[0] : null}
            />

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.bookManager.decide.comments.title')}</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={commentFilter}
                    onChange={(e) => setCommentFilter(e.target.value as 'all' | 'open' | 'resolved')}
                    className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
                  >
                    <option value="all">{t('dashboard.bookManager.decide.comments.filter.all', { count: comments.length })}</option>
                    <option value="open">{t('dashboard.bookManager.decide.comments.filter.open', { count: comments.filter(c => c.status === 'OPEN').length })}</option>
                    <option value="resolved">{t('dashboard.bookManager.decide.comments.filter.resolved', { count: comments.filter(c => c.status === 'RESOLVED').length })}</option>
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
                          {comment.status}
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
                  <p className="text-sm text-gray-500 text-center py-4">{t('dashboard.bookManager.decide.comments.empty')}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Author Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Author Alias:</span>
                  <p className="font-medium text-gray-900">{submission.authorAlias}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Real Name:</span>
                  <p className="font-medium text-gray-900">{submission.author.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium text-gray-900">{submission.author.email}</p>
                </div>
                {submission.targetAudience && (
                  <div>
                    <span className="text-sm text-gray-500">Target Audience:</span>
                    <p className="font-medium text-gray-900">{submission.targetAudience}</p>
                  </div>
                )}
              </div>
            </div>

            {submission.storyManager && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Approval</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Approved By:</span>
                    <p className="font-medium text-gray-900">{submission.storyManager.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="font-medium text-gray-900">{submission.storyManager.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Approved On:</span>
                    <p className="font-medium text-gray-900">{new Date(submission.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review History</h3>
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
                  <p className="text-sm text-gray-500">No history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookManagerRevisionModal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRevisionRequest}
        isSubmitting={submitting}
        submissionTitle={submission.title}
      />

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
