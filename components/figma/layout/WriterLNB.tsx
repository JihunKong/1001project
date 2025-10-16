'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bookmark, User, FileText } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard/writer',
    icon: Home
  },
  {
    id: 'library',
    label: 'Library',
    href: '/dashboard/writer/library',
    icon: Bookmark
  },
  {
    id: 'stories',
    label: 'Stories',
    href: '/dashboard/writer/stories',
    icon: FileText
  }
];

export default function WriterLNB() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.href === '/dashboard/writer') {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  return (
    <aside
      className="w-60 bg-white border-r border-[#E5E5EA] fixed left-0 top-0 bottom-0 hidden lg:flex lg:flex-col overflow-y-auto z-10"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-2 px-6 border-b border-[#E5E5EA] h-[60px]">
        <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center">
          <span className="text-white text-sm font-semibold">1001</span>
        </div>
        <span className="text-lg font-semibold text-[#141414]">Stories</span>
      </div>

      <div className="flex flex-col gap-4 p-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 transition-colors ${
                active
                  ? 'text-[#141414] font-medium text-lg'
                  : 'text-[#8E8E93] font-normal text-lg hover:text-[#141414]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
