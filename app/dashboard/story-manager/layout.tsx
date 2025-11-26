'use client';

import WriterLNB from '@/components/figma/layout/WriterLNB';
import GlobalNavigationBar from '@/components/figma/layout/GlobalNavigationBar';

export default function StoryManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WriterLNB role="story-manager" />
      <GlobalNavigationBar />

      <div className="lg:ml-60 pt-[80px]">
        <main className="min-h-screen" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
