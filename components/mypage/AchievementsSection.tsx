'use client';

import { PenTool, ThumbsUp, Globe, Heart, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Badge {
  id: string;
  name: string;
  icon: 'pen' | 'streak' | 'globe' | 'heart' | 'thumbs' | 'lock';
  color: string;
  earned: boolean;
}

interface Milestone {
  id: string;
  name: string;
  current: number;
  target: number;
  message: string;
}

interface AchievementsSectionProps {
  badges: Badge[];
  milestones: Milestone[];
}

const badgeIcons = {
  pen: PenTool,
  streak: ThumbsUp,
  globe: Globe,
  heart: Heart,
  thumbs: ThumbsUp,
  lock: Lock
};

const badgeColors: Record<string, string> = {
  pink: '#FFC0CB',
  yellow: '#FFD700',
  blue: '#87CEEB',
  red: '#FFB6C1',
  green: '#90EE90',
  gray: '#D3D3D3'
};

export function AchievementsSection({ badges, milestones }: AchievementsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏅</span>
        <h2
          className="text-[#141414] font-medium"
          style={{ fontSize: '24px' }}
        >
          {t('myPage.achievements.title')}
        </h2>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 bg-[#F5F5F7] rounded-lg p-5">
          <h3
            className="text-[#141414] font-medium mb-4"
            style={{ fontSize: '17px' }}
          >
            {t('myPage.achievements.myBadges')}
          </h3>

          <div className="flex flex-wrap gap-4">
            {badges.map((badge) => {
              const IconComponent = badgeIcons[badge.icon] || Lock;
              return (
                <div key={badge.id} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: badge.earned ? badgeColors[badge.color] || '#D3D3D3' : '#E5E5EA' }}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: badge.earned ? '#141414' : '#8E8E93' }}
                    />
                  </div>
                  <span
                    className="text-xs text-center"
                    style={{ color: badge.earned ? '#141414' : '#8E8E93' }}
                  >
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-[#F5F5F7] rounded-lg p-5">
          <h3
            className="text-[#141414] font-medium mb-4"
            style={{ fontSize: '17px' }}
          >
            {t('myPage.achievements.nextMilestone')}
          </h3>

          <div className="flex flex-col gap-4">
            {milestones.map((milestone) => {
              const progress = Math.round((milestone.current / milestone.target) * 100);
              return (
                <div key={milestone.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#141414]">
                    {milestone.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#484C56]">
                      {milestone.current}/{milestone.target}
                    </span>
                    <div className="flex-1 h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[#8E8E93]">
                    {milestone.message}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
