import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { calculateStats } from '@/lib/profile-stats';
import { UserRole } from '@prisma/client';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/profile');
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
      <div className="flex-1 px-4 lg:px-[100px] lg:pe-[100px] py-10 max-w-7xl mx-auto">
        <h1
          className="text-center mb-8 text-[#141414] font-medium"
          style={{ fontSize: '48px' }}
        >
          {user.name}
        </h1>

        <ProfileTabs activeTab="overview" />

        <ProfileOverview user={user} role={session.user.role} />
      </div>

      <div
        className="hidden lg:block fixed end-0 top-[73px] w-[350px] h-[calc(100vh-73px)] border-s border-[#E5E5EA] bg-white p-8 overflow-y-auto"
      >
        <ProfileCard user={user} stats={stats} />
      </div>
    </div>
  );
}
