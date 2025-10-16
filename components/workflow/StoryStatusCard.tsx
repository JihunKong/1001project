'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Hash,
  ArrowRight,
  ExternalLink,
  Share2,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TextSubmissionStatus } from '@prisma/client';

interface StoryStatusCardProps {
  story: {
    id: string;
    title: string;
    authorAlias: string | null;
    summary: string;
    status: TextSubmissionStatus | string;
    wordCount?: number | null;
    category: string[];
    tags: string[];
    language?: string;
    ageRange?: string | null;
    storyFeedback?: string | null;
    bookDecision?: string | null;
    finalNotes?: string | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onContinueWriting?: (id: string) => void;
  onViewFeedback?: (id: string) => void;
  onShare?: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export default function StoryStatusCard({
  story,
  onView,
  onEdit,
  onDelete,
  onContinueWriting,
  onViewFeedback,
  onShare,
  isLoading = false,
  error = null,
  className = ''
}: StoryStatusCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          color: 'bg-soe-purple-100 text-soe-purple-800 border-soe-purple-300',
          icon: Edit,
          label: 'Draft',
          description: 'Continue writing your story',
          progress: 10,
          ctaText: 'Continue Writing',
          ctaAction: 'continue'
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: Clock,
          label: 'Pending Review',
          description: 'Waiting for editorial review',
          progress: 25,
          ctaText: 'View Status',
          ctaAction: 'view'
        };
      case 'STORY_REVIEW':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: FileText,
          label: 'Under Review',
          description: 'Being reviewed by story manager',
          progress: 40,
          ctaText: 'Track Progress',
          ctaAction: 'view'
        };
      case 'NEEDS_REVISION':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: AlertCircle,
          label: 'Needs Revision',
          description: 'Please review feedback and update',
          progress: 35,
          ctaText: 'View Feedback',
          ctaAction: 'feedback'
        };
      case 'STORY_APPROVED':
        return {
          color: 'bg-soe-green-100 text-soe-green-800 border-soe-green-300',
          icon: CheckCircle,
          label: 'Story Approved',
          description: 'Moving to format review',
          progress: 60,
          ctaText: 'View Next Steps',
          ctaAction: 'view'
        };
      case 'FORMAT_REVIEW':
        return {
          color: 'bg-soe-purple-100 text-soe-purple-800 border-soe-purple-300',
          icon: FileText,
          label: 'Format Review',
          description: 'Publication format being decided',
          progress: 75,
          ctaText: 'Track Progress',
          ctaAction: 'view'
        };
      case 'CONTENT_REVIEW':
        return {
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: FileText,
          label: 'Final Review',
          description: 'Final approval in progress',
          progress: 90,
          ctaText: 'Almost There!',
          ctaAction: 'view'
        };
      case 'APPROVED':
        return {
          color: 'bg-soe-green-100 text-soe-green-800 border-soe-green-300',
          icon: CheckCircle,
          label: 'Approved',
          description: 'Ready for publication',
          progress: 95,
          ctaText: 'View Details',
          ctaAction: 'view'
        };
      case 'PUBLISHED':
        return {
          color: 'bg-gradient-to-r from-soe-green-100 to-soe-yellow-100 text-soe-green-800 border-soe-green-300',
          icon: CheckCircle,
          label: 'Published',
          description: 'Live in the library!',
          progress: 100,
          ctaText: 'Share Your Story',
          ctaAction: 'share'
        };
      case 'REJECTED':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: XCircle,
          label: 'Rejected',
          description: 'Unfortunately not approved',
          progress: 0,
          ctaText: 'Start New Story',
          ctaAction: 'new'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: FileText,
          label: status,
          description: 'Status update',
          progress: 0,
          ctaText: 'View Details',
          ctaAction: 'view'
        };
    }
  };

  const statusConfig = getStatusConfig(story.status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasFeedback = story.storyFeedback || story.bookDecision || story.finalNotes;

  const handleAction = async (action: string) => {
    if (isLoading) return;

    setActionLoading(action);
    try {
      switch (action) {
        case 'continue':
          onContinueWriting?.(story.id);
          break;
        case 'feedback':
          onViewFeedback?.(story.id);
          break;
        case 'share':
          onShare?.(story.id);
          break;
        case 'view':
          onView?.(story.id);
          break;
        default:
          onView?.(story.id);
      }
    } finally {
      setTimeout(() => setActionLoading(null), 500);
    }
  };

  const renderProgressBar = () => {
    if (statusConfig.progress === undefined) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-medium">{statusConfig.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5" role="progressbar" aria-valuenow={statusConfig.progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="bg-gradient-to-r from-soe-green-400 to-soe-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${statusConfig.progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderCallToAction = () => {
    if (!statusConfig.ctaText || !statusConfig.ctaAction) return null;

    const isCtaLoading = actionLoading === statusConfig.ctaAction;
    const baseClasses = "min-w-touch min-h-touch flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2";

    let ctaClasses = baseClasses;
    let icon = <ArrowRight className="w-4 h-4 ml-2" />;

    switch (statusConfig.ctaAction) {
      case 'continue':
        ctaClasses += " bg-gradient-to-r from-soe-purple-500 to-soe-purple-600 hover:from-soe-purple-600 hover:to-soe-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-soe-purple-300";
        icon = <Edit className="w-4 h-4 ml-2" />;
        break;
      case 'feedback':
        ctaClasses += " bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl focus:ring-orange-300";
        icon = <MessageSquare className="w-4 h-4 ml-2" />;
        break;
      case 'share':
        ctaClasses += " bg-gradient-to-r from-soe-green-500 to-soe-green-600 hover:from-soe-green-600 hover:to-soe-green-700 text-white shadow-lg hover:shadow-xl focus:ring-soe-green-300";
        icon = <Share2 className="w-4 h-4 ml-2" />;
        break;
      default:
        ctaClasses += " bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 shadow-md hover:shadow-lg focus:ring-gray-300";
        icon = <ExternalLink className="w-4 h-4 ml-2" />;
    }

    return (
      <button
        onClick={() => handleAction(statusConfig.ctaAction)}
        disabled={isLoading || isCtaLoading}
        className={ctaClasses}
        aria-label={`${statusConfig.ctaText} for story: ${story.title}`}
      >
        {isCtaLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {statusConfig.ctaText}
            {icon}
          </>
        )}
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${isLoading ? 'opacity-75' : ''} ${className}`}>
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 rounded-t-xl">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-bold text-gray-900 truncate mb-2" id={`story-title-${story.id}`}>
              {story.title}
            </h3>
            <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" aria-hidden="true" />
                <span>{story.authorAlias || 'Anonymous'}</span>
              </div>
              {story.wordCount && (
                <div className="flex items-center">
                  <Hash className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>{story.wordCount.toLocaleString()} words</span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Status Badge */}
          <div
            className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold border ${statusConfig.color} flex-shrink-0 shadow-sm`}
            role="status"
            aria-label={`Story status: ${statusConfig.label}`}
          >
            <StatusIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            {statusConfig.label}
            {isLoading && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
          </div>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Summary */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3" role="complementary" aria-labelledby={`story-title-${story.id}`}>
          {story.summary}
        </p>

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Story metadata">
          {story.category.slice(0, 2).map((cat, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-soe-purple-50 text-soe-purple-700 text-xs font-medium rounded-full border border-soe-purple-200"
              role="listitem"
            >
              {cat}
            </span>
          ))}
          {story.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200"
              role="listitem"
            >
              #{tag}
            </span>
          ))}
          {story.ageRange && (
            <span className="px-3 py-1 bg-soe-green-50 text-soe-green-700 text-xs font-medium rounded-full border border-soe-green-200" role="listitem">
              Ages {story.ageRange}
            </span>
          )}
        </div>

        {/* Enhanced Status Description with Icon */}
        <div className="flex items-center text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className={`w-3 h-3 rounded-full mr-3 ${statusConfig.progress >= 100 ? 'bg-soe-green-500' : statusConfig.progress > 0 ? 'bg-soe-purple-500' : 'bg-gray-400'}`} aria-hidden="true" />
          <span className="font-medium">{statusConfig.description}</span>
        </div>

        {/* Call to Action */}
        <div className="mb-4">
          {renderCallToAction()}
        </div>

        {/* Enhanced Feedback Alert */}
        {hasFeedback && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex items-center justify-between w-full text-left min-h-touch focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
              aria-expanded={showFeedback}
              aria-controls={`feedback-${story.id}`}
              aria-label={showFeedback ? 'Hide review feedback' : 'Show review feedback'}
            >
              <div className="flex items-center text-amber-800">
                <div className="p-2 bg-amber-100 rounded-lg mr-3">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-sm font-semibold">Review Feedback Available</span>
                  <p className="text-xs text-amber-700 mt-1">Click to view detailed feedback</p>
                </div>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                {showFeedback ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
              </div>
            </button>

            {showFeedback && (
              <div id={`feedback-${story.id}`} className="mt-4 space-y-4 text-sm">
                {story.storyFeedback && (
                  <div className="bg-amber-25 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
                      <div className="font-semibold text-amber-900">Story Manager Feedback</div>
                    </div>
                    <div className="text-amber-800 leading-relaxed">{story.storyFeedback}</div>
                  </div>
                )}
                {story.bookDecision && (
                  <div className="bg-blue-25 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      <div className="font-semibold text-blue-900">Publication Decision</div>
                    </div>
                    <div className="text-blue-800 leading-relaxed">{story.bookDecision}</div>
                  </div>
                )}
                {story.finalNotes && (
                  <div className="bg-green-25 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      <div className="font-semibold text-green-900">Final Notes</div>
                    </div>
                    <div className="text-green-800 leading-relaxed">{story.finalNotes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Enhanced Dates */}
          <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-4 gap-y-2">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
              <time dateTime={story.createdAt}>Created {formatDate(story.createdAt)}</time>
            </div>
            {story.updatedAt !== story.createdAt && (
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                <time dateTime={story.updatedAt}>Updated {formatDate(story.updatedAt)}</time>
              </div>
            )}
            {story.publishedAt && (
              <div className="flex items-center text-soe-green-600">
                <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                <time dateTime={story.publishedAt}>Published {formatDate(story.publishedAt)}</time>
              </div>
            )}
          </div>

          {/* Enhanced Actions */}
          <div className="flex items-center gap-2" role="group" aria-label="Story actions">
            {onView && (
              <button
                onClick={() => handleAction('view')}
                disabled={isLoading}
                className="min-w-touch min-h-touch p-3 text-gray-600 hover:text-soe-green-600 hover:bg-soe-green-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soe-green-300 focus:ring-offset-2"
                aria-label="View story details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && story.status === 'DRAFT' && (
              <button
                onClick={() => onEdit(story.id)}
                disabled={isLoading}
                className="min-w-touch min-h-touch p-3 text-gray-600 hover:text-soe-purple-600 hover:bg-soe-purple-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soe-purple-300 focus:ring-offset-2"
                aria-label="Edit story"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && ['DRAFT'].includes(story.status) && (
              <button
                onClick={() => onDelete(story.id)}
                disabled={isLoading}
                className="min-w-touch min-h-touch p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                aria-label="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}