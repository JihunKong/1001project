'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export interface FilterState {
  country?: string;
  educationalCategory?: string;
  ageRange?: string;
  minDifficulty?: number;
  maxDifficulty?: number;
  vocabularyLevel?: string;
  language?: string;
}

const COUNTRIES = [
  'Tanzania',
  'India',
  'Mexico',
  'Palestine',
  'Rwanda',
  'Uganda',
];

const EDUCATIONAL_CATEGORIES = [
  'Perseverance',
  'Problem Solving',
  'Courage & Self-Advocacy',
  'Empathy & Compassion',
  'Responsibility & Ethics',
  'Relationships & Communication',
  'Learning & Growth',
];

const AGE_RANGES = [
  '5-8',
  '9-12',
  '13-18',
];

const VOCABULARY_LEVELS = [
  'Basic',
  'Intermediate',
  'Advanced',
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'it', name: 'Italian' },
  { code: 'zh', name: 'Chinese' },
];

export default function AdvancedFilters({ onFilterChange, onReset }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    country: true,
    category: true,
    age: true,
    difficulty: true,
    vocabulary: false,
    language: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Country Filter */}
      <div className="border-b pb-3">
        <button
          onClick={() => toggleSection('country')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">Country</span>
          {expandedSections.country ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.country && (
          <div className="mt-3 space-y-2">
            {COUNTRIES.map(country => (
              <label key={country} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="country"
                  checked={filters.country === country}
                  onChange={() => updateFilter('country', country)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{country}</span>
              </label>
            ))}
            {filters.country && (
              <button
                onClick={() => clearFilter('country')}
                className="text-xs text-red-600 hover:text-red-700 mt-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Educational Category Filter */}
      <div className="border-b pb-3">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">Educational Theme</span>
          {expandedSections.category ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.category && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {EDUCATIONAL_CATEGORIES.map(category => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="educationalCategory"
                  checked={filters.educationalCategory === category}
                  onChange={() => updateFilter('educationalCategory', category)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{category}</span>
              </label>
            ))}
            {filters.educationalCategory && (
              <button
                onClick={() => clearFilter('educationalCategory')}
                className="text-xs text-red-600 hover:text-red-700 mt-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Age Range Filter */}
      <div className="border-b pb-3">
        <button
          onClick={() => toggleSection('age')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">Age Range</span>
          {expandedSections.age ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.age && (
          <div className="mt-3 space-y-2">
            {AGE_RANGES.map(range => (
              <label key={range} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ageRange"
                  checked={filters.ageRange === range}
                  onChange={() => updateFilter('ageRange', range)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{range} years</span>
              </label>
            ))}
            {filters.ageRange && (
              <button
                onClick={() => clearFilter('ageRange')}
                className="text-xs text-red-600 hover:text-red-700 mt-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Difficulty Range Filter */}
      <div className="border-b pb-3">
        <button
          onClick={() => toggleSection('difficulty')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">Difficulty Level</span>
          {expandedSections.difficulty ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.difficulty && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-gray-600">Minimum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minDifficulty || 0}
                onChange={(e) => updateFilter('minDifficulty', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">{filters.minDifficulty || 0}</span>
            </div>
            <div>
              <label className="text-xs text-gray-600">Maximum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.maxDifficulty || 100}
                onChange={(e) => updateFilter('maxDifficulty', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">{filters.maxDifficulty || 100}</span>
            </div>
            {(filters.minDifficulty || filters.maxDifficulty) && (
              <button
                onClick={() => {
                  clearFilter('minDifficulty');
                  clearFilter('maxDifficulty');
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vocabulary Level Filter */}
      <div className="border-b pb-3">
        <button
          onClick={() => toggleSection('vocabulary')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">Vocabulary Level</span>
          {expandedSections.vocabulary ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.vocabulary && (
          <div className="mt-3 space-y-2">
            {VOCABULARY_LEVELS.map(level => (
              <label key={level} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="vocabularyLevel"
                  checked={filters.vocabularyLevel === level}
                  onChange={() => updateFilter('vocabularyLevel', level)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{level}</span>
              </label>
            ))}
            {filters.vocabularyLevel && (
              <button
                onClick={() => clearFilter('vocabularyLevel')}
                className="text-xs text-red-600 hover:text-red-700 mt-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Language Filter */}
      <div className="pb-3">
        <button
          onClick={() => toggleSection('language')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">Language</span>
          {expandedSections.language ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {expandedSections.language && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  checked={filters.language === lang.code}
                  onChange={() => updateFilter('language', lang.code)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{lang.name}</span>
              </label>
            ))}
            {filters.language && (
              <button
                onClick={() => clearFilter('language')}
                className="text-xs text-red-600 hover:text-red-700 mt-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
