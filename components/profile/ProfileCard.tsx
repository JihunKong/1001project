'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProfileStats } from './ProfileStats';
import { ProfileTags } from './ProfileTags';

interface ProfileCardProps {
  user: any;
  stats: Record<string, number>;
}

export function ProfileCard({ user, stats }: ProfileCardProps) {
  const profile = user.profile;
  const avatarUrl = profile?.avatarUrl || user.image;
  const tags = profile?.tags || [];
  const bio = profile?.bio || 'No bio provided';
  const role = user.role?.toLowerCase() || 'writer';

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-[100px] h-[100px] rounded-full bg-[#E5E5EA] flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user.name || 'Profile'}
              width={100}
              height={100}
              className="object-cover"
            />
          ) : (
            <span className="text-4xl text-[#8E8E93]">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        <h2
          className="text-[#141414] font-medium"
          style={{ fontSize: '20px' }}
        >
          {user.name}
        </h2>

        {/* Tags */}
        {tags.length > 0 && <ProfileTags tags={tags} />}
      </div>

      {/* Bio */}
      <p
        className="text-[#484C56]"
        style={{ fontSize: '18px', lineHeight: 1.193 }}
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
          alert('Profile editing feature coming soon!');
        }}
      >
        Edit profile
      </Link>

      {/* Stats */}
      <ProfileStats stats={stats} role={user.role} />
    </div>
  );
}
