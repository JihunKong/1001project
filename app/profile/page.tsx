import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { calculateStats } from '@/lib/profile-stats';
import { UserRole } from '@prisma/client';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true
    }
  });

  if (!user) {
    redirect('/login');
  }

  const stats = await calculateStats(session.user.id, session.user.role as UserRole);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Main Content Area - starts at 340px from left, ends at 1440px */}
      <div className="flex-1 ms-[240px] me-[480px] px-[100px] py-10">
        {/* Page Title */}
        <h1
          className="text-center mb-8 text-[#141414] font-medium"
          style={{ fontSize: '48px' }}
        >
          {user.name}
        </h1>

        {/* Tab Navigation */}
        <ProfileTabs activeTab="overview" />

        {/* Overview Content */}
        <ProfileOverview user={user} role={session.user.role} />
      </div>

      {/* Right Sidebar Panel - fixed at 1440px, 480px wide */}
      <div
        className="fixed end-0 top-0 w-[480px] h-screen border-s border-[#E5E5EA] bg-white p-10 overflow-y-auto"
      >
        <ProfileCard user={user} stats={stats} />
      </div>
    </div>
  );
}
