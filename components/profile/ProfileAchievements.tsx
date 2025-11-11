'use client';

import Image from 'next/image';
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

interface ProfileAchievementsProps {
  achievements: Achievement[];
}

export default function ProfileAchievements({ achievements }: ProfileAchievementsProps) {
  const { t } = useTranslation();

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('profile.achievements.title')}
        </h2>
        <span className="text-sm text-gray-600">
          {t('profile.achievements.earned').replace('{count}', unlockedCount.toString())}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`
              relative rounded-lg border-2 p-4 transition-all
              ${achievement.isUnlocked
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
              }
            `}
          >
            {achievement.iconUrl && (
              <div className="mb-3 relative w-12 h-12 mx-auto">
                <Image
                  src={achievement.iconUrl}
                  alt={achievement.key}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-1">
                {t(achievement.nameKey)}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {t(achievement.descKey)}
              </p>

              {achievement.progress && !achievement.isUnlocked && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (achievement.progress.current / achievement.progress.target) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.progress.current} / {achievement.progress.target}
                  </p>
                </div>
              )}

              <div className="mt-2">
                {achievement.isUnlocked ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('profile.achievements.unlocked')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {t('profile.achievements.locked')}
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {achievement.points} points
              </div>
            </div>

            {achievement.isUnlocked && achievement.earnedAt && (
              <div className="absolute top-2 right-2">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
