'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProfileStats } from './ProfileStats';
import { ProfileTags } from './ProfileTags';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfileCardProps {
  user: any;
  stats: Record<string, number>;
}

export function ProfileCard({ user, stats }: ProfileCardProps) {
  const { t } = useTranslation();
  const profile = user.profile;
  const avatarUrl = profile?.avatarUrl || user.image;
  const tags = profile?.tags || [];
  const bio = profile?.bio || t('profile.card.noBio');
  const role = user.role?.toLowerCase() || 'writer';

  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-[80px] h-[80px] rounded-full bg-[#E5E5EA] flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user.name || 'Profile'}
              width={80}
              height={80}
              className="object-cover"
            />
          ) : (
            <span className="text-3xl text-[#8E8E93]">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        <h2
          className="text-[#141414] font-medium break-words text-center max-w-full px-2"
          style={{ fontSize: '17px' }}
        >
          {user.name}
        </h2>

        {/* Tags */}
        {tags.length > 0 && <ProfileTags tags={tags} />}
      </div>

      {/* Bio */}
      <p
        className="text-[#484C56] break-words"
        style={{ fontSize: '15px', lineHeight: 1.4 }}
      >
        {bio}
      </p>

      {/* Edit Button */}
      <Link
        href={`/dashboard/${role}/profile`}
        className="text-[#16A34A] font-medium transition-opacity hover:opacity-80"
        style={{ fontSize: '14px' }}
        onClick={(e) => {
          e.preventDefault();
          alert(t('profile.card.editComingSoon'));
        }}
      >
        {t('profile.card.editProfile')}
      </Link>

      {/* Stats */}
      <ProfileStats stats={stats} role={user.role} />
    </div>
  );
}
