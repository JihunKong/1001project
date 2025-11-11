'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfileTabsProps {
  activeTab: 'overview' | 'stories';
}

export function ProfileTabs({ activeTab }: ProfileTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-6 border-b border-[#E5E5EA] mb-8">
      {activeTab === 'overview' ? (
        <button
          className="pb-3 px-1 border-b-2 border-[#141414] font-medium text-[#141414]"
          style={{ fontSize: '18px' }}
        >
          {t('profile.tabs.overview')}
        </button>
      ) : (
        <Link
          href="/profile"
          className="pb-3 px-1 border-b-2 border-transparent hover:border-[#8E8E93] text-[#8E8E93] hover:text-[#141414] transition-colors"
          style={{ fontSize: '18px' }}
        >
          {t('profile.tabs.overview')}
        </Link>
      )}

      {activeTab === 'stories' ? (
        <button
          className="pb-3 px-1 border-b-2 border-[#141414] font-medium text-[#141414]"
          style={{ fontSize: '18px' }}
        >
          {t('profile.tabs.stories')}
        </button>
      ) : (
        <Link
          href="/profile/stories"
          className="pb-3 px-1 border-b-2 border-transparent hover:border-[#8E8E93] text-[#8E8E93] hover:text-[#141414] transition-colors"
          style={{ fontSize: '18px' }}
        >
          {t('profile.tabs.stories')}
        </Link>
      )}
    </div>
  );
}
