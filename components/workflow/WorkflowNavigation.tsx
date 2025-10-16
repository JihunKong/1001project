'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { TextSubmissionStatus } from '@prisma/client';

interface WorkflowNavigationProps {
  submissions: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
  activeSubmissionId?: string;
  onSubmissionSelect: (id: string) => void;
  onFilterChange?: (filter: string | null) => void;
  className?: string;
}

export default function WorkflowNavigation({
  submissions,
  activeSubmissionId,
  onSubmissionSelect,
  onFilterChange,
  className = ''
}: WorkflowNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const statusFilters = [
    { key: null, label: 'All Stories', icon: FileText, count: submissions.length },
    {
      key: 'DRAFT',
      label: 'Drafts',
      icon: FileText,
      count: submissions.filter(s => s.status === 'DRAFT').length
    },
    {
      key: 'PENDING',
      label: 'In Review',
      icon: Clock,
      count: submissions.filter(s => ['PENDING', 'STORY_REVIEW', 'FORMAT_REVIEW', 'CONTENT_REVIEW'].includes(s.status)).length
    },
    {
      key: 'NEEDS_REVISION',
      label: 'Needs Work',
      icon: AlertTriangle,
      count: submissions.filter(s => s.status === 'NEEDS_REVISION').length
    },
    {
      key: 'PUBLISHED',
      label: 'Published',
      icon: CheckCircle,
      count: submissions.filter(s => s.status === 'PUBLISHED').length
    }
  ];

  const filteredSubmissions = selectedFilter
    ? submissions.filter(s => {
        if (selectedFilter === 'PENDING') {
          return ['PENDING', 'STORY_REVIEW', 'FORMAT_REVIEW', 'CONTENT_REVIEW'].includes(s.status);
        }
        return s.status === selectedFilter;
      })
    : submissions;

  const handleFilterClick = (filterKey: string | null) => {
    setSelectedFilter(filterKey);
    onFilterChange?.(filterKey);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'STORY_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'STORY_APPROVED': return 'bg-green-100 text-green-800 border-green-300';
      case 'FORMAT_REVIEW': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CONTENT_REVIEW': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'APPROVED': return 'bg-soe-green-100 text-soe-green-800 border-soe-green-300';
      case 'PUBLISHED': return 'bg-soe-green-100 text-soe-green-800 border-soe-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) return date.toLocaleDateString();
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-soe-green-500 hover:bg-soe-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Panel */}
      <div className={`
        fixed lg:relative
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:block w-80 h-full bg-white border-r border-gray-200 z-40
        transition-transform duration-300 ease-in-out
        ${className}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-soe-green-500" />
                Story Navigator
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              {statusFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = selectedFilter === filter.key;

                return (
                  <button
                    key={filter.key || 'all'}
                    onClick={() => handleFilterClick(filter.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-soe-green-50 text-soe-green-700 border border-soe-green-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-soe-green-500' : 'text-gray-400'}`} />
                      {filter.label}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isActive
                        ? 'bg-soe-green-100 text-soe-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submissions List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No stories match your filter</p>
                </div>
              ) : (
                filteredSubmissions.map((submission) => {
                  const isActive = activeSubmissionId === submission.id;

                  return (
                    <button
                      key={submission.id}
                      onClick={() => {
                        onSubmissionSelect(submission.id);
                        setIsOpen(false); // Close on mobile after selection
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                        isActive
                          ? 'bg-soe-green-50 border-soe-green-200 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium text-sm line-clamp-2 ${
                          isActive ? 'text-soe-green-900' : 'text-gray-900'
                        }`}>
                          {submission.title}
                        </h4>
                        {isActive && (
                          <div className="ml-2 flex-shrink-0">
                            <ChevronRight className="w-4 h-4 text-soe-green-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(submission.status)}`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(submission.updatedAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/dashboard/writer/submit-text'}
                className="w-full bg-soe-green-500 hover:bg-soe-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                New Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}