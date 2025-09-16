'use client';

import { motion } from 'framer-motion';
import { 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Send, 
  BookOpen, 
  AlertCircle,
  Calendar,
  MessageCircle
} from 'lucide-react';

interface StatusInfo {
  currentStage: {
    status: string;
    label: string;
    percentage: number;
  };
  allStages: Array<{
    status: string;
    label: string;
    percentage: number;
  }>;
  isComplete: boolean;
  needsAction: boolean;
}

interface Timeline {
  total: number | null;
  remaining: number | null;
}

interface LatestFeedback {
  id: string;
  revisionRound: number;
  customMessage: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string | null;
    role: string;
  };
  template: {
    id: string;
    title: string;
    category: string;
    description: string;
  } | null;
}

interface SubmissionStatusProps {
  submission: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    publishDate?: string;
    progress: StatusInfo;
    timeline: Timeline;
    nextSteps: string[];
    revisionCount: number;
    currentRevision: number;
    hasActionableItems: boolean;
    latestFeedback: LatestFeedback | null;
  };
  onEdit?: () => void;
  onResubmit?: () => void;
}

const statusConfig = {
  'DRAFT': { 
    icon: Edit3, 
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: 'text-gray-600'
  },
  'SUBMITTED': { 
    icon: Send, 
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600'
  },
  'IN_REVIEW': { 
    icon: Eye, 
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600'
  },
  'EDITING': { 
    icon: Edit3, 
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-600'
  },
  'APPROVED': { 
    icon: CheckCircle, 
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: 'text-green-600'
  },
  'PUBLISHED': { 
    icon: BookOpen, 
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    iconColor: 'text-emerald-600'
  },
  'REJECTED': { 
    icon: XCircle, 
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    iconColor: 'text-red-600'
  }
};

export default function SubmissionStatus({ 
  submission, 
  onEdit, 
  onResubmit 
}: SubmissionStatusProps) {
  const config = statusConfig[submission.status as keyof typeof statusConfig];
  const IconComponent = config?.icon || Clock;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${config?.bgColor} rounded-lg flex items-center justify-center`}>
              <IconComponent className={`w-6 h-6 ${config?.iconColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {submission.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className={`px-2 py-1 ${config?.bgColor} ${config?.textColor} rounded-full font-medium`}>
                  {submission.progress.currentStage.label}
                </span>
                <span>Created {formatDaysAgo(submission.createdAt)}</span>
                {submission.revisionCount > 1 && (
                  <span>Revision {submission.currentRevision}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          {submission.hasActionableItems && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Story
                </button>
              )}
              {onResubmit && submission.status === 'EDITING' && (
                <button
                  onClick={onResubmit}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Resubmit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{submission.progress.currentStage.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${submission.progress.currentStage.percentage}%` }}
              className={`h-2 bg-${config?.color}-600 rounded-full`}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Timeline */}
        {submission.timeline.remaining !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {submission.timeline.remaining > 0 
                ? `Estimated ${submission.timeline.remaining} days remaining`
                : 'Timeline completed'
              }
            </span>
          </div>
        )}
      </div>

      {/* Latest Feedback */}
      {submission.latestFeedback && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">
                  Latest Feedback
                  {submission.latestFeedback.template && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({submission.latestFeedback.template.category})
                    </span>
                  )}
                </h3>
                <span className="text-sm text-gray-500">
                  {formatDaysAgo(submission.latestFeedback.createdAt)}
                </span>
              </div>
              
              {submission.latestFeedback.template && (
                <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {submission.latestFeedback.template.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {submission.latestFeedback.template.description}
                  </p>
                </div>
              )}
              
              {submission.latestFeedback.customMessage && (
                <div className="mb-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {submission.latestFeedback.customMessage}
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                From {submission.latestFeedback.reviewer.name || 'Review Team'} 
                ({submission.latestFeedback.reviewer.role})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="p-6">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          {submission.hasActionableItems ? (
            <AlertCircle className="w-5 h-5 text-orange-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          {submission.hasActionableItems ? 'Action Required' : 'Next Steps'}
        </h3>
        
        <ul className="space-y-2">
          {submission.nextSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}