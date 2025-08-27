'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Globe,
  BookOpen,
  Tag,
  Star,
  DollarSign,
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
  isPublished: boolean;
  featured: boolean;
  isPremium: boolean;
  price?: number;
  fullPdf?: string;
  coverImage?: string;
  authorName: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface EditFormData {
  title: string;
  content: string;
  summary: string;
  language: string;
  category: string[];
  genres: string[];
  subjects: string[];
  tags: string[];
  isPublished: boolean;
  featured: boolean;
  isPremium: boolean;
  price: number;
  coverImage: string;
  fullPdf: string;
}

const availableCategories = ['Fiction', 'Non-Fiction', 'Biography', 'Adventure', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Historical'];
const availableGenres = ['Short Story', 'Novel', 'Poetry', 'Essay', 'Children', 'Young Adult', 'Adult', 'Educational'];
const availableSubjects = ['Love', 'Friendship', 'Family', 'School', 'Adventure', 'Mystery', 'History', 'Science', 'Technology'];
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
];

export default function EditStory({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    content: '',
    summary: '',
    language: 'en',
    category: [],
    genres: [],
    subjects: [],
    tags: [],
    isPublished: false,
    featured: false,
    isPremium: false,
    price: 0,
    coverImage: '',
    fullPdf: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      
      // Populate form data
      setFormData({
        title: data.title || '',
        content: data.content || '',
        summary: data.summary || '',
        language: data.language || 'en',
        category: data.category || [],
        genres: data.genres || [],
        subjects: data.subjects || [],
        tags: data.tags || [],
        isPublished: data.isPublished || false,
        featured: data.featured || false,
        isPremium: data.isPremium || false,
        price: data.price || 0,
        coverImage: data.coverImage || '',
        fullPdf: data.fullPdf || '',
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyId) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update story');

      router.push(`/admin/stories/${storyId}`);
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Failed to update story');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'category' | 'genres' | 'subjects', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleTagsChange = (tagsText: string) => {
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
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
          <p className="text-gray-600 mt-2">The story you're looking for doesn't exist.</p>
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
                onClick={() => router.push(`/admin/stories/${storyId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Story</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {story.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/admin/stories/${storyId}`)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter story title"
                  />
                </div>
                
                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </label>
                  <textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief summary of the story"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    required
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter story content"
                  />
                </div>
              </div>
            </motion.div>

            {/* Categories and Classification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories & Classification</h2>
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleArrayToggle('category', category)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.category.includes(category)
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Genres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleArrayToggle('genres', genre)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.genres.includes(genre)
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subjects
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map(subject => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => handleArrayToggle('subjects', subject)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.subjects.includes(subject)
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publication Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Publication Settings</h2>
              <div className="space-y-4">
                {/* Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Language
                  </label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Published Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Published
                  </label>
                </div>

                {/* Featured Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    <Star className="w-4 h-4 inline mr-1" />
                    Featured
                  </label>
                </div>

                {/* Premium Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={formData.isPremium}
                    onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPremium" className="text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Premium Content
                  </label>
                </div>

                {/* Price */}
                {formData.isPremium && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      id="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Media Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Media & Files</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => handleInputChange('coverImage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <label htmlFor="fullPdf" className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    PDF File URL
                  </label>
                  <input
                    type="url"
                    id="fullPdf"
                    value={formData.fullPdf}
                    onChange={(e) => handleInputChange('fullPdf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/story.pdf"
                  />
                </div>
              </div>
            </motion.div>

            {/* Author Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Author Information</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {story.author.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {story.author.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Story Author Name:</strong> {story.authorName}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}