'use client';

import { TabType } from './types';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ResourceTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts?: {
    resources?: number;
    collections?: number;
    favorites?: number;
  };
}

export default function ResourceTabs({ activeTab, onTabChange, counts }: ResourceTabsProps) {
  const { t } = useTranslation();

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'resources', label: t('teacherResources.tabs.resources'), count: counts?.resources },
    { id: 'collections', label: t('teacherResources.tabs.collections'), count: counts?.collections },
    { id: 'favorites', label: t('teacherResources.tabs.favorites'), count: counts?.favorites },
  ];

  return (
    <div className="border-b border-[var(--glass-border)]">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative py-4 px-1 border-b-2 font-medium text-sm transition-all duration-apple ease-apple
              ${activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full transition-all duration-apple ease-apple
                  ${activeTab === tab.id
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
