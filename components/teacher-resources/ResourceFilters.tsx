'use client';

import { FilterState, ViewType, SortType } from './types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Search, Grid3X3, List, ChevronDown } from 'lucide-react';

interface ResourceFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  sortBy: SortType;
  onSortChange: (sortBy: SortType) => void;
}

const RESOURCE_TYPES = [
  { value: '', labelKey: 'teacherResources.filters.allTypes' },
  { value: 'TEXTBOOK', labelKey: 'teacherResources.types.textbook' },
  { value: 'WORKSHEET', labelKey: 'teacherResources.types.worksheet' },
  { value: 'IMAGE', labelKey: 'teacherResources.types.image' },
  { value: 'VIDEO', labelKey: 'teacherResources.types.video' },
  { value: 'AUDIO', labelKey: 'teacherResources.types.audio' },
  { value: 'DOCUMENT', labelKey: 'teacherResources.types.document' },
];

const SUBJECTS = [
  { value: '', labelKey: 'teacherResources.filters.allSubjects' },
  { value: 'korean', labelKey: 'teacherResources.subjects.korean' },
  { value: 'social', labelKey: 'teacherResources.subjects.social' },
  { value: 'math', labelKey: 'teacherResources.subjects.math' },
  { value: 'science', labelKey: 'teacherResources.subjects.science' },
  { value: 'english', labelKey: 'teacherResources.subjects.english' },
];

const GRADES = [
  { value: '', labelKey: 'teacherResources.filters.allGrades' },
  { value: 'grade1', labelKey: 'teacherResources.grades.grade1' },
  { value: 'grade2', labelKey: 'teacherResources.grades.grade2' },
  { value: 'grade3', labelKey: 'teacherResources.grades.grade3' },
  { value: 'grade4', labelKey: 'teacherResources.grades.grade4' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', labelKey: 'teacherResources.sort.recent' },
  { value: 'popular', labelKey: 'teacherResources.sort.popular' },
  { value: 'rating', labelKey: 'teacherResources.sort.rating' },
  { value: 'title', labelKey: 'teacherResources.sort.alphabetical' },
];

export default function ResourceFilters({
  filters,
  onFilterChange,
  viewType,
  onViewTypeChange,
  sortBy,
  onSortChange,
}: ResourceFiltersProps) {
  const { t } = useTranslation();

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('teacherResources.filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all duration-apple ease-apple"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-lg p-1">
            <button
              onClick={() => onViewTypeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewType === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={t('teacherResources.view.grid')}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewTypeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewType === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={t('teacherResources.view.list')}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortType)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all duration-apple ease-apple"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all duration-apple ease-apple"
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.subject}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all duration-apple ease-apple"
          >
            {SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {t(subject.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all duration-apple ease-apple"
          >
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {t(grade.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {(filters.type || filters.subject || filters.grade || filters.search) && (
          <button
            onClick={() => onFilterChange({ type: '', subject: '', grade: '', search: '' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('teacherResources.filters.clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}
