'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { AchievementIcon } from './AchievementIcon';

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

interface ProfileAchievementsProps {
  achievements: Achievement[];
}

export default function ProfileAchievements({ achievements }: ProfileAchievementsProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <h2 className="mb-6" style={{
        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
        fontSize: '32px',
        fontWeight: 500,
        lineHeight: '1.221',
        color: '#141414'
      }}>
        {t('profile.achievements.title')}
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 justify-items-center">
        {achievements.map((achievement) => (
          <AchievementIcon key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
