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

  const managementRoles = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN'];
  if (managementRoles.includes(session.user.role as string)) {
    const rolePathMap: Record<string, string> = {
      'STORY_MANAGER': '/dashboard/story-manager',
      'BOOK_MANAGER': '/dashboard/book-manager',
      'CONTENT_ADMIN': '/dashboard/content-admin',
    };
    redirect(rolePathMap[session.user.role as string] || '/dashboard');
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
    <div className="min-h-screen bg-white">
      <div className="lg:pr-[350px] px-4 lg:ps-8 py-10">
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
