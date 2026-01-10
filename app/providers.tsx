'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import DirectionUpdater from '@/components/i18n/DirectionUpdater';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { CookieConsent } from '@/components/CookieConsent';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DirectionUpdater />
      <NotificationProvider>
        {children}
      </NotificationProvider>
      <Toaster />
      <CookieConsent />
    </SessionProvider>
  );
}