import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await params;

    const resource = await prisma.teacherResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const existingFavorite = await prisma.teacherResourceFavorite.findUnique({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Resource already favorited' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.teacherResourceFavorite.create({
        data: {
          userId: session.user.id,
          resourceId,
        },
      }),
      prisma.teacherResource.update({
        where: { id: resourceId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, isFavorited: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await params;

    const existingFavorite = await prisma.teacherResourceFavorite.findUnique({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.teacherResourceFavorite.delete({
        where: {
          userId_resourceId: {
            userId: session.user.id,
            resourceId,
          },
        },
      }),
      prisma.teacherResource.update({
        where: { id: resourceId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, isFavorited: false });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
