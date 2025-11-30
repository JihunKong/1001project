import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const collection = await prisma.resourceCollection.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        items: {
          include: {
            resource: {
              include: {
                author: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const isOwner = collection.userId === session.user.id;
    if (!isOwner && !collection.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const favoriteIds = await prisma.teacherResourceFavorite.findMany({
      where: { userId: session.user.id },
      select: { resourceId: true },
    });
    const favoriteSet = new Set(favoriteIds.map((f) => f.resourceId));

    const resources = collection.items.map((item) => ({
      ...item.resource,
      isFavorited: favoriteSet.has(item.resource.id),
      addedToCollectionAt: item.addedAt,
    }));

    return NextResponse.json({
      ...collection,
      itemCount: collection._count.items,
      resources,
      isOwner,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const collection = await prisma.resourceCollection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isPublic } = body;

    const updatedCollection = await prisma.resourceCollection.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({
      ...updatedCollection,
      itemCount: updatedCollection._count.items,
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const collection = await prisma.resourceCollection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.resourceCollection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
