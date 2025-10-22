'use client';

import { useSession, signOut } from 'next-auth/react';
import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface GlobalNavigationBarProps {
  className?: string;
}

export default function GlobalNavigationBar({ className = '' }: GlobalNavigationBarProps) {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showUserMenu) return;

      // Escape key closes menu
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        return;
      }

      // Tab key: trap focus within menu
      if (e.key === 'Tab') {
        const menuElement = document.querySelector('[role="menu"]');
        if (!menuElement) return;

        const focusableElements = menuElement.querySelectorAll(
          'a[href], button:not([disabled])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          // Shift+Tab: move to last if at first
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move to first if at last
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (showUserMenu) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showUserMenu]);

  return (
    <header
      className={`
        fixed top-0 left-0 lg:left-60 right-0 z-40
        bg-white
        border-b border-figma-gray-border
        ${className}
      `}
    >
      <div className="flex items-center justify-between px-8 h-[80px]">
        <div className="lg:hidden">
          <Link href="/dashboard/writer" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-semibold">1001</span>
            </div>
            <span className="text-lg font-semibold text-figma-black">Stories</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <NotificationDropdown />


          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-figma-gray-inactive hover:bg-gray-50 hover:text-figma-black transition-all"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-10 h-10 rounded-full border border-figma-gray-border bg-[#141414] flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'W'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-figma-black">
                  {session?.user?.name || 'Writer'}
                </p>
                <p className="text-xs text-figma-gray-inactive">
                  {session?.user?.role || 'WRITER'}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-figma-gray-border z-20"
                  role="menu"
                  aria-label="User menu"
                >
                  <div className="p-3 border-b border-figma-gray-border">
                    <p className="text-sm font-medium text-figma-black">
                      {session?.user?.name || 'Writer'}
                    </p>
                    <p className="text-xs text-figma-gray-inactive mt-1">
                      {session?.user?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/help"
                      className="block px-3 py-2 text-sm text-figma-gray-inactive hover:bg-gray-50 hover:text-figma-black rounded-lg transition-all"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Help & Support
                    </Link>
                  </div>
                  <div className="p-2 border-t border-figma-gray-border">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut({ callbackUrl: '/login' });
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
