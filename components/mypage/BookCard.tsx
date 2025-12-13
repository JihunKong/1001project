'use client';

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  progress: number;
}

export function BookCard({
  id,
  title,
  author,
  coverUrl,
  progress
}: BookCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[#F5F5F7] rounded-lg p-4 flex flex-col gap-3">
      <div className="w-full h-[180px] rounded-lg bg-[#E5E5EA] overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            width={200}
            height={180}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[#8E8E93]" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3
          className="text-[#141414] font-medium line-clamp-1"
          style={{ fontSize: '15px' }}
        >
          {title}
        </h3>
        <p
          className="text-[#484C56]"
          style={{ fontSize: '13px' }}
        >
          {t('myPage.library.byAuthor', { author })}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#484C56]">{progress}%</span>
          <div className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#16A34A] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <Link
        href={`/books/${id}/read`}
        className="flex items-center justify-center gap-2 bg-[#141414] text-white px-4 py-2.5 rounded-lg hover:bg-[#1f1f1f] transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-sm font-medium">
          {t('myPage.library.keepReading')}
        </span>
      </Link>
    </div>
  );
}
