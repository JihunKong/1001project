'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  User,
  Calendar,
  Tag,
  Globe,
  BookOpen,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  MoreVertical,
  Upload,
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  content: string;
  summary?: string;
  language: string;
  category: string[];
  genres?: string[];
  subjects?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedDate?: string;
  isPublished: boolean;
  featured: boolean;
  isPremium: boolean;
  fullPdf?: string;
  coverImage?: string;
  authorName: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  viewCount: number;
  likeCount: number;
  rating?: number;
}

const publicationConfig = {
  true: { label: 'Published', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  false: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
};

const featuredConfig = {
  true: { label: 'Featured', color: 'bg-yellow-100 text-yellow-800' },
  false: { label: 'Regular', color: 'bg-gray-100 text-gray-800' },
};

export default function StoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setStoryId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  const fetchStory = async () => {
    if (!storyId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stories/${storyId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/admin/stories');
          return;
        }
        throw new Error('Failed to fetch story');
      }
      const data = await response.json();
      setStory(data);
    } catch (error) {
      console.error('Error fetching story:', error);
      alert('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const handleDelete = async () => {
    if (!story || !storyId || !confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete story');

      router.push('/admin/stories');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  const handlePublicationToggle = async () => {
    if (!story || !storyId) return;

    const newPublishedState = !story.isPublished;
    const confirmMessage = newPublishedState 
      ? 'Are you sure you want to publish this story? It will be visible to all users in the library.'
      : 'Are you sure you want to unpublish this story? It will be removed from the library.';

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: newPublishedState,
        }),
      });

      if (!response.ok) throw new Error('Failed to update publication status');

      // Refresh the story data
      await fetchStory();
    } catch (error) {
      console.error('Error updating publication status:', error);
      alert('Failed to update publication status');
    }
  };

  const handleTogglePublication = async () => {
    if (!story || !storyId) return;

    const action = story.isPublished ? 'unpublish' : 'publish';
    const confirmMessage = story.isPublished 
      ? 'Are you sure you want to unpublish this story? It will be removed from the library.'
      : 'Are you sure you want to publish this story? It will be visible to all users in the library.';

    if (!confirm(confirmMessage)) return;

    try {
      const apiEndpoint = story.isPublished 
        ? '/api/admin/stories/bulk-unpublish'
        : '/api/admin/stories/bulk-publish';
      
      const requestBody = story.isPublished
        ? { storyIds: [storyId], unpublishAll: false }
        : { storyIds: [storyId], publishAll: false };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Failed to ${action} story`);

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        // Refresh the story data
        await fetchStory();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(`Error ${action}ing story:`, error);
      alert(`Failed to ${action} story`);
    }
  };

  const handleExport = async () => {
    if (!story || !storyId) return;

    try {
      const response = await fetch(`/api/admin/stories/${storyId}/export`);
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting story:', error);
      alert('Failed to export story');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Story not found</h2>
          <p className="text-gray-600 mt-2">The story you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/admin/stories')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Stories
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/stories')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{story.title}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  by {story.author.name} • {new Date(story.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                story.isPublished 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {story.isPublished ? 'Published' : 'Draft'}
              </span>
              {/* Featured Status */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  story.featured
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {story.featured ? '⭐ Featured' : '📄 Regular'}
                </span>
                <button
                  onClick={handlePublicationToggle}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    story.isPublished
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  <Upload className="w-3 h-3 mr-1 inline" />
                  {story.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <button
                      onClick={() => router.push(`/admin/stories/${storyId}/edit`)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Story
                    </button>
                    <button
                      onClick={handleExport}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Story
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {story.coverImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-64 object-cover"
                />
              </motion.div>
            )}

            {/* Summary */}
            {story.summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
                <p className="text-gray-700 leading-relaxed">{story.summary}</p>
              </motion.div>
            )}

            {/* Story Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Story Content</h2>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
            </motion.div>

            {/* Additional Info */}
            {story.genres && story.genres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {story.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Story Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Story Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{story.authorName}</div>
                    <div className="text-sm text-gray-500">{story.author.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{story.category.join(', ')}</div>
                    <div className="text-sm text-gray-500">Categories</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{story.language.toUpperCase()}</div>
                    <div className="text-sm text-gray-500">Language</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{story.viewCount}</div>
                    <div className="text-sm text-gray-500">Views</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Publication & Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Publication Status</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {story.isPublished ? 'Published' : 'Draft'}
                    </div>
                    <div className="text-sm text-gray-500">Publication Status</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {story.featured ? 'Featured' : 'Regular'}
                    </div>
                    <div className="text-sm text-gray-500">Story Type</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {story.publishedDate ? new Date(story.publishedDate).toLocaleDateString() : 'Not published'}
                    </div>
                    <div className="text-sm text-gray-500">Published Date</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tags */}
            {story.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Story Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Story Metrics</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">{story.viewCount}</div>
                    <div className="text-sm text-gray-500">Total Views</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900">{story.likeCount}</div>
                    <div className="text-sm text-gray-500">Likes</div>
                  </div>
                </div>
                {story.rating && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 text-yellow-500">⭐</div>
                    <div>
                      <div className="font-medium text-gray-900">{story.rating.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">Rating</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}