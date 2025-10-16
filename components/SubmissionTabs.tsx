'use client';

import { useState } from 'react';

export type SubmissionStatus = 'DRAFT' | 'PENDING' | 'STORY_REVIEW' | 'PUBLISHED' | 'NEEDS_REVISION';

interface SubmissionTabsProps {
  statusCounts: {
    DRAFT: number;
    PENDING: number;
    STORY_REVIEW: number;
    PUBLISHED: number;
    NEEDS_REVISION: number;
  };
  activeTab: SubmissionStatus;
  onTabChange: (status: SubmissionStatus) => void;
}

const TAB_CONFIG = [
  { key: 'DRAFT' as const, label: 'Draft' },
  { key: 'PENDING' as const, label: 'Submitted' },
  { key: 'STORY_REVIEW' as const, label: 'Under Review' },
  { key: 'PUBLISHED' as const, label: 'Published' },
  { key: 'NEEDS_REVISION' as const, label: 'Feedback' },
];

export default function SubmissionTabs({ statusCounts, activeTab, onTabChange }: SubmissionTabsProps) {
  return (
    <div className="border-b border-[#E5E5EA]">
      <div className="flex items-center gap-8">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = statusCounts[tab.key] || 0;

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                relative pb-4 border-b-2 transition-all
                ${isActive ? 'border-[#141414]' : 'border-transparent hover:border-[#E5E5EA]'}
              `}
            >
              <span
                className={`transition-colors ${isActive ? 'text-[#141414]' : 'text-[#8E8E93] hover:text-[#141414]'}`}
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: isActive ? 500 : 400,
                  lineHeight: '1.221'
                }}
              >
                {tab.label}
              </span>
              <span
                className={`ml-2 ${isActive ? 'text-[#8E8E93]' : 'text-[#AEAEB2]'}`}
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400
                }}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
