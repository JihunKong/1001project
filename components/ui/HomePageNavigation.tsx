'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';

export default function HomePageNavigation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';
  const isAuthenticated = !!(session?.user?.email);
  const user = session?.user;
  const [showProgramsMenu, setShowProgramsMenu] = useState(false);

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <nav className="bg-white border-b border-[#DADADA] fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <BookOpen className="h-7 w-7 text-[#91C549]" />
            <span className="ml-2 text-2xl font-semibold text-[#91C549]" style={{ fontFamily: 'Poppins' }}>
              1001 Stories
            </span>
          </Link>

          {/* Center Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/about"
              className="text-[#2B2B2B] hover:text-[#91C549] font-medium transition-colors"
              style={{ fontFamily: 'Poppins', fontSize: '16px' }}
            >
              About US
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setShowProgramsMenu(true)}
              onMouseLeave={() => setShowProgramsMenu(false)}
            >
              <button
                className="flex items-center text-[#2B2B2B] hover:text-[#91C549] font-medium transition-colors"
                style={{ fontFamily: 'Poppins', fontSize: '16px' }}
              >
                Programs
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>

              {showProgramsMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                  <Link
                    href="/programs/english-learning"
                    className="block px-4 py-2 text-[#2B2B2B] hover:bg-gray-50 hover:text-[#91C549] transition-colors"
                    style={{ fontFamily: 'Poppins', fontSize: '14px' }}
                  >
                    English Learning Programs
                  </Link>
                  <Link
                    href="/programs/writing-volunteer"
                    className="block px-4 py-2 text-[#2B2B2B] hover:bg-gray-50 hover:text-[#91C549] transition-colors"
                    style={{ fontFamily: 'Poppins', fontSize: '14px' }}
                  >
                    Writing Volunteer
                  </Link>
                  <Link
                    href="/programs/kid-library"
                    className="block px-4 py-2 text-[#2B2B2B] hover:bg-gray-50 hover:text-[#91C549] transition-colors"
                    style={{ fontFamily: 'Poppins', fontSize: '14px' }}
                  >
                    Kid Library
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/library"
              className="text-[#2B2B2B] hover:text-[#91C549] font-medium transition-colors"
              style={{ fontFamily: 'Poppins', fontSize: '16px' }}
            >
              Library
            </Link>

            <Link
              href="/signup?role=writer"
              className="text-[#2B2B2B] hover:text-[#91C549] font-medium transition-colors"
              style={{ fontFamily: 'Poppins', fontSize: '16px' }}
            >
              Volunteer
            </Link>
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="flex items-center space-x-4">
            <LanguageSelector variant="compact" />
            {loading ? (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-10 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-full"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleDashboard}
                  className="inline-flex items-center text-[#2B2B2B] hover:text-[#91C549] px-4 py-2 rounded-full font-medium transition-colors"
                  style={{ fontFamily: 'Poppins', fontSize: '16px' }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center border border-gray-300 text-[#2B2B2B] hover:bg-gray-50 px-4 py-2 rounded-full font-medium transition-colors"
                  style={{ fontFamily: 'Poppins', fontSize: '16px' }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[#2B2B2B] hover:text-[#91C549] px-5 py-2 rounded-full font-medium transition-colors"
                  style={{ fontFamily: 'Poppins', fontSize: '16px' }}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-[#04A59D] to-[#91C549] hover:opacity-90 text-white px-6 py-3 rounded-full font-medium transition-opacity shadow-md"
                  style={{ fontFamily: 'Poppins', fontSize: '16px' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}