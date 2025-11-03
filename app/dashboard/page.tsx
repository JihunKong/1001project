'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading' || redirectAttempted) return;

    // Timeout mechanism to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!redirectAttempted) {
        setError('Authentication is taking too long. Please try refreshing the page.');
      }
    }, 10000); // 10 seconds

    if (!session) {
      setRedirectAttempted(true);
      clearTimeout(timeout);
      router.push('/login?callbackUrl=/dashboard');
      return;
    }

    // Validate session has required data
    if (!session.user?.role) {
      setError('User role not found. Please log in again.');
      clearTimeout(timeout);
      return;
    }

    // Redirect based on user role with error handling
    try {
      setRedirectAttempted(true);
      const role = session.user.role.toLowerCase();

      const roleRoutes: Record<string, string> = {
        'learner': '/dashboard/learner',
        'teacher': '/dashboard/teacher',
        'writer': '/dashboard/writer',
        'story_manager': '/dashboard/story-manager',
        'book_manager': '/dashboard/book-manager',
        'content_admin': '/dashboard/content-admin',
        'admin': '/dashboard/admin',
        'institution': '/dashboard/institution',
      };

      const targetRoute = roleRoutes[role] || '/dashboard/learner';
      router.push(targetRoute);
      clearTimeout(timeout);
    } catch (err) {
      setError('Failed to redirect to dashboard. Please try refreshing.');
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [session, status, router, redirectAttempted]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold mb-2">Authentication Error</h2>
            <p>{error}</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-soe-green-400 hover:bg-soe-green-500 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Refresh Page
            </button>
            <button
              onClick={() => router.push('/login')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {status === 'loading' ? 'Loading your session...' : 'Redirecting to your dashboard...'}
        </p>
        {status === 'loading' && (
          <p className="mt-2 text-sm text-gray-400">This may take a few seconds</p>
        )}
      </div>
    </div>
  );
}