'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Pencil,
  BookOpen,
  MessageCircle,
  Trophy,
  GraduationCap,
  Users,
  Award,
  Star,
  Presentation,
  FileText,
  Library,
  BookMarked,
  User,
  ClipboardList,
  MessageSquare,
  Target,
  Zap
} from 'lucide-react';
import { AchievementTooltip } from '@/components/ui/AchievementTooltip';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Achievement {
  id: string;
  key: string;
  nameKey: string;
  descKey: string;
  category: string;
  points: number;
  iconUrl?: string;
  isUnlocked: boolean;
  progress?: { current: number; target: number };
  earnedAt?: Date;
}

interface AchievementIconProps {
  achievement: Achievement;
}

const achievementIcons: Record<string, any> = {
  first_story: FileText,
  ten_published: Library,
  first_book_read: BookOpen,
  ten_books_read: BookMarked,
  first_comment: MessageSquare,
  hundred_words: Target,
  first_student: User,
  ten_students: Users,
  assignment_master: ClipboardList,
  reading_streak_7: Zap
};

const categoryIcons = {
  WRITING: Pencil,
  READING: BookOpen,
  ENGAGEMENT: MessageCircle,
  MILESTONE: Trophy,
  LEARNING: GraduationCap,
  COMMUNITY: Users,
  TEACHING: Presentation,
  AWARD: Award,
  DEFAULT: Star
};

const categoryColors = {
  WRITING: { bg: '#FEF3C7', bgEnd: '#FDE68A', border: '#F59E0B', icon: '#B45309' },
  READING: { bg: '#DBEAFE', bgEnd: '#BFDBFE', border: '#3B82F6', icon: '#1E3A8A' },
  COMMUNITY: { bg: '#FCE7F3', bgEnd: '#FBCFE8', border: '#EC4899', icon: '#9F1239' },
  MILESTONE: { bg: '#FEF08A', bgEnd: '#FDE047', border: '#EAB308', icon: '#854D0E' },
  TEACHING: { bg: '#E9D5FF', bgEnd: '#D8B4FE', border: '#A855F7', icon: '#6B21A8' },
  LEARNING: { bg: '#D1FAE5', bgEnd: '#A7F3D0', border: '#10B981', icon: '#065F46' }
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getAchievementIcon(achievement: Achievement) {
  if (achievementIcons[achievement.key]) {
    return achievementIcons[achievement.key];
  }
  const iconKey = achievement.category.toUpperCase() as keyof typeof categoryIcons;
  return categoryIcons[iconKey] || categoryIcons.DEFAULT;
}

export function AchievementIcon({ achievement }: AchievementIconProps) {
  const { t } = useTranslation();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = getAchievementIcon(achievement);
  const progressPercentage = achievement.progress
    ? Math.min(100, (achievement.progress.current / achievement.progress.target) * 100)
    : 0;

  const categoryKey = achievement.category.toUpperCase() as keyof typeof categoryColors;
  const colors = categoryColors[categoryKey] || categoryColors.LEARNING;

  const getAchievementStyles = () => {
    if (achievement.isUnlocked) {
      return {
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgEnd} 100%)`,
        border: `2px solid ${colors.border}`,
        boxShadow: isHovered
          ? `0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 3px ${hexToRgba(colors.border, 0.25)} inset`
          : `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24), 0 0 0 1px ${hexToRgba(colors.border, 0.12)} inset`,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        opacity: 1,
        color: colors.icon
      };
    } else {
      return {
        background: '#F9FAFB',
        border: '2px solid #D1D5DB',
        boxShadow: isHovered
          ? '0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(209, 213, 219, 0.5) inset'
          : '0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(142, 142, 147, 0.05) inset',
        transform: 'scale(1)',
        opacity: 0.75,
        color: '#8E8E93'
      };
    }
  };

  const tooltipContent = (
    <div className="p-4">
      <div className="flex items-start gap-3 mb-3">
        {achievement.iconUrl ? (
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={achievement.iconUrl}
              alt={achievement.key}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              backgroundColor: achievement.isUnlocked ? colors.bg : '#F2F2F7'
            }}
          >
            <IconComponent
              size={24}
              style={{
                color: achievement.isUnlocked ? colors.icon : '#8E8E93'
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium mb-1"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              color: '#141414'
            }}
          >
            {t(achievement.nameKey)}
          </h3>
          {achievement.isUnlocked ? (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: '#DCFCE7',
                color: '#166534'
              }}
            >
              {t('profile.achievements.unlocked')}
            </span>
          ) : (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: '#F2F2F7',
                color: '#8E8E93'
              }}
            >
              {t('profile.achievements.locked')}
            </span>
          )}
        </div>
      </div>

      <p
        className="mb-3"
        style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: 400,
          color: '#8E8E93',
          lineHeight: '1.5'
        }}
      >
        {t(achievement.descKey)}
      </p>

      {achievement.progress && !achievement.isUnlocked && (
        <div className="mb-3">
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E5EA' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                backgroundColor: '#3730A3',
                width: `${progressPercentage}%`
              }}
            />
          </div>
          <p
            className="mt-1"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              color: '#8E8E93'
            }}
          >
            {achievement.progress.current} / {achievement.progress.target}
          </p>
        </div>
      )}

      <div
        className="flex items-center justify-between"
        style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '12px',
          fontWeight: 400,
          color: '#8E8E93'
        }}
      >
        <span>{achievement.points} points</span>
        {achievement.isUnlocked && achievement.earnedAt && (
          <span>
            {new Date(achievement.earnedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <AchievementTooltip
      content={tooltipContent}
      isOpen={isTooltipOpen}
      onClose={() => setIsTooltipOpen(false)}
    >
      <button
        type="button"
        className="relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          ...getAchievementStyles()
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsTooltipOpen(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsTooltipOpen(false);
        }}
        onClick={() => setIsTooltipOpen(!isTooltipOpen)}
        aria-label={t(achievement.nameKey)}
        aria-describedby={`achievement-${achievement.id}`}
      >
        {achievement.iconUrl ? (
          <div className="relative w-10 h-10">
            <Image
              src={achievement.iconUrl}
              alt={achievement.key}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <IconComponent size={32} />
        )}

        {achievement.progress && !achievement.isUnlocked && (
          <svg
            className="absolute inset-0"
            style={{
              width: '72px',
              height: '72px',
              transform: 'rotate(-90deg)'
            }}
          >
            <circle
              cx="36"
              cy="36"
              r="34"
              fill="none"
              stroke={colors.border}
              strokeWidth="3"
              strokeDasharray={`${(progressPercentage / 100) * 213.6} 213.6`}
              style={{
                transition: 'stroke-dasharray 0.3s ease'
              }}
            />
          </svg>
        )}

        {achievement.isUnlocked && (
          <div className="absolute -top-1 -right-1">
            <Star
              size={16}
              fill="#EAB308"
              style={{
                color: '#EAB308'
              }}
            />
          </div>
        )}
      </button>
    </AchievementTooltip>
  );
}
