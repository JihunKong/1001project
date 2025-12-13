'use client';

import { Edit3, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function NewStoryCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-[#F5F5F7] rounded-lg p-4 flex flex-col gap-3 border border-dashed border-[#E5E5EA]">
      <div className="w-full h-[120px] rounded-lg flex items-center justify-center">
        <PlusCircle className="w-12 h-12 text-[#8E8E93]" />
      </div>

      <div className="flex flex-col gap-1">
        <h3
          className="text-[#141414] font-medium"
          style={{ fontSize: '15px' }}
        >
          {t('myPage.stories.startNewStory.title')}
        </h3>
        <p
          className="text-[#484C56]"
          style={{ fontSize: '13px', lineHeight: 1.4 }}
        >
          {t('myPage.stories.startNewStory.description')}
        </p>
      </div>

      <Link
        href="/dashboard/writer/submit-text"
        className="flex items-center justify-center gap-2 bg-[#141414] text-white px-4 py-2.5 rounded-lg hover:bg-[#1f1f1f] transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        <span className="text-sm font-medium">
          {t('myPage.stories.startNewStory.button')}
        </span>
      </Link>
    </div>
  );
}
