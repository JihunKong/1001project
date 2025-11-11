import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/profile/edit');
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

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 ms-[240px] px-[100px] py-10 max-w-[800px]">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#8E8E93] hover:text-[#141414] transition-colors mb-8"
          style={{ fontSize: '16px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to profile
        </Link>

        <h1
          className="text-[#141414] font-medium mb-8"
          style={{ fontSize: '48px', lineHeight: '1.221' }}
        >
          Edit Profile
        </h1>

        <ProfileEditForm user={user} />
      </div>
    </div>
  );
}
