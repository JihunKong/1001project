'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { Mark } from '@tiptap/core';
import { useState, useCallback, useEffect } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import Popover from '@/components/ui/Popover';
import DOMPurify from 'dompurify';
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

interface CommentableTextEditorProps {
  content: string;
  comments: Comment[];
  onAddComment?: (highlightedText: string, startOffset: number, endOffset: number, content: string) => void;
  onCommentClick?: (comment: Comment) => void;
  readOnly?: boolean;
  className?: string;
}

const CommentHighlight = Mark.create({
  name: 'commentHighlight',

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
            'class': 'comment-highlight',
          };
        },
      },
      status: {
        default: 'OPEN',
        parseHTML: element => element.getAttribute('data-status'),
        renderHTML: attributes => {
          return {
            'data-status': attributes.status,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

export default function CommentableTextEditor({
  content,
  comments,
  onAddComment,
  onCommentClick,
  readOnly = false,
  className = ''
}: CommentableTextEditorProps) {
  const { t } = useTranslation();
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [showAddComment, setShowAddComment] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      CharacterCount.configure({
        limit: null,
      }),
      CommentHighlight,
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-base max-w-none focus:outline-none text-[#141414] ${
          readOnly ? 'prose-gray' : ''
        }`,
        style: 'font-family: "Helvetica Neue", -apple-system, system-ui, sans-serif; font-size: 16px; line-height: 1.193; font-weight: 400;',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    editor.chain()
      .setTextSelection({ from: 0, to: editor.state.doc.content.size })
      .unsetMark('commentHighlight')
      .run();

    if (!comments || comments.length === 0) return;

    comments.forEach(comment => {
      if (comment.startOffset !== null && comment.endOffset !== null) {
        editor.chain()
          .setTextSelection({ from: comment.startOffset + 1, to: comment.endOffset + 1 })
          .setMark('commentHighlight', {
            commentId: comment.id,
            status: comment.status
          })
          .run();
      }
    });
  }, [editor, comments]);

  const handleTextSelection = useCallback(() => {
    if (!editor || readOnly) return;

    const { from, to } = editor.state.selection;

    if (from === to) {
      setShowAddComment(false);
      return;
    }

    const text = editor.state.doc.textBetween(from, to, ' ');
    if (text.trim().length === 0) {
      setShowAddComment(false);
      return;
    }

    setSelectedText(text);
    setSelectionRange({ from, to });

    const coords = editor.view.coordsAtPos(from);
    const virtualAnchor = document.createElement('div');
    virtualAnchor.style.position = 'absolute';
    virtualAnchor.style.top = `${coords.top}px`;
    virtualAnchor.style.left = `${coords.left}px`;
    virtualAnchor.style.width = '1px';
    virtualAnchor.style.height = '1px';
    document.body.appendChild(virtualAnchor);

    setAnchorElement(virtualAnchor);
    setShowAddComment(true);
  }, [editor, readOnly]);

  const handleAddComment = useCallback(() => {
    if (!editor || !selectionRange || !selectedText || !onAddComment) return;

    if (commentContent.trim().length === 0) {
      return;
    }

    onAddComment(selectedText, selectionRange.from - 1, selectionRange.to - 1, commentContent);

    setShowAddComment(false);
    setCommentContent('');
    setSelectedText('');
    setSelectionRange(null);

    if (anchorElement && document.body.contains(anchorElement)) {
      document.body.removeChild(anchorElement);
    }
    setAnchorElement(null);
  }, [editor, selectionRange, selectedText, commentContent, onAddComment, anchorElement]);

  const handleClosePopover = useCallback(() => {
    setShowAddComment(false);
    setCommentContent('');
    setSelectedText('');
    setSelectionRange(null);

    if (anchorElement && document.body.contains(anchorElement)) {
      document.body.removeChild(anchorElement);
    }
    setAnchorElement(null);
  }, [anchorElement]);

  useEffect(() => {
    const editorElement = editor?.view.dom;
    if (!editorElement) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const commentHighlight = target.closest('[data-comment-id]') as HTMLElement;

      if (commentHighlight && onCommentClick) {
        const commentId = commentHighlight.getAttribute('data-comment-id');
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          onCommentClick(comment);
        }
      }
    };

    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, comments, onCommentClick]);

  if (!editor) {
    return (
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="p-4 min-h-[400px] bg-white flex items-center justify-center">
          <div className="text-gray-400">{t('commentEditor.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .comment-highlight {
          background-color: #fef3c7;
          border-bottom: 2px solid #fbbf24;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .comment-highlight:hover {
          background-color: #fde68a;
        }
        .comment-highlight[data-status="RESOLVED"] {
          background-color: #d1fae5;
          border-bottom-color: #6ee7b7;
        }
        .comment-highlight[data-status="ARCHIVED"] {
          background-color: #f3f4f6;
          border-bottom-color: #d1d5db;
        }
      `}</style>

      <div className={`border border-[#E5E5EA] rounded-lg overflow-hidden bg-white ${className}`}>
        {!readOnly && (
          <div className="bg-[#EEF2FF] border-b border-[#E0E7FF] px-4 py-2 flex items-center gap-2 text-sm text-[#5951E7]">
            <MessageSquarePlus className="h-4 w-4" />
            <span>{t('commentEditor.instructions')}</span>
          </div>
        )}

        <div className="p-4 min-h-[400px] bg-white max-w-full overflow-hidden relative">
          <EditorContent
            editor={editor}
            className="focus-within:outline-none max-w-full break-words overflow-x-hidden"
            onMouseUp={!readOnly ? handleTextSelection : undefined}
          />
        </div>

        <div className="bg-[#F9FAFB] border-t border-[#E5E5EA] px-4 py-2 text-sm text-[#8E8E93] flex justify-between">
          <div className="text-xs">
            {t(comments.filter(c => c.status === 'OPEN').length === 1 ? 'commentEditor.openComments_one' : 'commentEditor.openComments_other', { count: comments.filter(c => c.status === 'OPEN').length })}
          </div>
          <div className="flex items-center space-x-4 text-xs sm:text-sm">
            <span>
              {editor.storage.characterCount ? editor.storage.characterCount.characters() : 0} {t('commentEditor.stats.characters')}
            </span>
            <span>
              {editor.storage.characterCount ? editor.storage.characterCount.words() : 0} {t('commentEditor.stats.words')}
            </span>
          </div>
        </div>
      </div>

      <Popover
        isOpen={showAddComment}
        onClose={handleClosePopover}
        anchorElement={anchorElement}
        placement="bottom"
        className="p-4"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">
              {t('commentEditor.addComment.label')}
            </label>
            <div className="text-xs text-[#8E8E93] mb-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E5EA]">
              &quot;{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}&quot;
            </div>
          </div>

          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t('commentEditor.addComment.placeholder')}
            className="w-full px-3 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5951E7] text-sm text-gray-900"
            rows={3}
            autoFocus
            autoComplete="off"
          />

          <div className="flex gap-2">
            <button
              onClick={handleClosePopover}
              className="flex-1 px-3 py-2 border border-[#E5E5EA] rounded-lg text-sm font-medium text-[#141414] hover:bg-[#F9FAFB]"
            >
              {t('commentEditor.addComment.cancel')}
            </button>
            <button
              onClick={handleAddComment}
              disabled={commentContent.trim().length === 0}
              className="flex-1 px-3 py-2 bg-[#5951E7] text-white rounded-lg text-sm font-medium hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('commentEditor.addComment.submit')}
            </button>
          </div>
        </div>
      </Popover>
    </>
  );
}
