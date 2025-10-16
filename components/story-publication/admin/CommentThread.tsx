'use client';

import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface Comment {
  id: string;
  content: string;
  highlightedText?: string;
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
}

interface CommentThreadProps {
  comments: Comment[];
  currentUserId: string;
  currentUserRole: string;
  submissionAuthorId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onResolve: (commentId: string, isResolved: boolean) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export default function CommentThread({
  comments,
  currentUserId,
  currentUserRole,
  submissionAuthorId,
  onEdit,
  onDelete
}: CommentThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = async (commentId: string) => {
    if (editContent.trim().length === 0) return;

    setIsSubmitting(true);
    try {
      await onEdit(commentId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    setIsSubmitting(true);
    try {
      await onDelete(commentId);
    } catch (error) {
      console.error('Error deleting reply:', error);
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
    <div className="ml-8 space-y-2">
      {comments.map((reply) => {
        const isAuthor = reply.authorId === currentUserId;
        const canEdit = isAuthor;
        const canDelete = isAuthor || currentUserRole === 'ADMIN';
        const isEditing = editingId === reply.id;

        return (
          <div
            key={reply.id}
            className={`p-3 rounded-lg border ${
              reply.status === 'RESOLVED'
                ? 'bg-green-50 border-green-200'
                : 'bg-[#F9FAFB] border-[#E5E5EA]'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#8E8E93] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {reply.author.name?.[0] || reply.author.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs text-[#141414] truncate">
                    {reply.author.name || reply.author.email}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#8E8E93]">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(reply.author.role)}`}>
                      {reply.author.role.replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {reply.status === 'RESOLVED' && (
                <div className="flex items-center gap-1 text-green-600 text-xs flex-shrink-0">
                  <CheckCircle className="h-3 w-3" />
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E5E5EA] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#5951E7]"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    disabled={isSubmitting}
                    className="px-2 py-1 text-xs border border-[#E5E5EA] rounded hover:bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEdit(reply.id)}
                    disabled={isSubmitting || editContent.trim().length === 0}
                    className="px-2 py-1 text-xs bg-[#5951E7] text-white rounded hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#141414] whitespace-pre-wrap">{reply.content}</p>

                <div className="flex items-center gap-2 mt-2">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditingId(reply.id);
                        setEditContent(reply.content);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(reply.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
