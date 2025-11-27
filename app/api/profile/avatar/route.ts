import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadAvatar } from '@/lib/file-upload';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const userId = session.user.id;

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { avatarUrl: true }
    });

    const result = await uploadAvatar(file, userId, existingProfile?.avatarUrl);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        avatarUrl: result.publicUrl
      },
      update: {
        avatarUrl: result.publicUrl
      }
    });

    return NextResponse.json({
      success: true,
      avatarUrl: result.publicUrl
    });

  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Avatar upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { avatarUrl: true }
    });

    if (profile?.avatarUrl && profile.avatarUrl.startsWith('/avatars/')) {
      const { deleteFile } = await import('@/lib/file-upload');
      await deleteFile(profile.avatarUrl);
    }

    await prisma.profile.update({
      where: { userId },
      data: { avatarUrl: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Avatar delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
