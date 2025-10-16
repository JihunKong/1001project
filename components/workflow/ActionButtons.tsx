'use client';

import { useState } from 'react';
import {
  PenTool,
  Upload,
  Eye,
  Send,
  RefreshCw,
  ArrowRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { TextSubmissionStatus } from '@prisma/client';

interface ActionButtonsProps {
  currentStatus: TextSubmissionStatus | string;
  storyId?: string;
  onSubmitForReview?: (id: string) => Promise<void>;
  onContinueWriting?: (id: string) => void;
  onViewStory?: (id: string) => void;
  onStartNewStory?: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function ActionButtons({
  currentStatus,
  storyId,
  onSubmitForReview,
  onContinueWriting,
  onViewStory,
  onStartNewStory,
  isLoading = false,
  className = ''
}: ActionButtonsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitForReview = async () => {
    if (!storyId || !onSubmitForReview) return;

    setIsSubmitting(true);
    try {
      await onSubmitForReview(storyId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionsForStatus = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return [
          {
            id: 'continue',
            label: 'Continue Writing',
            description: 'Keep working on your story',
            icon: PenTool,
            variant: 'primary',
            action: () => storyId && onContinueWriting?.(storyId)
          },
          {
            id: 'submit',
            label: 'Submit for Review',
            description: 'Send to editorial team',
            icon: Send,
            variant: 'secondary',
            action: handleSubmitForReview,
            loading: isSubmitting
          },
          {
            id: 'view',
            label: 'Preview',
            description: 'See how it looks',
            icon: Eye,
            variant: 'outline',
            action: () => storyId && onViewStory?.(storyId)
          }
        ];

      case 'PENDING':
      case 'STORY_REVIEW':
        return [
          {
            id: 'view',
            label: 'View Story',
            description: 'Check your submission',
            icon: Eye,
            variant: 'primary',
            action: () => storyId && onViewStory?.(storyId)
          },
          {
            id: 'status',
            label: 'Check Status',
            description: 'See review progress',
            icon: RefreshCw,
            variant: 'outline',
            action: () => window.location.reload()
          }
        ];

      case 'NEEDS_REVISION':
        return [
          {
            id: 'revise',
            label: 'Make Revisions',
            description: 'Update based on feedback',
            icon: PenTool,
            variant: 'primary',
            action: () => storyId && onContinueWriting?.(storyId)
          },
          {
            id: 'view-feedback',
            label: 'View Feedback',
            description: 'Read reviewer comments',
            icon: Eye,
            variant: 'secondary',
            action: () => storyId && onViewStory?.(storyId)
          }
        ];

      case 'STORY_APPROVED':
      case 'FORMAT_REVIEW':
      case 'CONTENT_REVIEW':
        return [
          {
            id: 'view',
            label: 'View Story',
            description: 'See your approved story',
            icon: Eye,
            variant: 'primary',
            action: () => storyId && onViewStory?.(storyId)
          },
          {
            id: 'track',
            label: 'Track Progress',
            description: 'Monitor publication status',
            icon: ArrowRight,
            variant: 'outline',
            action: () => window.location.reload()
          }
        ];

      case 'PUBLISHED':
        return [
          {
            id: 'view-published',
            label: 'View in Library',
            description: 'See your published story',
            icon: BookOpen,
            variant: 'primary',
            action: () => storyId && onViewStory?.(storyId)
          },
          {
            id: 'share',
            label: 'Share Story',
            description: 'Tell others about your story',
            icon: ExternalLink,
            variant: 'secondary',
            action: () => {
              // TODO: Implement sharing functionality
              console.log('Share functionality not yet implemented');
            }
          }
        ];

      case 'APPROVED':
        return [
          {
            id: 'view',
            label: 'View Story',
            description: 'Your approved story',
            icon: CheckCircle,
            variant: 'primary',
            action: () => storyId && onViewStory?.(storyId)
          }
        ];

      case 'REJECTED':
        return [
          {
            id: 'view-feedback',
            label: 'View Feedback',
            description: 'Understand the decision',
            icon: Eye,
            variant: 'secondary',
            action: () => storyId && onViewStory?.(storyId)
          },
          {
            id: 'new-story',
            label: 'Start New Story',
            description: 'Try again with a fresh story',
            icon: PenTool,
            variant: 'primary',
            action: onStartNewStory
          }
        ];

      default:
        return [];
    }
  };

  const getButtonStyles = (variant: string, disabled = false) => {
    const baseStyles = 'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    if (disabled) {
      return `${baseStyles} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-[#141414] hover:bg-[#2a2a2a] text-white shadow-sm hover:shadow-md focus:ring-gray-500`;
      case 'secondary':
        return `${baseStyles} bg-[#141414] hover:bg-[#2a2a2a] text-white shadow-sm hover:shadow-md focus:ring-gray-500`;
      case 'outline':
        return `${baseStyles} bg-white border border-[#E5E5EA] text-figma-gray-inactive hover:bg-gray-50 hover:border-[#8E8E93] hover:text-figma-black focus:ring-gray-500 hover:shadow-sm`;
      default:
        return `${baseStyles} bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500`;
    }
  };

  const actions = getActionsForStatus(currentStatus);

  if (actions.length === 0) {
    return (
      <div className={`flex items-center justify-center p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No actions available for current status</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const disabled = isLoading || ('loading' in action && action.loading) || false;

          return (
            <button
              key={action.id}
              onClick={action.action}
              disabled={disabled}
              className={getButtonStyles(action.variant, disabled)}
            >
              {'loading' in action && action.loading ? (
                <RefreshCw
                  className={`w-4 h-4 mr-2 animate-spin ${(action.variant === 'primary' || action.variant === 'secondary') ? '!text-white' : '!text-gray-700'}`}
                  style={{ color: (action.variant === 'primary' || action.variant === 'secondary') ? '#ffffff' : '#374151' }}
                />
              ) : (
                <Icon
                  className={`w-4 h-4 mr-2 ${(action.variant === 'primary' || action.variant === 'secondary') ? '!text-white' : '!text-gray-700'}`}
                  style={{ color: (action.variant === 'primary' || action.variant === 'secondary') ? '#ffffff' : '#374151' }}
                />
              )}
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Action Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <div key={`${action.id}-desc`} className="flex items-start p-3 bg-gray-50 rounded-lg">
            <action.icon className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">{action.label}</div>
              <div className="text-xs text-gray-600">{action.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* New Story CTA (always available) */}
      {currentStatus !== 'DRAFT' && onStartNewStory && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onStartNewStory}
            className="w-full flex items-center justify-center px-4 py-3 bg-[#141414] hover:bg-[#2a2a2a] !text-white rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            style={{ color: '#ffffff' }}
          >
            <PenTool className="w-4 h-4 mr-2 !text-white" style={{ color: '#ffffff' }} />
            Start New Story
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Ready to share another story with the world?
          </p>
        </div>
      )}
    </div>
  );
}