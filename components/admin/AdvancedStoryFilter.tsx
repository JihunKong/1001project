'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  Star,
  Globe,
  BookOpen,
  Save,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterValues {
  search: string;
  isPublished: string;
  language: string;
  isPremium: string;
  featured: string;
  hasFullPdf: string;
  dateFrom: string;
  dateTo: string;
  authorName: string;
  category: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValues;
  isDefault?: boolean;
}

interface AdvancedStoryFilterProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onApplyFilters: () => void;
  loading?: boolean;
  totalCount?: number;
}

const defaultFilters: FilterValues = {
  search: '',
  isPublished: '',
  language: '',
  isPremium: '',
  featured: '',
  hasFullPdf: '',
  dateFrom: '',
  dateTo: '',
  authorName: '',
  category: '',
};

const filterPresets: FilterPreset[] = [
  {
    id: 'all',
    name: 'All Stories',
    filters: defaultFilters,
    isDefault: true,
  },
  {
    id: 'ready-to-publish',
    name: 'Ready to Publish',
    filters: {
      ...defaultFilters,
      isPublished: 'false',
      hasFullPdf: 'true',
    },
  },
  {
    id: 'premium-content',
    name: 'Premium Content',
    filters: {
      ...defaultFilters,
      isPremium: 'true',
      isPublished: 'true',
    },
  },
  {
    id: 'missing-pdfs',
    name: 'Missing PDFs',
    filters: {
      ...defaultFilters,
      hasFullPdf: 'false',
    },
  },
];

export default function AdvancedStoryFilter({
  filters,
  onFiltersChange,
  onApplyFilters,
  loading = false,
  totalCount = 0,
}: AdvancedStoryFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('all');

  // Check if any advanced filters are active
  const hasAdvancedFilters = Object.entries(filters).some(([key, value]) => {
    if (['search', 'isPublished', 'language'].includes(key)) return false;
    return value !== '';
  });

  const hasAnyFilters = Object.values(filters).some(value => value !== '');

  useEffect(() => {
    if (hasAdvancedFilters) {
      setShowAdvanced(true);
    }
  }, [hasAdvancedFilters]);

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    
    // Reset preset selection if filters are manually changed
    setActivePreset('');
  };

  const applyPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
    setActivePreset(preset.id);
    onApplyFilters();
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
    setActivePreset('all');
    onApplyFilters();
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Presets Bar */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
            {filterPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  activePreset === preset.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {totalCount} {totalCount === 1 ? 'story' : 'stories'}
            </span>
            {hasAnyFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Filter Controls */}
      <div className="p-6">
        {/* Basic Filters Row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stories, authors, content..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.isPublished}
            onChange={(e) => handleFilterChange('isPublished', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="">All Stories</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>

          <select
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="">All Languages</option>
            <option value="en">English</option>
            <option value="ko">Korean</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showAdvanced || hasAdvancedFilters
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Advanced
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showAdvanced ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            onClick={onApplyFilters}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Premium Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Star className="w-4 h-4 inline mr-1" />
                    Premium Status
                  </label>
                  <select
                    value={filters.isPremium}
                    onChange={(e) => handleFilterChange('isPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Content</option>
                    <option value="true">Premium Only</option>
                    <option value="false">Free Only</option>
                  </select>
                </div>

                {/* Featured Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Featured
                  </label>
                  <select
                    value={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Stories</option>
                    <option value="true">Featured Only</option>
                    <option value="false">Not Featured</option>
                  </select>
                </div>

                {/* PDF Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PDF Status
                  </label>
                  <select
                    value={filters.hasFullPdf}
                    onChange={(e) => handleFilterChange('hasFullPdf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Stories</option>
                    <option value="true">Has PDF</option>
                    <option value="false">Missing PDF</option>
                  </select>
                </div>

                {/* Author Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by author..."
                    value={filters.authorName}
                    onChange={(e) => handleFilterChange('authorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Created From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Created To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by category..."
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Advanced Filter Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvanced(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Hide Advanced Filters
                  </button>
                  {hasAdvancedFilters && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {getActiveFilterCount()} active filters
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const advancedFilters = { ...defaultFilters };
                      advancedFilters.search = filters.search;
                      advancedFilters.isPublished = filters.isPublished;
                      advancedFilters.language = filters.language;
                      onFiltersChange(advancedFilters);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear Advanced
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}