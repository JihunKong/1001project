'use client';

import WriterLNB from '@/components/figma/layout/WriterLNB';
import GlobalNavigationBar from '@/components/figma/layout/GlobalNavigationBar';

export default function WriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WriterLNB />
      <GlobalNavigationBar />

      <div className="lg:ml-60 pt-[80px]">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
