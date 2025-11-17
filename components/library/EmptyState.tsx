'use client';

import { BookOpen, Search, Filter } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-results' | 'no-books' | 'filtered';
  onReset?: () => void;
}

export default function EmptyState({ type, onReset }: EmptyStateProps) {
  const config = {
    'no-results': {
      icon: <Search className="w-16 h-16 text-gray-400" />,
      title: 'No stories found',
      description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
      action: onReset ? (
        <button
          onClick={onReset}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Clear Search
        </button>
      ) : null,
    },
    'filtered': {
      icon: <Filter className="w-16 h-16 text-gray-400" />,
      title: 'No stories match your filters',
      description: 'Try removing some filters to see more stories.',
      action: onReset ? (
        <button
          onClick={onReset}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Clear Filters
        </button>
      ) : null,
    },
    'no-books': {
      icon: <BookOpen className="w-16 h-16 text-gray-400" />,
      title: 'No stories available',
      description: 'Check back later for new stories from around the world.',
      action: null,
    },
  };

  const currentConfig = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-50 rounded-full p-6 mb-4">
        {currentConfig.icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {currentConfig.title}
      </h3>
      <p className="text-gray-600 text-center max-w-md">
        {currentConfig.description}
      </p>
      {currentConfig.action}
    </div>
  );
}
