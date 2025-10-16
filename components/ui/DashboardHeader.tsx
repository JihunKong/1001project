'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Home, LogOut, User } from 'lucide-react';
import BuildInfo from './BuildInfo';

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = !!(session?.user?.email);
  const user = session?.user;

  const handleGoHome = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                1001 Stories
              </h1>
            </div>
            {title && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <h2 className="text-lg font-medium text-gray-700">
                    {title}
                  </h2>
                </div>
              </div>
            )}
            <div className="ml-4">
              <BuildInfo showOnHover={true} />
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            {isAuthenticated && user && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {user?.name || user?.email}
                    </div>
                    <div className="text-gray-500">
                      {user?.role || ''}
                    </div>
                  </div>
                </div>

                {/* Mobile user indicator */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-center w-8 h-8 bg-soe-green-50 rounded-full">
                    <User className="h-4 w-4 text-soe-green-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Home button */}
              <button
                onClick={handleGoHome}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soe-green-400"
                title="Go to Homepage"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Home</span>
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}