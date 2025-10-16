'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Minus
} from 'lucide-react';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your story...',
  className = '',
  readOnly = false
}: RichTextEditorProps) {
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
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        // Sanitize HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'hr'],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true
        });
        onChange(sanitizedHtml);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-base max-w-none focus:outline-none text-[#141414] ${
          readOnly ? 'prose-gray' : ''
        }`,
        style: 'font-family: "Helvetica Neue", -apple-system, system-ui, sans-serif; font-size: 16px; line-height: 1.193; font-weight: 400;',
      },
    },
  });

  const setHeading = useCallback((level: 1 | 2 | 3) => {
    if (editor) {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  }, [editor]);

  const setParagraph = useCallback(() => {
    if (editor) {
      editor.chain().focus().setParagraph().run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="p-4 min-h-[400px] bg-white flex items-center justify-center">
          <div className="text-gray-400">Loading editor...</div>
        </div>
      </div>
    );
  }

  if (readOnly) {
    // Sanitize content for read-only display
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'hr'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });

    return (
      <div
        className={`prose prose-base max-w-none text-[#141414] ${className}`}
        style={{ fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif', fontSize: '16px', lineHeight: '1.193', fontWeight: '400' }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }

  return (
    <div className={`border border-[#E5E5EA] rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E5EA] p-2 flex flex-wrap items-center gap-1 overflow-x-auto">
        {/* Text Formatting */}
        <div className="flex items-center border-r border-[#E5E5EA] pr-2 mr-2 flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('strike') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Strikethrough"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center border-r border-[#E5E5EA] pr-2 mr-2 flex-shrink-0">
          <button
            onClick={setParagraph}
            className={`px-3 py-2 text-sm rounded hover:bg-gray-200 ${
              editor.isActive('paragraph') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Paragraph"
          >
            P
          </button>
          <button
            onClick={() => setHeading(1)}
            className={`px-3 py-2 text-sm rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => setHeading(2)}
            className={`px-3 py-2 text-sm rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => setHeading(3)}
            className={`px-3 py-2 text-sm rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center border-r border-[#E5E5EA] pr-2 mr-2 flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        {/* Quote and Separator */}
        <div className="flex items-center border-r border-[#E5E5EA] pr-2 mr-2 flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-gray-200 text-[#141414]' : 'text-[#8E8E93]'
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-gray-200 text-[#8E8E93]"
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center ml-auto flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 text-[#8E8E93] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 text-[#8E8E93] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[400px] bg-white max-w-full overflow-hidden relative editor-container">
        {editor.isEmpty && !editor.isFocused && (
          <div className="absolute inset-4 pointer-events-none text-gray-400 z-10">
            {placeholder}
          </div>
        )}
        <EditorContent
          editor={editor}
          className="focus-within:outline-none max-w-full break-words overflow-x-hidden"
        />
      </div>

      {/* Character Count */}
      <div className="bg-[#F9FAFB] border-t border-[#E5E5EA] px-4 py-2 text-sm text-[#8E8E93] flex justify-end">
        <div className="flex items-center space-x-4 text-xs sm:text-sm">
          <span>
            {editor.storage.characterCount ? editor.storage.characterCount.characters() : 0} characters
          </span>
          <span>
            {editor.storage.characterCount ? editor.storage.characterCount.words() : 0} words
          </span>
        </div>
      </div>
    </div>
  );
}