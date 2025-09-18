'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Star,
  Loader2,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface SubmissionData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  revisionCount: number;
  latestFeedback?: {
    customMessage?: string;
    reviewer?: {
      name: string;
      role: string;
    };
    createdAt: string;
  };
}

interface UserSubmissions {
  submissions: SubmissionData[];
  stats: {
    total: number;
    draft: number;
    submitted: number;
    in_review: number;
    editing: number;
    approved: number;
    published: number;
    rejected: number;
  };
}

interface MyStoriesCardProps {
  maxItems?: number;
  showStats?: boolean;
  className?: string;
}

export default function MyStoriesCard({ 
  maxItems = 3, 
  showStats = true, 
  className = '' 
}: MyStoriesCardProps) {
  const [submissions, setSubmissions] = useState<UserSubmissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/writer/submissions');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSubmissions(result.data);
        } else {
          setError('Failed to load stories');
        }
      } else {
        setError('Failed to load stories');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-700';
      case 'EDITING': return 'bg-orange-100 text-orange-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'PUBLISHED': return 'bg-purple-100 text-purple-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return Clock;
      case 'IN_REVIEW': return Eye;
      case 'EDITING': return AlertCircle;
      case 'APPROVED': return CheckCircle;
      case 'PUBLISHED': return Star;
      case 'REJECTED': return AlertCircle;
      default: return BookOpen;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Saved as draft';
      case 'SUBMITTED': return 'Waiting for review';
      case 'IN_REVIEW': return 'Being reviewed';
      case 'EDITING': return 'Needs revision';
      case 'APPROVED': return 'Approved for publishing';
      case 'PUBLISHED': return 'Published and live';
      case 'REJECTED': return 'Needs revision';
      default: return status.toLowerCase().replace('_', ' ');
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const displaySubmissions = submissions?.submissions.slice(0, maxItems) || [];
  const hasMore = (submissions?.submissions.length || 0) > maxItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">My Stories</h3>
        <Link
          href="/dashboard/learner/submit"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          Write New <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {displaySubmissions.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900 mb-2">No stories yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Start writing your first story and share it with the world!
          </p>
          <Link
            href="/dashboard/learner/submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Write Your First Story
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySubmissions.map((submission, index) => {
            const StatusIcon = getStatusIcon(submission.status);
            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1 mr-2">
                    {submission.title}
                  </h4>
                  <StatusIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {getStatusMessage(submission.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {submission.wordCount} words
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {submission.revisionCount > 0 && (
                      <span className="mr-2">Rev. {submission.revisionCount}</span>
                    )}
                    {new Date(submission.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {submission.latestFeedback && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                    <p className="text-blue-800 font-medium mb-1">Latest feedback:</p>
                    <p className="text-blue-700 line-clamp-2">
                      {submission.latestFeedback.customMessage || 'Under review'}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
          
          {hasMore && (
            <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
              +{(submissions?.submissions.length || 0) - maxItems} more stories
            </p>
          )}
        </div>
      )}
      
      {/* Quick Stats */}
      {showStats && submissions && submissions.stats.total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{submissions.stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-600">{submissions.stats.in_review + submissions.stats.submitted}</p>
              <p className="text-xs text-gray-500">In Review</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{submissions.stats.published}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}