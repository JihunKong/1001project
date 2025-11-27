import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  avatarUrl: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().max(500).optional().nullable(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const userId = session.user.id;

    const updateData: any = {};
    const profileUpdateData: any = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.bio !== undefined) {
      profileUpdateData.bio = validatedData.bio;
    }

    if (validatedData.tags !== undefined) {
      profileUpdateData.tags = validatedData.tags;
    }

    if (validatedData.avatarUrl !== undefined) {
      profileUpdateData.avatarUrl = validatedData.avatarUrl;
    }

    if (validatedData.coverImageUrl !== undefined) {
      profileUpdateData.coverImageUrl = validatedData.coverImageUrl;
    }

    if (validatedData.firstName !== undefined) {
      profileUpdateData.firstName = validatedData.firstName;
    }

    if (validatedData.lastName !== undefined) {
      profileUpdateData.lastName = validatedData.lastName;
    }

    const [user, profile] = await Promise.all([
      Object.keys(updateData).length > 0
        ? prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true }
          })
        : prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }
          }),
      Object.keys(profileUpdateData).length > 0
        ? prisma.profile.upsert({
            where: { userId },
            create: {
              userId,
              ...profileUpdateData
            },
            update: profileUpdateData,
            select: {
              bio: true,
              tags: true,
              avatarUrl: true,
              coverImageUrl: true,
              firstName: true,
              lastName: true
            }
          })
        : prisma.profile.findUnique({
            where: { userId },
            select: {
              bio: true,
              tags: true,
              avatarUrl: true,
              coverImageUrl: true,
              firstName: true,
              lastName: true
            }
          })
    ]);

    return NextResponse.json({
      success: true,
      user,
      profile
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
