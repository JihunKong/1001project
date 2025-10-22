'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { UserRole } from '@prisma/client';

export default function WriterNotificationsPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== UserRole.WRITER) {
      redirect('/dashboard');
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#874FFF] mx-auto"></div>
          <p className="mt-4 text-figma-gray-inactive">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-role="writer" className="min-h-screen pb-20 lg:pb-4">
      <div className="max-w-[1240px] px-4 sm:px-8 lg:px-12 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-figma-black">Notifications</h1>
          <p className="text-sm text-figma-gray-inactive mt-1">Stay updated on your story progress</p>
        </div>

        <NotificationCenter />
      </div>
    </div>
  );
}