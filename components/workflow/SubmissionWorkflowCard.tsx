'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  User, 
  Clock, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  Tag,
  Globe
} from 'lucide-react';

interface SubmissionWorkflowCardProps {
  submission: {
    id: string;
    title: string;
    authorAlias: string;
    language: string;
    status: string;
    priority: string;
    ageRange?: string;
    category: string[];
    tags: string[];
    summary: string;
    createdAt: string;
    updatedAt: string;
    reviewNotes?: string;
    author: {
      name: string;
      email: string;
    };
    reviewer?: {
      name: string;
    };
    assignee?: {
      name: string;
    };
  };
  userRole: string;
  onStatusUpdate: (submissionId: string, newStatus: string, notes?: string) => void;
  onAssign?: (submissionId: string, assigneeId: string) => void;
}

export default function SubmissionWorkflowCard({ 
  submission, 
  userRole, 
  onStatusUpdate,
  onAssign 
}: SubmissionWorkflowCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(submission.reviewNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      IN_REVIEW: 'bg-yellow-100 text-yellow-700',
      EDITING: 'bg-purple-100 text-purple-700',
      APPROVED: 'bg-green-100 text-green-700',
      PUBLISHED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getAvailableStatusTransitions = () => {
    const transitions: Record<string, Record<string, string[]>> = {
      EDITOR: {
        SUBMITTED: ['IN_REVIEW', 'REJECTED'],
        IN_REVIEW: ['EDITING', 'APPROVED', 'REJECTED'],
        EDITING: ['IN_REVIEW', 'APPROVED', 'REJECTED']
      },
      PUBLISHER: {
        APPROVED: ['PUBLISHED', 'REJECTED'],
        EDITING: ['APPROVED', 'REJECTED']
      },
      ADMIN: {
        SUBMITTED: ['IN_REVIEW', 'REJECTED'],
        IN_REVIEW: ['EDITING', 'APPROVED', 'REJECTED'],
        EDITING: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
        APPROVED: ['PUBLISHED', 'REJECTED']
      }
    };
    
    return transitions[userRole]?.[submission.status] || [];
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(submission.id, newStatus, reviewNotes);
    } finally {
      setIsUpdating(false);
    }
  };

  const availableTransitions = getAvailableStatusTransitions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {submission.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{submission.authorAlias}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>{submission.language.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
            {submission.status.replace('_', ' ')}
          </span>
          <span className={`text-xs font-medium ${getPriorityColor(submission.priority)}`}>
            {submission.priority}
          </span>
        </div>
      </div>

      {/* Categories and Summary */}
      <div className="mb-4">
        {submission.category.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {submission.category.map((cat) => (
              <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {cat}
              </span>
            ))}
          </div>
        )}
        
        <p className="text-gray-700 text-sm line-clamp-2">
          {submission.summary}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showDetails ? 'Hide' : 'View'} Details
        </button>
        
        {availableTransitions.length > 0 && (
          <div className="flex gap-1">
            {availableTransitions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={isUpdating}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  status === 'APPROVED' || status === 'PUBLISHED'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : status === 'REJECTED'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Extended Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 pt-4"
        >
          <div className="space-y-3">
            {submission.ageRange && (
              <div>
                <span className="text-sm font-medium text-gray-700">Age Range: </span>
                <span className="text-sm text-gray-600">{submission.ageRange}</span>
              </div>
            )}
            
            {submission.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Tags: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {submission.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {submission.reviewer && (
              <div>
                <span className="text-sm font-medium text-gray-700">Reviewer: </span>
                <span className="text-sm text-gray-600">{submission.reviewer.name}</span>
              </div>
            )}
            
            {submission.assignee && (
              <div>
                <span className="text-sm font-medium text-gray-700">Assigned to: </span>
                <span className="text-sm text-gray-600">{submission.assignee.name}</span>
              </div>
            )}
            
            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Notes:
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Add review notes or feedback..."
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}