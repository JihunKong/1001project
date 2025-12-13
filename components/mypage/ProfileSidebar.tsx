'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ProfileSidebarProps {
  user: {
    name: string;
    avatarUrl?: string;
    bio?: string;
    role: string;
  };
  tags: Tag[];
}

const tagColors: Record<string, { bg: string; text: string }> = {
  blue: { bg: '#E3F2FD', text: '#1976D2' },
  green: { bg: '#E8F5E9', text: '#388E3C' },
  orange: { bg: '#FFF3E0', text: '#F57C00' },
  purple: { bg: '#F3E5F5', text: '#7B1FA2' },
  pink: { bg: '#FCE4EC', text: '#C2185B' }
};

export function ProfileSidebar({ user, tags }: ProfileSidebarProps) {
  const { t } = useTranslation();
  const role = user.role?.toLowerCase() || 'writer';

  return (
    <div className="bg-white border-l border-[#E5E5EA] p-6 flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-[80px] h-[80px] rounded-full bg-[#E5E5EA] flex items-center justify-center overflow-hidden border border-[#E5E5EA]">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
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
          className="text-[#141414] font-medium text-center"
          style={{ fontSize: '17px' }}
        >
          {user.name}
        </h2>

        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {tags.map((tag) => {
              const colors = tagColors[tag.color] || tagColors.blue;
              return (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text
                  }}
                >
                  #{tag.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {user.bio && (
        <p
          className="text-[#484C56] text-center"
          style={{ fontSize: '14px', lineHeight: 1.5 }}
        >
          {user.bio}
        </p>
      )}

      <Link
        href={`/dashboard/${role}/settings`}
        className="w-full text-center border border-[#16A34A] text-[#16A34A] py-2 rounded-lg hover:bg-[#E8F5E9] transition-colors text-sm font-medium"
      >
        {t('myPage.profile.editProfile')}
      </Link>
    </div>
  );
}
