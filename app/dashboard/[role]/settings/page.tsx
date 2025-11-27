import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SettingsPageClient } from './SettingsPageClient';

const ALLOWED_ROLES = [
  'WRITER',
  'STORY_MANAGER',
  'BOOK_MANAGER',
  'CONTENT_ADMIN',
  'TEACHER',
  'INSTITUTION',
  'LEARNER',
];

interface SettingsPageProps {
  params: Promise<{
    role: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { role } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=/dashboard/${role}/settings`);
  }

  const normalizedRole = role.toUpperCase().replace(/-/g, '_');

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    notFound();
  }

  const userRole = session.user.role?.replace(/_/g, '-').toLowerCase();
  if (userRole !== role) {
    redirect(`/dashboard/${userRole}/settings`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const initialData = {
    name: user.name || '',
    bio: user.profile?.bio || '',
    tags: user.profile?.tags || [],
    avatarUrl: user.profile?.avatarUrl || null,
    firstName: user.profile?.firstName || '',
    lastName: user.profile?.lastName || '',
  };

  return <SettingsPageClient role={role} initialData={initialData} />;
}
