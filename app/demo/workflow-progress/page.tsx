'use client';

import { useState } from 'react';
import FlowProgressIndicator from '@/components/workflow/FlowProgressIndicator';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const demoStatuses = [
  { label: 'Starting', value: 'STARTING', description: 'Beginning of writer&apos;s journey' },
  { label: 'My Library', value: 'MY_LIBRARY', description: 'Exploring personal story collection' },
  { label: 'Draft', value: 'DRAFT', description: 'Writing story content' },
  { label: 'Pending Review', value: 'PENDING', description: 'Story submitted for review' },
  { label: 'Story Review', value: 'STORY_REVIEW', description: 'Under editorial review' },
  { label: 'Format Review', value: 'FORMAT_REVIEW', description: 'Publication format decision' },
  { label: 'Content Review', value: 'CONTENT_REVIEW', description: 'Final content approval' },
  { label: 'Needs Revision', value: 'NEEDS_REVISION', description: 'Revisions required' },
  { label: 'Story Approved', value: 'STORY_APPROVED', description: 'Story approved for publication' },
  { label: 'Approved', value: 'APPROVED', description: 'Ready for publication' },
  { label: 'Published', value: 'PUBLISHED', description: 'Live in the library' },
  { label: 'Rejected', value: 'REJECTED', description: 'Not approved for publication' }
];

export default function WorkflowProgressDemo() {
  const [currentStatus, setCurrentStatus] = useState('DRAFT');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showTooltips, setShowTooltips] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [compact, setCompact] = useState(false);

  const handleNextStatus = () => {
    const currentIndex = demoStatuses.findIndex(status => status.value === currentStatus);
    const nextIndex = (currentIndex + 1) % demoStatuses.length;
    setCurrentStatus(demoStatuses[nextIndex].value);
  };

  const handlePrevStatus = () => {
    const currentIndex = demoStatuses.findIndex(status => status.value === currentStatus);
    const prevIndex = currentIndex === 0 ? demoStatuses.length - 1 : currentIndex - 1;
    setCurrentStatus(demoStatuses[prevIndex].value);
  };

  const handleAutoPlay = () => {
    if (isAutoPlay) {
      setIsAutoPlay(false);
    } else {
      setIsAutoPlay(true);
      const interval = setInterval(() => {
        setCurrentStatus(prev => {
          const currentIndex = demoStatuses.findIndex(status => status.value === prev);
          const nextIndex = (currentIndex + 1) % demoStatuses.length;
          return demoStatuses[nextIndex].value;
        });
      }, 3000);

      // Store interval ID to clear later
      setTimeout(() => {
        clearInterval(interval);
        setIsAutoPlay(false);
      }, demoStatuses.length * 3000);
    }
  };

  const resetDemo = () => {
    setCurrentStatus('DRAFT');
    setIsAutoPlay(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Writer&apos;s Flow Progress Indicator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the redesigned workflow component based on Figma Writer&apos;s Flow requirements.
            This component guides writers through their storytelling journey with intuitive visual feedback,
            micro-interactions, and accessibility features.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-blue-500" />
              Demo Controls
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Current Status:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {demoStatuses.find(s => s.value === currentStatus)?.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Navigation Controls */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Navigation</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePrevStatus}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStatus}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={resetDemo}
                  className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </button>
              </div>
            </div>

            {/* Auto Play */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Auto Play</h3>
              <button
                onClick={handleAutoPlay}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  isAutoPlay
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isAutoPlay ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Auto
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Auto
                  </>
                )}
              </button>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Display Options</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showTooltips}
                    onChange={(e) => setShowTooltips(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Tooltips</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={animated}
                    onChange={(e) => setAnimated(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Animations</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={compact}
                    onChange={(e) => setCompact(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Compact Mode</span>
                </label>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Jump to Status</h3>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {demoStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Component Demo */}
        <div className="space-y-8">
          <FlowProgressIndicator
            currentStatus={currentStatus}
            showTooltips={showTooltips}
            animated={animated}
            compact={compact}
          />
        </div>

        {/* Status Information */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Current Status Details</h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {demoStatuses.find(s => s.value === currentStatus)?.label}
                </h4>
                <p className="text-gray-700 mb-3">
                  {demoStatuses.find(s => s.value === currentStatus)?.description}
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Status Value:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{currentStatus}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-soe-green-100 rounded-xl flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-soe-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Micro-interactions</h3>
            <p className="text-gray-600 text-sm">
              Hover effects, scale transforms, and smooth transitions provide delightful user feedback.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Responsive Design</h3>
            <p className="text-gray-600 text-sm">
              Adapts seamlessly between desktop, tablet, and mobile viewports with optimized layouts.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Accessibility First</h3>
            <p className="text-gray-600 text-sm">
              Full keyboard navigation, ARIA labels, and screen reader support for inclusive design.
            </p>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Implementation Notes</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Writer&apos;s Flow Mapping:</strong> The component now follows the exact Figma Writer&apos;s Flow:
              Starting → My Library → Write Your Story → Story Submitted → Track Status → Edit & Re-submit
            </p>
            <p>
              <strong>Status Mapping:</strong> Database statuses are intelligently mapped to the 6-step Writer&apos;s Flow,
              ensuring compatibility with existing backend systems while providing an intuitive user experience.
            </p>
            <p>
              <strong>Progressive Enhancement:</strong> The component works without JavaScript but provides enhanced
              interactions when enabled, following progressive enhancement principles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}