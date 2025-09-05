import { redirect } from 'next/navigation';
import { supportedLocales } from '@/lib/language';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function LanguageRedirect({
  params
}: PageProps) {
  const { lang } = await params;
  // Set cookie and redirect to home
  if (supportedLocales.includes(lang as typeof supportedLocales[number])) {
    // Note: In server components, we can't directly set cookies
    // The middleware should handle this, but as a fallback we redirect
    redirect('/');
  }
  
  // If not a supported language, show 404
  redirect('/404');
}

export async function generateStaticParams() {
  return supportedLocales.map((lang) => ({
    lang: lang,
  }));
}