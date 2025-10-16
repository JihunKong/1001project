'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  Edit,
  BookOpen,
  Shield,
  Globe,
  Library,
  Send,
  BarChart3,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { TextSubmissionStatus } from '@prisma/client';

interface FlowProgressIndicatorProps {
  currentStatus: TextSubmissionStatus | string;
  className?: string;
  showTooltips?: boolean;
  animated?: boolean;
  compact?: boolean;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: TextSubmissionStatus | string;
  tooltip: string;
  guidance: string;
}

// Enhanced Writer's Flow based on Figma analysis
const workflowSteps: WorkflowStep[] = [
  {
    id: 'starting',
    title: 'Starting',
    description: 'Welcome to your writing journey',
    icon: Library,
    status: 'STARTING',
    tooltip: 'Begin your storytelling journey',
    guidance: 'Get familiar with the platform and start planning your story'
  },
  {
    id: 'my-library',
    title: 'My Library',
    description: 'Explore and manage your stories',
    icon: BookOpen,
    status: 'MY_LIBRARY',
    tooltip: 'View your story collection and drafts',
    guidance: 'Access your personal library where all your stories are stored'
  },
  {
    id: 'write-story',
    title: 'Write Your Story',
    description: 'Create your story content',
    icon: Edit,
    status: 'DRAFT',
    tooltip: 'Write and refine your story',
    guidance: 'Use our rich text editor to craft your story with terms & disclosures'
  },
  {
    id: 'story-submitted',
    title: 'Story Submitted',
    description: 'Story sent for review',
    icon: Send,
    status: 'PENDING',
    tooltip: 'Your story is in the review queue',
    guidance: 'Your story has been successfully submitted to our editorial team'
  },
  {
    id: 'track-status',
    title: 'Track Status',
    description: 'Monitor review progress',
    icon: BarChart3,
    status: 'STORY_REVIEW',
    tooltip: 'Follow your story through the review process',
    guidance: 'Check back here to see updates on your story\'s review progress'
  },
  {
    id: 'edit-resubmit',
    title: 'Edit & Re-submit',
    description: 'Update and resubmit story',
    icon: RefreshCw,
    status: 'NEEDS_REVISION',
    tooltip: 'Make revisions based on feedback',
    guidance: 'Review feedback and make necessary changes before resubmission'
  }
];

