import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import Providers from './providers';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage, isRTLLanguage } from '@/lib/i18n/language-cookie';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#9fcc40',
};

export const metadata: Metadata = {
  title: '1001 Stories - Global Education Platform',
  description: 'Discover, publish, and share stories from children in underserved communities worldwide.',
  keywords: ['education', 'stories', 'children', 'global', 'non-profit'],
  authors: [{ name: '1001 Stories Team' }],
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const language = (headersList.get('x-user-language') || 'en') as SupportedLanguage;
  const isRTL = isRTLLanguage(language);

  return (
    <html lang={language} dir={isRTL ? 'rtl' : 'ltr'}>
      <body className={inter.className}>
        <LanguageProvider initialLanguage={language}>
          <Providers>
            {children}
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}