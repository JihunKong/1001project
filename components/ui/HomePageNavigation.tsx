'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, LayoutDashboard } from 'lucide-react';

export default function HomePageNavigation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';
  // More strict authentication check - require user email
  const isAuthenticated = !!(session?.user?.email);
  const user = session?.user;

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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-soe-green-400" />
            <span className="ml-2 text-xl font-bold text-gray-900">1001 Stories</span>
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : isAuthenticated && user ? (
              // Authenticated user navigation
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.name || user.email}
                </span>
                <button
                  onClick={handleDashboard}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              // Unauthenticated user navigation
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}