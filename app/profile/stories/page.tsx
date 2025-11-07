import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileStories } from '@/components/profile/ProfileStories';

export default async function ProfileStoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/profile/stories');
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

  const statsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/profile/stats`, {
    headers: {
      cookie: `next-auth.session-token=${session.user.id}`
    }
  });

  const stats = statsResponse.ok ? await statsResponse.json() : {};

  return (
    <div className="flex min-h-screen bg-white">
      {/* Main Content Area */}
      <div className="flex-1 ml-[240px] mr-[480px] px-[100px] py-10">
        {/* Page Title */}
        <h1
          className="text-center mb-8 text-[#141414] font-medium"
          style={{ fontSize: '48px' }}
        >
          {user.name}
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-[#E5E5EA] mb-8">
          <Link
            href="/profile"
            className="pb-3 px-1 border-b-2 border-transparent hover:border-[#8E8E93] text-[#8E8E93] hover:text-[#141414] transition-colors"
            style={{ fontSize: '18px' }}
          >
            Overview
          </Link>
          <button
            className="pb-3 px-1 border-b-2 border-[#141414] font-medium text-[#141414]"
            style={{ fontSize: '18px' }}
          >
            Stories
          </button>
        </div>

        {/* Stories Content */}
        <ProfileStories userId={user.id} role={session.user.role} />
      </div>

      {/* Right Sidebar Panel */}
      <div
        className="fixed right-0 top-0 w-[480px] h-screen border-l border-[#E5E5EA] bg-white p-10 overflow-y-auto"
      >
        <ProfileCard user={user} stats={stats} />
      </div>
    </div>
  );
}
