'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { UserRole, StorySubmissionStatus } from '@prisma/client';
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
} from 'lucide-react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Story {
  id: string;
  title: string;
  content: string;
  summary?: string;
  language: string;
  category: string;
  ageGroup: string;
  status: StorySubmissionStatus;
  priority?: Priority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  reviewNotes?: string;
  editorialNotes?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  coverImage?: {
    id: string;
    url: string;
    thumbnailUrl: string;
    altText?: string;
  };
  workflowHistory: Array<{
    id: string;
    fromStatus?: StorySubmissionStatus;
    toStatus: StorySubmissionStatus;
    comment: string;
    createdAt: string;
    performedBy: {
      id: string;
      name: string;
    };
  }>;
}

const statusConfig = {
  SUBMITTED: { label: 'Submitted', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_REVIEW: { label: 'In Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
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

  const handleStatusChange = async (newStatus: StorySubmissionStatus) => {
    if (!story || !storyId) return;

    try {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh the story data
      await fetchStory();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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

  const statusInfo = statusConfig[story.status];
  const priorityInfo = story.priority ? priorityConfig[story.priority] : null;
  const StatusIcon = statusInfo.icon;

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
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 inline mr-1" />
                {statusInfo.label}
              </span>
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
                  src={story.coverImage.url}
                  alt={story.coverImage.altText || story.title}
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

            {/* Review Notes */}
            {(story.reviewNotes || story.editorialNotes) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                {story.reviewNotes && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Review Notes</h3>
                    <p className="text-gray-700">{story.reviewNotes}</p>
                  </div>
                )}
                {story.editorialNotes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Editorial Notes</h3>
                    <p className="text-gray-700">{story.editorialNotes}</p>
                  </div>
                )}
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
                    <div className="font-medium text-gray-900">{story.author.name}</div>
                    <div className="text-sm text-gray-500">{story.author.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{story.category}</div>
                    <div className="text-sm text-gray-500">Category</div>
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
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{story.ageGroup}</div>
                    <div className="text-sm text-gray-500">Age Group</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Priority & Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Priority</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <select
                    value={story.status}
                    onChange={(e) => handleStatusChange(e.target.value as StorySubmissionStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                {priorityInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </span>
                  </div>
                )}
                {story.dueDate && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(story.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">Due Date</div>
                    </div>
                  </div>
                )}
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

            {/* Workflow History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow History</h2>
              <div className="space-y-3">
                {story.workflowHistory.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.fromStatus && `${statusConfig[entry.fromStatus].label} → `}
                        {statusConfig[entry.toStatus].label}
                      </p>
                      <p className="text-sm text-gray-500">{entry.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {entry.performedBy.name} • {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}