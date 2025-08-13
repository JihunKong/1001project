'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Redirect based on user role
    const role = session.user.role;
    switch (role) {
      case 'TEACHER':
        router.push('/dashboard/teacher');
        break;
      case 'INSTITUTION':
        router.push('/dashboard/institution');
        break;
      case 'VOLUNTEER':
        router.push('/volunteer');
        break;
      case 'ADMIN':
        router.push('/admin');
        break;
      default:
        router.push('/dashboard/learner');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}