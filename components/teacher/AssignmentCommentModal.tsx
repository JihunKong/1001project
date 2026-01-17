'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Trash2,
  Calendar,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  teacher: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Assignment {
  id: string;
  bookTitle: string;
  dueDate: string | null;
  instructions: string | null;
}

interface AssignmentCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  currentUserId?: string;
}

export default function AssignmentCommentModal({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  currentUserId,
}: AssignmentCommentModalProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchComments();
    }
  }, [isOpen, assignmentId]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/assign/${assignmentId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setAssignment(data.assignment || null);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/assign/${assignmentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Failed to post comment');
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t('dashboard.teacher.comments.deleteConfirm'))) return;

    try {
      const res = await fetch(
        `/api/books/assign/${assignmentId}/comments?commentId=${commentId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to delete comment');
      }
    } catch (err) {
      setError('Failed to delete comment');
      console.error('Error deleting comment:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-soe-green-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t('dashboard.teacher.comments.title')}
                </h2>
                <p className="text-sm text-gray-600">{assignmentTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {assignment && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>{assignment.bookTitle}</span>
              </div>
              {assignment.dueDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{t('dashboard.teacher.comments.dueDate')}: {formatDate(assignment.dueDate)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchComments}
                className="mt-4 text-emerald-600 hover:text-emerald-700 underline"
              >
                {t('dashboard.common.retry')}
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('dashboard.teacher.comments.empty')}</p>
              <p className="text-sm text-gray-400 mt-2">
                {t('dashboard.teacher.comments.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-soe-green-400 to-soe-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {(comment.teacher.name || comment.teacher.email)
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.teacher.name || comment.teacher.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                    {currentUserId === comment.teacher.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                        title={t('dashboard.common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={t('dashboard.teacher.comments.placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows={2}
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {newComment.length}/2000
              </p>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="self-start bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
