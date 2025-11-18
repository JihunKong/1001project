'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, LayoutDashboard, ChevronDown, Globe } from 'lucide-react';
import { useState } from 'react';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function HomePageNavigation() {
  const { t } = useTranslation();
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
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: '#DCEEC3',
        height: '80px'
      }}
    >
      <div className="max-w-[1240px] mx-auto px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BookOpen
              className="w-8 h-8"
              style={{ color: '#608A3A' }}
            />
            <span
              style={{
                fontFamily: 'Poppins',
                fontSize: '24px',
                fontWeight: 600,
                color: '#608A3A'
              }}
            >
              1001 Stories
            </span>
          </Link>

          {/* Center Navigation Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/about"
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 500,
                color: '#2B2B2B'
              }}
              className="hover:opacity-70 transition-opacity"
            >
              {t('nav.aboutUs')}
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setShowProgramsMenu(true)}
              onMouseLeave={() => setShowProgramsMenu(false)}
            >
              <button
                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#2B2B2B'
                }}
              >
                {t('nav.programs')}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showProgramsMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2">
                  <Link
                    href="/programs/kid-library"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#2B2B2B'
                    }}
                  >
                    {t('programs.kidLibrary.title')}
                  </Link>
                  <Link
                    href="/programs/writing-volunteer"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#2B2B2B'
                    }}
                  >
                    {t('programs.writingVolunteer.title')}
                  </Link>
                  <Link
                    href="/programs/english-learning"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#2B2B2B'
                    }}
                  >
                    {t('programs.englishLearning.title')}
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/library"
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 500,
                color: '#2B2B2B'
              }}
              className="hover:opacity-70 transition-opacity"
            >
              {t('nav.library')}
            </Link>

            <Link
              href="/signup?role=writer"
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 500,
                color: '#2B2B2B'
              }}
              className="hover:opacity-70 transition-opacity"
            >
              {t('nav.volunteer')}
            </Link>
          </div>

          {/* Right Side - Language + Auth Buttons */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <LanguageSelector variant="compact" />
            </div>

            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-full"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDashboard}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full hover:opacity-70 transition-opacity"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#2B2B2B'
                  }}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#2B2B2B'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full hover:opacity-70 transition-opacity"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#2B2B2B'
                  }}
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-full hover:opacity-90 transition-opacity shadow-md"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)'
                  }}
                >
                  {t('nav.signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
