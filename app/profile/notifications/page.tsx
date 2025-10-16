'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';

export default function NotificationPreferencesPage() {
  const { data: session, status } = useSession();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    const role = session?.user?.role;
    switch (role) {
      case 'WRITER':
        return '/dashboard/writer';
      case 'TEACHER':
        return '/dashboard/teacher';
      case 'LEARNER':
        return '/dashboard/learner';
      case 'STORY_MANAGER':
        return '/dashboard/story-manager';
      case 'BOOK_MANAGER':
        return '/dashboard/book-manager';
      case 'CONTENT_ADMIN':
        return '/dashboard/content-admin';
      case 'ADMIN':
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={getDashboardUrl()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-sm text-gray-600">Manage how and when you receive notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationPreferences />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Email notifications:</strong> Receive important updates via email. We recommend keeping this enabled for critical status changes.
            </p>
            <p>
              <strong>Browser notifications:</strong> Get instant alerts while you&apos;re browsing. Your browser may ask for permission first.
            </p>
            <p>
              <strong>Email digest:</strong> Get a summary of your activity. Weekly digests help you stay informed without overwhelming your inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}