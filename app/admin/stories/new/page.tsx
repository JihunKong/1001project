'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Save,
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Upload,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const storySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  summary: z.string().optional(),
  language: z.string().min(2, 'Language is required'),
  category: z.string().min(1, 'Category is required'),
  ageGroup: z.string().min(1, 'Age group is required'),
  priority: z.nativeEnum(Priority),
  tags: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type StoryFormData = z.infer<typeof storySchema>;

export default function NewStory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      language: 'en',
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const onSubmit = async (data: StoryFormData) => {
    if (!content.trim()) {
      alert('Content is required');
      return;
    }

    setLoading(true);
    try {
      let coverImageId = null;

      // Upload cover image if provided
      if (coverImage) {
        const formData = new FormData();
        formData.append('file', coverImage);
        formData.append('folder', 'stories/covers');
        formData.append('altText', `Cover image for ${data.title}`);

        const uploadResponse = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload cover image');
        }

        const uploadResult = await uploadResponse.json();
        coverImageId = uploadResult.id;
      }

      // Create story
      const storyData = {
        ...data,
        content,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        coverImageId,
      };

      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error('Failed to create story');
      }

      const result = await response.json();
      router.push(`/admin/stories/${result.id}`);
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const MenuBar = () => {
    if (!editor) return null;

    return (
      <div className="border-b border-gray-200 flex items-center gap-1 p-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive('blockquote') ? 'bg-gray-200' : ''
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-100"
          disabled={!editor.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-100"
          disabled={!editor.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Story</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Add a new story to the platform
                </p>
              </div>
            </div>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter story title..."
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  {...register('summary')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief summary of the story..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language *
                </label>
                <select
                  {...register('language')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ko">Korean</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Education">Education</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Science">Science</option>
                  <option value="Culture">Culture</option>
                  <option value="History">History</option>
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group *
                </label>
                <select
                  {...register('ageGroup')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select age group...</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                  <option value="13-16">13-16 years</option>
                  <option value="17+">17+ years</option>
                </select>
                {errors.ageGroup && (
                  <p className="text-red-600 text-sm mt-1">{errors.ageGroup.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={Priority.LOW}>Low</option>
                  <option value={Priority.MEDIUM}>Medium</option>
                  <option value={Priority.HIGH}>High</option>
                  <option value={Priority.URGENT}>Urgent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  {...register('tags')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas..."
                />
                <p className="text-gray-500 text-sm mt-1">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cover Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Image</h2>
            {coverImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-48 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload cover image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Content Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Story Content *</h2>
            </div>
            <MenuBar />
            <div className="min-h-[400px]">
              <EditorContent
                editor={editor}
                className="prose max-w-none p-6 focus:outline-none"
              />
            </div>
          </motion.div>

          {/* Advanced Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignee
                </label>
                <select
                  {...register('assigneeId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No assignee</option>
                  {/* TODO: Load real users */}
                  <option value="reviewer1">Reviewer A</option>
                  <option value="reviewer2">Reviewer B</option>
                </select>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}