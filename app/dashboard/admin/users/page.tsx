'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserManagementSection } from '@/components/admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'ADMIN') {
      redirect('/dashboard');
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all system users, roles, and permissions
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagementSection />
      </div>
    </div>
  );
}
