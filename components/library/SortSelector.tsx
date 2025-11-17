'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, TrendingUp, Type, BarChart3, BookOpen } from 'lucide-react';

export interface SortOption {
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SortSelectorProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SORT_OPTIONS: SortOption[] = [
  {
    label: 'Newest First',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  {
    label: 'Most Popular',
    sortBy: 'viewCount',
    sortOrder: 'desc'
  },
  {
    label: 'Title (A-Z)',
    sortBy: 'title',
    sortOrder: 'asc'
  },
  {
    label: 'Difficulty (Easy to Hard)',
    sortBy: 'difficultyScore',
    sortOrder: 'asc'
  },
  {
    label: 'Reading Time (Short to Long)',
    sortBy: 'readingTime',
    sortOrder: 'asc'
  }
];

const getSortIcon = (sortBy: string) => {
  switch (sortBy) {
    case 'createdAt':
      return <Clock className="w-4 h-4" />;
    case 'viewCount':
      return <TrendingUp className="w-4 h-4" />;
    case 'title':
      return <Type className="w-4 h-4" />;
    case 'difficultyScore':
      return <BarChart3 className="w-4 h-4" />;
    case 'readingTime':
      return <BookOpen className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

export default function SortSelector({ currentSort, onSortChange }: SortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {getSortIcon(currentSort.sortBy)}
        <span className="text-sm font-medium text-gray-700">{currentSort.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {SORT_OPTIONS.map((option, index) => {
              const isActive =
                option.sortBy === currentSort.sortBy &&
                option.sortOrder === currentSort.sortOrder;

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {getSortIcon(option.sortBy)}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
