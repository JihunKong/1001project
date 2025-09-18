'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Save,
  Send,
  Clock,
  FileText,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

interface StoryEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialChapters?: Chapter[];
  onSave?: (data: { title: string; content: string; chapters: Chapter[] }) => Promise<void>;
  onSubmit?: (data: { title: string; content: string; chapters: Chapter[] }) => Promise<void>;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  initialTitle = '',
  initialContent = '',
  initialChapters = [],
  onSave,
  onSubmit,
  autoSaveEnabled = true,
  autoSaveInterval = 30000, // 30 seconds
  className = '',
  placeholder = 'Start writing your story...',
  maxLength = 50000
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [chapters, setChapters] = useState<Chapter[]>(
    initialChapters.length > 0 ? initialChapters : [
      { id: '1', title: 'Chapter 1', content: initialContent, wordCount: 0 }
    ]
  );
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: chapters[activeChapter]?.content || '',
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const newChapters = [...chapters];
      newChapters[activeChapter] = {
        ...newChapters[activeChapter],
        content,
        wordCount: countWords(content)
      };
      setChapters(newChapters);
      setHasUnsavedChanges(true);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
        'data-placeholder': placeholder,
      },
    },
  });

  // Update editor content when active chapter changes
  useEffect(() => {
    if (editor && chapters[activeChapter]) {
      editor.commands.setContent(chapters[activeChapter].content);
    }
  }, [activeChapter, editor]);

  // Count words in text
  const countWords = useCallback((text: string): number => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return 0;
    return plainText.split(/\s+/).length;
  }, []);

  // Calculate total word count
  const totalWordCount = useMemo(() => {
    return chapters.reduce((total, chapter) => total + chapter.wordCount, 0);
  }, [chapters]);

  // Calculate estimated reading time (200 words per minute)
  const estimatedReadingTime = useMemo(() => {
    const minutes = Math.ceil(totalWordCount / 200);
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 1 && remainingMinutes === 0) return '1 hour';
    if (remainingMinutes === 0) return `${hours} hours`;
    return `${hours}h ${remainingMinutes}m`;
  }, [totalWordCount]);

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave({ title, content: chapters[activeChapter]?.content || '', chapters });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Story saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save story');
    } finally {
      setIsSaving(false);
    }
  }, [title, chapters, activeChapter, onSave, isSaving]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSaveEnabled, hasUnsavedChanges, autoSaveInterval, handleSave]);

  // Handle submit for review
  const handleSubmit = useCallback(async () => {
    if (!onSubmit || isSaving) return;

    if (!title.trim()) {
      toast.error('Please add a title to your story');
      return;
    }

    if (totalWordCount < 50) {
      toast.error('Story must be at least 50 words long');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({ title, content: chapters[activeChapter]?.content || '', chapters });
      toast.success('Story submitted for review');
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Failed to submit story');
    } finally {
      setIsSaving(false);
    }
  }, [title, chapters, activeChapter, totalWordCount, onSubmit, isSaving]);

  // Add new chapter
  const addChapter = useCallback(() => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${chapters.length + 1}`,
      content: '',
      wordCount: 0
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(chapters.length);
  }, [chapters]);

  // Remove chapter
  const removeChapter = useCallback((index: number) => {
    if (chapters.length <= 1) {
      toast.error('Cannot remove the last chapter');
      return;
    }
    
    const newChapters = chapters.filter((_, i) => i !== index);
    setChapters(newChapters);
    
    if (activeChapter >= newChapters.length) {
      setActiveChapter(newChapters.length - 1);
    } else if (activeChapter > index) {
      setActiveChapter(activeChapter - 1);
    }
  }, [chapters, activeChapter]);

  // Update chapter title
  const updateChapterTitle = useCallback((index: number, newTitle: string) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], title: newTitle };
    setChapters(newChapters);
    setHasUnsavedChanges(true);
  }, [chapters]);

  if (!editor) {
    return <div className="flex items-center justify-center h-64">Loading editor...</div>;
  }

  return (
    <div className={`max-w-6xl mx-auto bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Enter your story title..."
              className="text-2xl font-bold w-full border-none outline-none focus:ring-0 p-0"
              maxLength={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {totalWordCount} words
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {estimatedReadingTime} read
          </div>
          {lastSaved && (
            <div className="text-green-600">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          {hasUnsavedChanges && (
            <div className="text-orange-600">Unsaved changes</div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Chapter Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Chapters</h3>
              <Button variant="ghost" size="sm" onClick={addChapter}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeChapter === index
                      ? 'bg-blue-100 border-blue-200 border'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveChapter(index)}
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => updateChapterTitle(index, e.target.value)}
                      className="font-medium text-sm bg-transparent border-none outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {chapters.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChapter(index);
                        }}
                        className="ml-2 p-1 h-6 w-6"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {chapter.wordCount} words
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1">
          {!isPreviewMode && (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-200 bg-gray-50">
                <Button
                  variant={editor.isActive('bold') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('italic') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <Heading3 className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
              </div>

              {/* Editor */}
              <div className="min-h-[500px]">
                <EditorContent editor={editor} />
              </div>
            </>
          )}

          {/* Preview Mode */}
          {isPreviewMode && (
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-6">{title || 'Untitled Story'}</h1>
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">{chapter.title}</h2>
                  <div 
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none"
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500">
            Character limit: {totalWordCount * 5}/{maxLength} characters (estimated)
          </div>
          <div className="flex gap-2">
            {onSave && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
            {onSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={isSaving || totalWordCount < 50}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSaving ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEditor;