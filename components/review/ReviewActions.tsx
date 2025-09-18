'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  ArrowRight, 
  AlertTriangle,
  Loader2,
  Clock,
  FileText,
  Settings,
  Crown,
  BookOpen,
  Layers
} from 'lucide-react';
import { UserRole } from '@prisma/client';

type ReviewAction = 'approve' | 'reject' | 'request_revision';
type WorkflowStage = 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN';

interface ReviewActionsProps {
  submissionId: string;
  currentStatus: string;
  userRole: UserRole;
  onAction?: (action: ReviewAction, feedback?: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

interface ActionButton {
  action: ReviewAction;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  nextStatus?: string;
  requiresFeedback?: boolean;
  metadata?: any;
}

export default function ReviewActions({
  submissionId,
  currentStatus,
  userRole,
  onAction,
  disabled = false,
  className = ''
}: ReviewActionsProps) {
  const [selectedAction, setSelectedAction] = useState<ReviewAction | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getAvailableActions = (): ActionButton[] => {
    const actions: ActionButton[] = [];

    // Story Manager Actions
    if (userRole === UserRole.STORY_MANAGER) {
      if (currentStatus === 'PENDING') {
        actions.push(
          {
            action: 'approve',
            label: 'Approve Story',
            icon: CheckCircle,
            color: 'green',
            description: 'Approve for Book Manager review',
            nextStatus: 'APPROVED',
            requiresFeedback: false
          },
          {
            action: 'request_revision',
            label: 'Request Revision',
            icon: MessageSquare,
            color: 'yellow',
            description: 'Send back to author for changes',
            nextStatus: 'NEEDS_REVISION',
            requiresFeedback: true
          },
          {
            action: 'reject',
            label: 'Reject Story',
            icon: XCircle,
            color: 'red',
            description: 'Reject submission completely',
            nextStatus: 'ARCHIVED',
            requiresFeedback: true
          }
        );
      }
    }

    // Book Manager Actions
    if (userRole === UserRole.BOOK_MANAGER) {
      if (currentStatus === 'APPROVED') {
        actions.push(
          {
            action: 'approve',
            label: 'Format as Book',
            icon: BookOpen,
            color: 'blue',
            description: 'Format for book publication',
            nextStatus: 'APPROVED',
            requiresFeedback: false,
            metadata: { publicationFormat: 'BOOK' }
          },
          {
            action: 'approve',
            label: 'Format as Text',
            icon: FileText,
            color: 'indigo',
            description: 'Format for text-only publication',
            nextStatus: 'APPROVED',
            requiresFeedback: false,
            metadata: { publicationFormat: 'TEXT_ONLY' }
          },
          {
            action: 'request_revision',
            label: 'Request Changes',
            icon: MessageSquare,
            color: 'yellow',
            description: 'Send back for improvements',
            nextStatus: 'NEEDS_REVISION',
            requiresFeedback: true
          }
        );
      }
    }

    // Content Admin Actions
    if (userRole === UserRole.CONTENT_ADMIN) {
      if (currentStatus === 'APPROVED') {
        actions.push(
          {
            action: 'approve',
            label: 'Publish Now',
            icon: Crown,
            color: 'emerald',
            description: 'Publish to library immediately',
            nextStatus: 'PUBLISHED',
            requiresFeedback: false
          },
          {
            action: 'approve',
            label: 'Schedule Publish',
            icon: Clock,
            color: 'teal',
            description: 'Schedule for future publication',
            nextStatus: 'APPROVED',
            requiresFeedback: false,
            metadata: { scheduled: true }
          },
          {
            action: 'request_revision',
            label: 'Request Final Changes',
            icon: MessageSquare,
            color: 'yellow',
            description: 'Send back for final adjustments',
            nextStatus: 'NEEDS_REVISION',
            requiresFeedback: true
          },
          {
            action: 'reject',
            label: 'Reject Publication',
            icon: XCircle,
            color: 'red',
            description: 'Reject for publication',
            nextStatus: 'ARCHIVED',
            requiresFeedback: true
          }
        );
      }
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  const handleActionSelect = (actionButton: ActionButton) => {
    setSelectedAction(actionButton.action);
    if (actionButton.requiresFeedback) {
      setShowConfirm(true);
    } else {
      handleActionConfirm(actionButton);
    }
  };

  const handleActionConfirm = async (actionButton?: ActionButton) => {
    if (!selectedAction || !onAction) return;

    const action = actionButton || availableActions.find(a => a.action === selectedAction);
    if (!action) return;

    if (action.requiresFeedback && !feedback.trim()) {
      return;
    }

    try {
      setLoading(true);
      await onAction(selectedAction, feedback.trim() || undefined, action.metadata);
      setSelectedAction(null);
      setFeedback('');
      setShowConfirm(false);
    } catch (error) {
      console.error('Review action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedAction(null);
    setFeedback('');
    setShowConfirm(false);
  };

  const getStatusInfo = () => {
    switch (userRole) {
      case UserRole.STORY_MANAGER:
        return {
          stage: 'Story Review',
          icon: MessageSquare,
          color: 'orange'
        };
      case UserRole.BOOK_MANAGER:
        return {
          stage: 'Format Decision',
          icon: Settings,
          color: 'indigo'
        };
      case UserRole.CONTENT_ADMIN:
        return {
          stage: 'Final Approval',
          icon: Crown,
          color: 'teal'
        };
      default:
        return {
          stage: 'Review',
          icon: FileText,
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (availableActions.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No actions available for current status</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${statusInfo.color}-100 rounded-lg`}>
            <statusInfo.icon className={`w-5 h-5 text-${statusInfo.color}-600`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{statusInfo.stage}</h3>
            <p className="text-sm text-gray-600">Current Status: {currentStatus.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6">
        {!showConfirm ? (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-4">Available Actions</h4>
            {availableActions.map((actionButton, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleActionSelect(actionButton)}
                disabled={disabled || loading}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionButton.color === 'green' 
                    ? 'border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100'
                  : actionButton.color === 'blue'
                    ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100'
                  : actionButton.color === 'indigo'
                    ? 'border-indigo-200 bg-indigo-50 hover:border-indigo-300 hover:bg-indigo-100'
                  : actionButton.color === 'yellow'
                    ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:bg-yellow-100'
                  : actionButton.color === 'red'
                    ? 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                  : actionButton.color === 'emerald'
                    ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100'
                  : actionButton.color === 'teal'
                    ? 'border-teal-200 bg-teal-50 hover:border-teal-300 hover:bg-teal-100'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <actionButton.icon className={`w-5 h-5 text-${actionButton.color}-600`} />
                    <div>
                      <div className={`font-medium text-${actionButton.color}-900`}>
                        {actionButton.label}
                      </div>
                      <div className={`text-sm text-${actionButton.color}-700`}>
                        {actionButton.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-${actionButton.color}-600`} />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-gray-900">Confirm Action</h4>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                You are about to: <strong>
                  {availableActions.find(a => a.action === selectedAction)?.label}
                </strong>
              </p>
            </div>

            {availableActions.find(a => a.action === selectedAction)?.requiresFeedback && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Message *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback for this action..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleActionConfirm()}
                disabled={loading || (availableActions.find(a => a.action === selectedAction)?.requiresFeedback && !feedback.trim())}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirm
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}