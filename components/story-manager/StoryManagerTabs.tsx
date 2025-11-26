'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function StoryManagerTabs() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'submissions',
      label: t('dashboard.storyManager.tabs.submissions'),
      href: '/dashboard/story-manager'
    },
    {
      id: 'books',
      label: t('dashboard.storyManager.tabs.books'),
      href: '/dashboard/story-manager/books'
    },
    {
      id: 'register',
      label: t('dashboard.storyManager.tabs.registerBook'),
      href: '/dashboard/story-manager/register-book'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/story-manager') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="border-b border-[#E5E5EA] mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative pb-4 text-base transition-all ${
                isActive(tab.href)
                  ? 'border-b-2 border-[#141414] text-[#141414] font-medium'
                  : 'border-b-2 border-transparent text-[#8E8E93] hover:text-[#141414]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
