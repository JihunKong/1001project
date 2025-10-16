'use client';

import { Clock, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface Story {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  wordCount?: number | null;
  summary: string;
}

interface SimpleStoryCardProps {
  story: Story;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return 'text-[#8E8E93] bg-gray-50';
    case 'SUBMITTED':
      return 'text-blue-700 bg-blue-50';
    case 'IN_REVIEW':
      return 'text-orange-700 bg-orange-50';
    case 'NEEDS_REVISION':
      return 'text-red-700 bg-red-50';
    case 'APPROVED':
      return 'text-green-700 bg-green-50';
    case 'PUBLISHED':
      return 'text-[#141414] bg-gray-100';
    default:
      return 'text-[#8E8E93] bg-gray-50';
  }
};

const getStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function SimpleStoryCard({ story, onView, onEdit, onDelete }: SimpleStoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleView = () => {
    onView?.(story.id);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit?.(story.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${story.title}"?`)) {
      onDelete?.(story.id);
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-[#141414] truncate">
              {story.title}
            </h3>
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(story.status)}`}>
              {getStatusLabel(story.status)}
            </span>
          </div>

          <p className="text-xs text-[#8E8E93] line-clamp-2 mb-1.5">
            {story.summary}
          </p>

          <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
            </div>
            {story.wordCount && (
              <span>{story.wordCount.toLocaleString()} words</span>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Story options"
          >
            <MoreVertical className="w-5 h-5 text-[#8E8E93]" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-[#E5E5EA] py-1 z-20">
                {onView && (
                  <button
                    onClick={handleView}
                    className="w-full px-4 py-2 text-left text-sm text-[#141414] hover:bg-gray-50 transition-colors"
                  >
                    View
                  </button>
                )}
                {onEdit && story.status !== 'PUBLISHED' && (
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left text-sm text-[#141414] hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onDelete && story.status === 'DRAFT' && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
