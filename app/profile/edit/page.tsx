'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login?callbackUrl=/profile/edit');
      return;
    }

    // Fetch user data
    fetch('/api/profile/data')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push('/login');
        } else {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soe-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 ms-[240px] px-[100px] py-10 max-w-[800px]">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#8E8E93] hover:text-[#141414] transition-colors mb-8"
          style={{ fontSize: '16px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('profile.edit.backToProfile')}
        </Link>

        <h1
          className="text-[#141414] font-medium mb-8"
          style={{ fontSize: '48px', lineHeight: '1.221' }}
        >
          {t('profile.edit.title')}
        </h1>

        <ProfileEditForm user={user} />
      </div>
    </div>
  );
}
