'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bookmark, User, FileText, Users, Settings, BookOpen, PlusCircle, FileSearch } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WriterLNBProps {
  role?: string;
}

export default function WriterLNB({ role = 'writer' }: WriterLNBProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const getNavItems = (userRole: string): NavItem[] => {
    if (userRole === 'admin') {
      return [
        {
          id: 'home',
          label: t('nav.home'),
          href: '/dashboard/admin',
          icon: Home
        },
        {
          id: 'users',
          label: t('nav.users'),
          href: '/dashboard/admin/users',
          icon: Users
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          href: '/dashboard/admin/settings',
          icon: Settings
        }
      ];
    }

    if (userRole === 'story-manager') {
      return [
        {
          id: 'home',
          label: t('nav.home'),
          href: '/dashboard/story-manager',
          icon: Home
        },
        {
          id: 'register-book',
          label: t('nav.registerBook'),
          href: '/dashboard/story-manager/register-book',
          icon: PlusCircle
        },
        {
          id: 'review',
          label: t('nav.storyReview'),
          href: '/dashboard/story-manager/reviews',
          icon: FileSearch
        },
        {
          id: 'books',
          label: t('nav.manageBooks'),
          href: '/dashboard/story-manager/books',
          icon: BookOpen
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          href: '/dashboard/story-manager/settings',
          icon: Settings
        }
      ];
    }

    if (userRole === 'book-manager') {
      return [
        {
          id: 'home',
          label: t('nav.home'),
          href: '/dashboard/book-manager',
          icon: Home
        },
        {
          id: 'register-book',
          label: t('nav.registerBook'),
          href: '/dashboard/book-manager/register-book',
          icon: PlusCircle
        },
        {
          id: 'review',
          label: t('nav.formatReview'),
          href: '/dashboard/book-manager/reviews',
          icon: FileSearch
        },
        {
          id: 'books',
          label: t('nav.manageBooks'),
          href: '/dashboard/book-manager/books',
          icon: BookOpen
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          href: '/dashboard/book-manager/settings',
          icon: Settings
        }
      ];
    }

    if (userRole === 'content-admin') {
      return [
        {
          id: 'home',
          label: t('nav.home'),
          href: '/dashboard/content-admin',
          icon: Home
        },
        {
          id: 'register-book',
          label: t('nav.registerBook'),
          href: '/dashboard/content-admin/register-book',
          icon: PlusCircle
        },
        {
          id: 'review',
          label: t('nav.contentReview'),
          href: '/dashboard/content-admin/reviews',
          icon: FileSearch
        },
        {
          id: 'books',
          label: t('nav.manageBooks'),
          href: '/dashboard/content-admin/books',
          icon: BookOpen
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          href: '/dashboard/content-admin/settings',
          icon: Settings
        }
      ];
    }

    return [
      {
        id: 'home',
        label: t('nav.home'),
        href: '/dashboard/writer',
        icon: Home
      },
      {
        id: 'library',
        label: t('nav.library'),
        href: '/dashboard/writer/library',
        icon: Bookmark
      },
      {
        id: 'mypage',
        label: t('nav.myPage'),
        href: '/profile',
        icon: User
      },
      {
        id: 'stories',
        label: t('nav.myStories'),
        href: '/dashboard/writer/stories',
        icon: FileText
      },
      {
        id: 'settings',
        label: t('nav.settings'),
        href: '/dashboard/writer/settings',
        icon: Settings
      }
    ];
  };

  const navItems = getNavItems(role);
  const basePath = `/dashboard/${role}`;

  const isActive = (item: NavItem) => {
    if (item.href === basePath) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside
        className="w-60 bg-white border-r border-figma-gray-border fixed left-0 top-0 bottom-0 hidden lg:flex lg:flex-col overflow-y-auto z-10"
        role="navigation"
        aria-label={t('nav.mainNavigation')}
      >
        {/* Skip Navigation Link for Screen Readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-figma-black focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-4 focus:ring-soe-green-400"
        >
          {t('nav.skipToMain')}
        </a>

        <div className="flex items-center gap-2 px-4 border-b border-figma-gray-border h-[80px]">
          <div className="w-10 h-10 bg-figma-black rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-semibold">1001</span>
          </div>
          <span className="text-lg font-semibold text-figma-black">Stories</span>
        </div>

        <div className="flex flex-col gap-4 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 py-2 transition-colors min-h-[44px] ${
                  active
                    ? 'text-figma-black font-medium text-lg'
                    : 'text-figma-gray-inactive font-normal text-lg hover:text-figma-black'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {active && <span className="sr-only">({t('nav.currentPage')})</span>}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-figma-gray-border z-50 pb-safe"
        role="navigation"
        aria-label={t('nav.mobileNavigation')}
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 transition-colors min-h-[56px] min-w-[64px] ${
                  active
                    ? 'text-figma-black'
                    : 'text-figma-gray-inactive hover:text-figma-black'
                }`}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
                {active && <span className="sr-only">({t('nav.currentPage')})</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
