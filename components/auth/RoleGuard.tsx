'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { ReactNode, useEffect } from 'react';
import { ShieldOff, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
  showUnauthorized?: boolean;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackUrl = '/dashboard',
  showUnauthorized = true 
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = session.user.role || UserRole.LEARNER;
    if (!allowedRoles.includes(userRole)) {
      if (!showUnauthorized) {
        router.push(fallbackUrl);
      }
    }
  }, [session, status, allowedRoles, fallbackUrl, router, showUnauthorized]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check role
  const userRole = session.user.role || UserRole.LEARNER;
  if (!allowedRoles.includes(userRole)) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <ShieldOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don&apos;t have permission to access this page. This area is restricted to {allowedRoles.join(', ')} users only.
            </p>
            <button
              onClick={() => router.push(fallbackUrl)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  // Authorized
  return <>{children}</>;
}

// Utility component for conditional rendering based on role
interface RoleBasedRenderProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleBasedRender({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedRenderProps) {
  const { data: session } = useSession();
  
  if (!session) return <>{fallback}</>;
  
  const userRole = session.user.role || UserRole.LEARNER;
  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}