export default function FlowProgressIndicator({
  currentStatus,
  className = '',
  showTooltips = true,
  animated = true,
  compact = false
}: FlowProgressIndicatorProps) {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [previousStatus, setPreviousStatus] = useState<string>(currentStatus);

  // Track status changes for animations
  useEffect(() => {
    if (previousStatus !== currentStatus) {
      setPreviousStatus(currentStatus);
    }
  }, [currentStatus, previousStatus]);

  const getStepState = (stepStatus: string) => {
    // Handle special mapping for Writer's Flow states
    const statusMapping: { [key: string]: string } = {
      'STARTING': 'starting',
      'MY_LIBRARY': 'my-library',
      'DRAFT': 'write-story',
      'PENDING': 'story-submitted',
      'STORY_REVIEW': 'track-status',
      'FORMAT_REVIEW': 'track-status',
      'CONTENT_REVIEW': 'track-status',
      'NEEDS_REVISION': 'edit-resubmit',
      'STORY_APPROVED': 'track-status',
      'APPROVED': 'track-status',
      'PUBLISHED': 'track-status',
      'REJECTED': 'edit-resubmit'
    };

    const mappedCurrent = statusMapping[currentStatus] || currentStatus.toLowerCase();
    const currentIndex = workflowSteps.findIndex(step => step.id === mappedCurrent);
    const stepIndex = workflowSteps.findIndex(step => step.status === stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepColors = (state: string, isHovered: boolean = false) => {
    const baseTransition = animated ? 'transition-all duration-300 ease-in-out' : '';

    switch (state) {
      case 'completed':
        return {
          bg: `bg-gray-50 ${isHovered ? 'bg-gray-100' : ''} ${baseTransition}`,
          border: `border-[#E5E5EA] ${isHovered ? 'border-[#8E8E93]' : ''} ${baseTransition}`,
          icon: `bg-[#141414] text-white ${isHovered ? 'scale-110' : ''} ${baseTransition}`,
          text: `text-figma-black ${isHovered ? 'opacity-80' : ''} ${baseTransition}`,
          line: `bg-[#141414] ${baseTransition}`,
          pulse: false
        };
      case 'current':
        return {
          bg: `bg-gray-50 ${isHovered ? 'bg-gray-100' : ''} ${baseTransition}`,
          border: `border-[#141414] ${isHovered ? 'shadow-lg' : 'shadow-md'} ${baseTransition}`,
          icon: `bg-[#141414] text-white ${isHovered ? 'scale-110' : ''} ${baseTransition}`,
          text: `text-figma-black ${isHovered ? 'opacity-80' : ''} ${baseTransition}`,
          line: `bg-[#E5E5EA] ${baseTransition}`,
          pulse: true
        };
      case 'pending':
        return {
          bg: `bg-gray-50 ${isHovered ? 'bg-gray-100' : ''} ${baseTransition}`,
          border: `border-[#E5E5EA] ${isHovered ? 'border-[#8E8E93]' : ''} ${baseTransition}`,
          icon: `bg-[#8E8E93] text-white ${isHovered ? 'bg-[#141414]' : ''} ${baseTransition}`,
          text: `text-[#8E8E93] ${isHovered ? 'text-figma-black' : ''} ${baseTransition}`,
          line: `bg-[#E5E5EA] ${baseTransition}`,
          pulse: false
        };
      default:
        return {
          bg: `bg-gray-50 ${baseTransition}`,
          border: `border-[#E5E5EA] ${baseTransition}`,
          icon: `bg-[#8E8E93] text-white ${baseTransition}`,
          text: `text-[#8E8E93] ${baseTransition}`,
          line: `bg-[#E5E5EA] ${baseTransition}`,
          pulse: false
        };
    }
  };

  const getProgressPercentage = () => {
    const statusMapping: { [key: string]: string } = {
      'STARTING': 'starting',
      'MY_LIBRARY': 'my-library',
      'DRAFT': 'write-story',
      'PENDING': 'story-submitted',
      'STORY_REVIEW': 'track-status',
      'FORMAT_REVIEW': 'track-status',
      'CONTENT_REVIEW': 'track-status',
      'NEEDS_REVISION': 'edit-resubmit',
      'STORY_APPROVED': 'track-status',
      'APPROVED': 'track-status',
      'PUBLISHED': 'track-status',
      'REJECTED': 'edit-resubmit'
    };

    const mappedCurrent = statusMapping[currentStatus] || currentStatus.toLowerCase();
    const currentIndex = workflowSteps.findIndex(step => step.id === mappedCurrent);

    if (currentIndex === -1) return 0;
    return Math.max(0, (currentIndex / (workflowSteps.length - 1)) * 100);
  };

  // Tooltip component
  const Tooltip = ({ children, content, show }: { children: React.ReactNode; content: string; show: boolean }) => (
    <div className="relative">
      {children}
      {show && showTooltips && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`w-full ${className}`} role="navigation" aria-label="Writer's journey progress">
      {/* Compact Mode */}
      {compact && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Writer&apos;s Journey</h3>
            <span className="text-xs text-gray-500">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {workflowSteps.map((step, index) => {
              const state = getStepState(step.status);
              const isHovered = hoveredStep === step.id;
              const colors = getStepColors(state, isHovered);

              return (
                <Tooltip key={step.id} content={step.tooltip} show={isHovered}>
                  <div
                    className="flex items-center"
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div className={`w-6 h-6 rounded-full ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                      {state === 'completed' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <step.icon className="w-3 h-3" />
                      )}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className={`w-2 h-0.5 mx-0.5 ${colors.line}`} />
                    )}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile View - Enhanced */}
      {!compact && (
        <div className="block lg:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                  <Library className="w-3 h-3 text-figma-black" />
                </div>
                Writer&apos;s Journey
              </h3>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 mr-1" />
                {Math.round(getProgressPercentage())}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[#141414] transition-all duration-700 ease-out ${animated ? 'transform' : ''}`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {workflowSteps.map((step, index) => {
                const state = getStepState(step.status);
                const isHovered = hoveredStep === step.id;
                const colors = getStepColors(state, isHovered);
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center p-3 rounded-xl ${colors.bg} ${colors.border} border ${animated ? 'transform transition-all duration-200' : ''} ${isHovered ? 'scale-102' : ''}`}
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    role="listitem"
                    aria-label={`${step.title}: ${step.description}`}
                  >
                    <div className={`relative w-12 h-12 rounded-full ${colors.icon} flex items-center justify-center mr-4 flex-shrink-0`}>
                      {state === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}

                      {colors.pulse && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-gray-300 opacity-30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${colors.text} mb-1`}>
                        {step.title}
                      </div>
                      <div className={`text-xs ${colors.text} opacity-80`}>
                        {state === 'current' ? step.guidance : step.description}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`text-xs font-mono px-2 py-1 rounded-full ${colors.bg} ${colors.text} border`}>
                        {index + 1}
                      </div>
                      {state === 'current' && (
                        <ArrowRight className="w-4 h-4 text-figma-black animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop View - Enhanced */}
      {!compact && (
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <Library className="w-4 h-4 text-figma-black" />
                </div>
                Writer&apos;s Journey
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Progress: {Math.round(getProgressPercentage())}%
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-figma-black" />
                  {workflowSteps.filter(step => getStepState(step.status) === 'completed').length} of {workflowSteps.length} steps
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Enhanced Progress Line */}
              <div className="absolute top-12 left-12 right-12 h-1 bg-[#E5E5EA] rounded-full -z-10 shadow-inner">
                <div
                  className={`h-full bg-[#141414] rounded-full transition-all duration-1000 ease-out ${animated ? 'transform' : ''}`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>

              <div className="grid grid-cols-6 gap-6">
                {workflowSteps.map((step, index) => {
                  const state = getStepState(step.status);
                  const isHovered = hoveredStep === step.id;
                  const colors = getStepColors(state, isHovered);
                  const Icon = step.icon;

                  return (
                    <Tooltip key={step.id} content={step.tooltip} show={isHovered}>
                      <div
                        className="flex flex-col items-center text-center cursor-pointer"
                        onMouseEnter={() => setHoveredStep(step.id)}
                        onMouseLeave={() => setHoveredStep(null)}
                        role="listitem"
                        aria-label={`${step.title}: ${state === 'current' ? step.guidance : step.description}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setHoveredStep(hoveredStep === step.id ? null : step.id);
                          }
                        }}
                      >
                        {/* Enhanced Step Circle */}
                        <div className={`relative w-20 h-20 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center mb-4 ${animated ? 'transform transition-all duration-300' : ''} ${isHovered ? 'scale-110 -translate-y-1' : ''}`}>
                          <div className={`w-12 h-12 rounded-full ${colors.icon} flex items-center justify-center`}>
                            {state === 'completed' ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              <Icon className="w-6 h-6" />
                            )}
                          </div>

                          {/* Enhanced Pulse Animation */}
                          {colors.pulse && (
                            <>
                              <div className="absolute inset-0 rounded-full animate-ping bg-gray-300 opacity-20" />
                              <div className="absolute inset-2 rounded-full animate-pulse bg-gray-200 opacity-30" />
                            </>
                          )}

                          {/* Step Status Badge */}
                          {state === 'completed' && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#141414] text-white rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Enhanced Step Info */}
                        <div className={`${colors.text} transition-all duration-300 ${isHovered ? 'transform -translate-y-1' : ''}`}>
                          <div className={`text-sm font-bold mb-2 ${state === 'current' ? 'text-figma-black' : ''}`}>
                            {step.title}
                          </div>
                          <div className="text-xs opacity-90 leading-relaxed max-w-24 mx-auto">
                            {state === 'current' ? step.guidance : step.description}
                          </div>
                        </div>

                        {/* Enhanced Step Number */}
                        <div className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border} min-w-8`}>
                          {index + 1}
                        </div>

                        {/* Current Step Indicator */}
                        {state === 'current' && (
                          <div className="mt-2 flex items-center justify-center">
                            <div className="w-2 h-2 bg-figma-black rounded-full animate-pulse" />
                            <div className="ml-1 text-xs text-figma-black font-medium">Current</div>
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Guidance Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              {workflowSteps.map((step) => {
                const state = getStepState(step.status);
                if (state !== 'current') return null;

                return (
                  <div key={step.id} className="bg-gray-50 rounded-xl p-6 border border-[#E5E5EA]">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-[#141414] text-white rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Current Step: {step.title}</h4>
                        <p className="text-gray-700 mb-3">{step.guidance}</p>
                        <div className="flex items-center text-sm text-gray-600">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span>Need help? Click on any step for more information</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}