'use client';

import { useState } from 'react';
import { MessageSquare, CheckCircle, Trash2, Edit2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentThread from './CommentThread';

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

interface CommentPopupProps {
  comment: Comment;
  currentUserId: string;
  currentUserRole: string;
  submissionAuthorId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onResolve: (commentId: string, isResolved: boolean) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export default function CommentPopup({
  comment,
  currentUserId,
  currentUserRole,
  submissionAuthorId,
  onReply,
  onResolve,
  onEdit,
  onDelete
}: CommentPopupProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = comment.authorId === currentUserId;
  const isSubmissionAuthor = submissionAuthorId === currentUserId;
  const isReviewer = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(currentUserRole);

  const canEdit = isAuthor;
  const canDelete = isAuthor || currentUserRole === 'ADMIN';
  const canResolve = isAuthor || isSubmissionAuthor || isReviewer;

  const handleReply = async () => {
    if (replyContent.trim().length === 0) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error replying to comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (editContent.trim().length === 0) return;

    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    try {
      await onResolve(comment.id, !comment.isResolved);
    } catch (error) {
      console.error('Error resolving comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsSubmitting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'STORY_MANAGER':
        return 'bg-blue-100 text-blue-700';
      case 'BOOK_MANAGER':
        return 'bg-purple-100 text-purple-700';
      case 'CONTENT_ADMIN':
        return 'bg-green-100 text-green-700';
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-lg border ${
        comment.status === 'RESOLVED'
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-[#E5E5EA]'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#5951E7] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {comment.author.name?.[0] || comment.author.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-[#141414] truncate">
                {comment.author.name || comment.author.email}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#8E8E93]">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(comment.author.role)}`}>
                  {comment.author.role.replace('_', ' ')}
                </span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {comment.status === 'RESOLVED' && (
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium flex-shrink-0">
              <CheckCircle className="h-3 w-3" />
              <span>Resolved</span>
            </div>
          )}
        </div>

        {comment.highlightedText && (
          <div className="text-xs text-[#8E8E93] mb-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E5EA]">
            &quot;{comment.highlightedText}&quot;
          </div>
        )}

        {isEditMode ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5951E7] text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setEditContent(comment.content);
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm border border-[#E5E5EA] rounded-lg hover:bg-[#F9FAFB] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSubmitting || editContent.trim().length === 0}
                className="px-3 py-1.5 text-sm bg-[#5951E7] text-white rounded-lg hover:bg-[#4338CA] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#141414] whitespace-pre-wrap">{comment.content}</p>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E5E5EA]">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#5951E7] hover:bg-[#EEF2FF] rounded"
          >
            <MessageSquare className="h-3 w-3" />
            Reply
          </button>

          {canResolve && (
            <button
              onClick={handleResolve}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3" />
              {comment.isResolved ? 'Unresolve' : 'Resolve'}
            </button>
          )}

          {canEdit && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded ml-auto disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <CommentThread
          comments={comment.replies}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          submissionAuthorId={submissionAuthorId}
          onReply={onReply}
          onResolve={onResolve}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {showReplyForm && (
        <div className="ml-8 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full px-3 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5951E7] text-sm"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
              }}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm border border-[#E5E5EA] rounded-lg hover:bg-[#F9FAFB] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReply}
              disabled={isSubmitting || replyContent.trim().length === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#5951E7] text-white rounded-lg hover:bg-[#4338CA] disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              {isSubmitting ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
