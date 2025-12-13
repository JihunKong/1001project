'use client';

import Image from 'next/image';
import { ArrowRight, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface StoryCardProps {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'STORY_REVIEW' | 'NEEDS_REVISION' | string;
  thumbnailUrl?: string;
  editedAt?: string;
}

export function StoryCard({
  id,
  title,
  description,
  status,
  thumbnailUrl,
  editedAt
}: StoryCardProps) {
  const { t } = useTranslation();
  const isPublished = status === 'PUBLISHED';
  const isDraft = status === 'DRAFT';

  const getStatusLabel = () => {
    if (isPublished) return t('myPage.stories.status.published');
    if (isDraft) return t('myPage.stories.status.draft');
    return t('myPage.stories.status.inReview');
  };

  const getStatusColor = () => {
    if (isPublished) return { bg: '#E8F5E9', dot: '#16A34A', text: '#16A34A' };
    if (isDraft) return { bg: '#FFF8E1', dot: '#FFC107', text: '#F59E0B' };
    return { bg: '#E3F2FD', dot: '#2196F3', text: '#2196F3' };
  };

  const colors = getStatusColor();

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return t('myPage.stories.editedJustNow');
    if (diffHours < 24) return t('myPage.stories.editedHoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('myPage.stories.editedDaysAgo', { days: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-[#F5F5F7] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ backgroundColor: colors.bg }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.dot }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: colors.text }}
          >
            {getStatusLabel()}
          </span>
        </div>
        {editedAt && (
          <span className="text-xs text-[#8E8E93]">
            {formatTimeAgo(editedAt)}
          </span>
        )}
      </div>

      <div className="w-full h-[120px] rounded-lg bg-[#E5E5EA] overflow-hidden">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            width={300}
            height={120}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Edit3 className="w-8 h-8 text-[#8E8E93]" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3
          className="text-[#141414] font-medium line-clamp-1"
          style={{ fontSize: '15px' }}
        >
          {title}
        </h3>
        <p
          className="text-[#484C56] line-clamp-2"
          style={{ fontSize: '13px', lineHeight: 1.4 }}
        >
          {description}
        </p>
      </div>

      <Link
        href={isPublished ? `/books/${id}` : `/dashboard/writer/story/${id}`}
        className="flex items-center justify-center gap-2 bg-[#141414] text-white px-4 py-2.5 rounded-lg hover:bg-[#1f1f1f] transition-colors"
      >
        {isPublished ? (
          <>
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('myPage.stories.viewBook')}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">
              {t('myPage.stories.continueWriting')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Link>
    </div>
  );
}
