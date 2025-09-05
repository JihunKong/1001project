'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Upload,
  RefreshCw,
  BarChart,
  Calendar,
  Zap
} from 'lucide-react';

interface PublicationStats {
  totalStories: number;
  publishedStories: number;
  unpublishedWithPdf: number;
  unpublishedWithoutPdf: number;
  readyToPublish: number;
}

interface UnpublishedStory {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
  isPremium: boolean;
  status: string;
}

interface BulkPublishResponse {
  success: boolean;
  message: string;
  publishedCount: number;
  stories: Array<{
    id: string;
    title: string;
    authorName: string;
    publishedDate: string;
    isPremium: boolean;
  }>;
}

export default function BulkPublishingPanel() {
  const [stats, setStats] = useState<PublicationStats | null>(null);
  const [unpublishedStories, setUnpublishedStories] = useState<UnpublishedStory[]>([]);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stories/bulk-publish');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data.statistics);
      setUnpublishedStories(data.unpublishedStories || []);
    } catch (error) {
      console.error('Error fetching publication stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPublish = async (publishAll: boolean = false) => {
    if (!publishAll && selectedStories.length === 0) {
      alert('Please select stories to publish');
      return;
    }

    const confirmMessage = publishAll 
      ? `Are you sure you want to publish ALL ${stats?.readyToPublish || 0} unpublished stories?`
      : `Are you sure you want to publish ${selectedStories.length} selected stories?`;

    if (!confirm(confirmMessage)) return;

    try {
      setPublishing(true);
      const response = await fetch('/api/admin/stories/bulk-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyIds: publishAll ? [] : selectedStories,
          publishAll
        }),
      });

      if (!response.ok) throw new Error('Bulk publish failed');
      
      const data: BulkPublishResponse = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedStories([]);
        await fetchStats(); // Refresh stats
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error during bulk publish:', error);
      alert('Failed to publish stories. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStories(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const selectAllStories = () => {
    if (selectedStories.length === unpublishedStories.length) {
      setSelectedStories([]);
    } else {
      setSelectedStories(unpublishedStories.map(story => story.id));
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Publication Management</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading publication stats...</span>
        </div>
      </div>
    );
  }

  const publishedPercentage = stats ? Math.round((stats.publishedStories / stats.totalStories) * 100) : 0;
  const hasUnpublished = (stats?.readyToPublish || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Publication Overview</h2>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalStories || 0}</div>
            <div className="text-sm text-gray-600">Total Stories</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats?.publishedStories || 0}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats?.readyToPublish || 0}</div>
            <div className="text-sm text-gray-600">Ready to Publish</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats?.unpublishedWithoutPdf || 0}</div>
            <div className="text-sm text-gray-600">Missing PDFs</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Publication Progress</span>
            <span className="text-sm text-gray-600">{publishedPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${publishedPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              {stats?.publishedStories || 0} Published
            </div>
            {hasUnpublished && (
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                {stats?.readyToPublish || 0} Awaiting Publication
              </div>
            )}
          </div>
          
          {hasUnpublished && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Bulk Actions */}
      {hasUnpublished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleBulkPublish(true)}
              disabled={publishing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              {publishing ? 'Publishing...' : `Publish All Ready (${stats?.readyToPublish})`}
            </button>
            
            <button
              onClick={() => handleBulkPublish(false)}
              disabled={publishing || selectedStories.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {publishing ? 'Publishing...' : `Publish Selected (${selectedStories.length})`}
            </button>
          </div>
          
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Publication Impact</p>
                <p className="text-sm text-yellow-700">
                  Published stories will be immediately visible to all users in the library. 
                  Ensure content is ready for public viewing.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detailed Story List */}
      {hasUnpublished && showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Unpublished Stories ({unpublishedStories.length})
            </h3>
            <button
              onClick={selectAllStories}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {selectedStories.length === unpublishedStories.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="space-y-2">
            {unpublishedStories.map((story) => (
              <div
                key={story.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedStories.includes(story.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleStorySelection(story.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedStories.includes(story.id)}
                  onChange={() => toggleStorySelection(story.id)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{story.title}</h4>
                    {story.isPremium && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    by {story.authorName} • {new Date(story.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {story.status || 'DRAFT'}
                  </span>
                  <BookOpen className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Unpublished Stories */}
      {!hasUnpublished && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-8 text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Stories Published!</h3>
          <p className="text-gray-600">
            All stories with PDF files have been published and are visible in the library.
          </p>
          {(stats?.unpublishedWithoutPdf || 0) > 0 && (
            <p className="text-sm text-yellow-600 mt-2">
              {stats?.unpublishedWithoutPdf} stories are waiting for PDF files to be uploaded.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}