'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { BookOpen, Library, Heart } from 'lucide-react';
import { LibraryModeSelector, LibraryMode } from './LibraryModeSelector';
import { SupportedLanguage } from '@/lib/i18n/language-cookie';

export type LibraryTab = 'my-stories' | 'all-books' | 'favorites';

interface LibraryTabsProps {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  counts: {
    myStories: number;
    allBooks: number;
    favorites: number;
  };
  libraryMode?: LibraryMode;
  onLibraryModeChange?: (mode: LibraryMode) => void;
  userLanguage?: SupportedLanguage;
  translatedBookCount?: number;
  showModeSelector?: boolean;
}

export function LibraryTabs({
  activeTab,
  onTabChange,
  counts,
  libraryMode = 'english',
  onLibraryModeChange,
  userLanguage = 'en',
  translatedBookCount,
  showModeSelector = false
}: LibraryTabsProps) {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'my-stories' as LibraryTab,
      label: t('library.tabs.myStories'),
      icon: BookOpen,
      count: counts.myStories,
    },
    {
      id: 'all-books' as LibraryTab,
      label: t('library.tabs.allBooks'),
      icon: Library,
      count: counts.allBooks,
    },
    {
      id: 'favorites' as LibraryTab,
      label: t('library.tabs.favorites'),
      icon: Heart,
      count: counts.favorites,
    },
  ];

  return (
    <div className="space-y-4">
      {showModeSelector && onLibraryModeChange && userLanguage !== 'en' && (
        <LibraryModeSelector
          currentMode={libraryMode}
          onModeChange={onLibraryModeChange}
          userLanguage={userLanguage}
          translatedBookCount={translatedBookCount}
        />
      )}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`}
                />
                <span>{tab.label}</span>
                <span
                  className={`
                    ml-1 rounded-full py-0.5 px-2.5 text-xs font-medium
                    ${isActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export type { LibraryMode } from './LibraryModeSelector';
