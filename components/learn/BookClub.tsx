'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Eye,
  Tag,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  User,
  Send,
  Reply
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { getBookClubs, createPost, addComment } from '@/lib/api/learning-api';
import type { BookClubDiscussion, BookClubComment } from '@/types/learning';

interface BookClubProps {
  bookId: string;
  bookTitle: string;
}

export function BookClub({ bookId, bookTitle }: BookClubProps) {
  const [discussions, setDiscussions] = useState<BookClubDiscussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<BookClubDiscussion | null>(null);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', tags: '' });
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const { bookClubDiscussions, addBookClubDiscussion } = useLearningStore();

  useEffect(() => {
    loadDiscussions();
  }, [bookId]);

  const loadDiscussions = async () => {
    setIsLoading(true);
    try {
      const response = await getBookClubs(bookId);
      if (response.success && response.data) {
        setDiscussions(response.data.discussions);
        response.data.discussions.forEach(d => addBookClubDiscussion(d));
      }
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title || !newDiscussion.content) {
      alert('Please provide both title and content for your discussion.');
      return;
    }

    setIsLoading(true);
    try {
      const tags = newDiscussion.tags.split(',').map(t => t.trim()).filter(t => t);
      const response = await createPost(
        bookId,
        `${newDiscussion.title}\n\n${newDiscussion.content}`
      );
      
      if (response.success && response.data) {
        setDiscussions([response.data, ...discussions]);
        addBookClubDiscussion(response.data);
        setIsCreatingDiscussion(false);
        setNewDiscussion({ title: '', content: '', tags: '' });
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (discussionId: string) => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const response = await addComment(bookId, discussionId, newComment);
      
      if (response.success && response.data) {
        // Update the discussion with new comment
        const updatedDiscussions = discussions.map(d => {
          if (d.id === discussionId) {
            return {
              ...d,
              comments: [...(d.comments || []), response.data],
            };
          }
          return d;
        });
        setDiscussions(updatedDiscussions);
        
        if (selectedDiscussion?.id === discussionId) {
          setSelectedDiscussion({
            ...selectedDiscussion,
            comments: [...(selectedDiscussion.comments || []), response.data],
          });
        }
        
        setNewComment('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDiscussions = discussions.filter(d => {
    if (searchTerm && !d.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !d.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterTag && !d.tags?.includes(filterTag)) {
      return false;
    }
    return true;
  });

  const allTags = Array.from(new Set(discussions.flatMap(d => d.tags || [])));

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Book Club</h2>
              <p className="text-gray-600">{bookTitle}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreatingDiscussion(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Start Discussion</span>
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Topics</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Create Discussion Modal */}
      <AnimatePresence>
        {isCreatingDiscussion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreatingDiscussion(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Start a New Discussion
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discussion Title
                  </label>
                  <input
                    type="text"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="What's on your mind about this book?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Thoughts
                  </label>
                  <textarea
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={5}
                    placeholder="Share your thoughts, questions, or insights..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newDiscussion.tags}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., character-analysis, themes, favorite-quotes"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreatingDiscussion(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDiscussion}
                  disabled={isLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Discussion'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discussions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Discussions</h3>
          
          {isLoading && discussions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No discussions yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Be the first to start a discussion!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDiscussions.map((discussion) => (
                <motion.div
                  key={discussion.id}
                  layout
                  className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedDiscussion?.id === discussion.id
                      ? 'border-purple-500 shadow-md'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedDiscussion(discussion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 flex-1">
                      {discussion.title}
                    </h4>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {discussion.content}
                  </p>
                  
                  {discussion.tags && discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {discussion.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {discussion.user?.name || 'Anonymous'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(discussion.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {discussion.comments?.length || 0}
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {discussion.likes}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Discussion Detail */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {selectedDiscussion ? (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedDiscussion.title}
              </h3>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {selectedDiscussion.user?.name || 'Anonymous'}
                </span>
                <span>•</span>
                <span>{formatDate(selectedDiscussion.createdAt)}</span>
              </div>
              
              <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                {selectedDiscussion.content}
              </p>
              
              {/* Comments */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Comments ({selectedDiscussion.comments?.length || 0})
                </h4>
                
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {selectedDiscussion.comments?.map((comment) => (
                    <div key={comment.id} className="pl-4 border-l-2 border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {comment.user?.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {comment.content}
                          </p>
                        </div>
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Comment */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(selectedDiscussion.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(selectedDiscussion.id)}
                    disabled={!newComment.trim() || isLoading}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Select a discussion to view details
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* XP Notification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg text-center"
      >
        <p className="text-sm text-gray-700">
          💬 Participate in discussions to earn XP and connect with other readers!
          <span className="block text-xs text-gray-600 mt-1">
            +25 XP for starting a discussion • +10 XP for commenting
          </span>
        </p>
      </motion.div>
    </div>
  );
}