'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import DOMPurify from 'dompurify';
import { Bold, Italic, List, ListOrdered, Type } from 'lucide-react';
import { useEffect } from 'react';

interface WriterTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onAutoSave?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function WriterTextEditor({
  content = '',
  onChange,
  onAutoSave,
  placeholder = '이곳에 당신의 이야기를 써주세요... 😊',
  className = ''
}: WriterTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      CharacterCount.configure({
        limit: null,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        const sanitizedHtml = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li'],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true
        });
        onChange(sanitizedHtml);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6',
        style: 'font-size: 18px; line-height: 1.8;'
      },
    },
  });

  useEffect(() => {
    if (!editor || !onAutoSave) return;

    const autoSaveInterval = setInterval(() => {
      const html = editor.getHTML();
      if (html && html !== '<p></p>') {
        onAutoSave(html);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [editor, onAutoSave]);

  if (!editor) {
    return (
      <div className={`border-2 border-blue-200 rounded-xl overflow-hidden ${className}`}>
        <div className="p-6 min-h-[400px] bg-blue-50 flex items-center justify-center">
          <div className="text-blue-400 text-lg">에디터를 준비하고 있어요...</div>
        </div>
      </div>
    );
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  const getEncouragementMessage = () => {
    if (wordCount === 0) return '첫 단어를 써보세요! 💫';
    if (wordCount < 10) return '좋아요! 계속 써보세요! ✨';
    if (wordCount < 50) return `멋져요! ${wordCount}개의 단어를 썼어요! 🌟`;
    if (wordCount < 100) return `대단해요! ${wordCount}개의 단어예요! 🎉`;
    if (wordCount < 200) return `훌륭해요! ${wordCount}개나 썼어요! 🏆`;
    return `놀라워요! ${wordCount}개의 단어! 당신은 진짜 작가예요! 📚`;
  };

  return (
    <div className={`border-2 border-blue-300 rounded-xl overflow-hidden bg-white shadow-md ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200 p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2.5 rounded-lg transition-all ${
              editor.isActive('bold')
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
            title="굵게"
          >
            <Bold className="h-5 w-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2.5 rounded-lg transition-all ${
              editor.isActive('italic')
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
            title="기울이기"
          >
            <Italic className="h-5 w-5" />
          </button>

          <div className="w-px bg-blue-300" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2.5 rounded-lg transition-all ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-purple-100'
            }`}
            title="제목"
          >
            <Type className="h-5 w-5" />
          </button>

          <div className="w-px bg-blue-300" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2.5 rounded-lg transition-all ${
              editor.isActive('bulletList')
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-green-100'
            }`}
            title="목록"
          >
            <List className="h-5 w-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2.5 rounded-lg transition-all ${
              editor.isActive('orderedList')
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-green-100'
            }`}
            title="번호 목록"
          >
            <ListOrdered className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-blue-700 font-medium">
            {getEncouragementMessage()}
          </div>
          <div className="text-gray-600">
            {characterCount}자 · {wordCount}단어
          </div>
        </div>
      </div>

      <EditorContent
        editor={editor}
        className="bg-white"
        style={{ fontSize: '18px' }}
      />
    </div>
  );
}
