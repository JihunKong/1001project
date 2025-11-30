import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: collectionId } = await params;

    const collection = await prisma.resourceCollection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    const resource = await prisma.teacherResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const existingItem = await prisma.teacherResourceCollectionItem.findUnique({
      where: {
        resourceId_collectionId: {
          resourceId,
          collectionId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Resource already in collection' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.teacherResourceCollectionItem.create({
        data: {
          collectionId,
          resourceId,
        },
      }),
      prisma.resourceCollection.update({
        where: { id: collectionId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding resource to collection:', error);
    return NextResponse.json(
      { error: 'Failed to add resource to collection' },
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

    const { id: collectionId } = await params;

    const collection = await prisma.resourceCollection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    const existingItem = await prisma.teacherResourceCollectionItem.findUnique({
      where: {
        resourceId_collectionId: {
          resourceId,
          collectionId,
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Resource not in collection' },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.teacherResourceCollectionItem.delete({
        where: {
          resourceId_collectionId: {
            resourceId,
            collectionId,
          },
        },
      }),
      prisma.resourceCollection.update({
        where: { id: collectionId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing resource from collection:', error);
    return NextResponse.json(
      { error: 'Failed to remove resource from collection' },
      { status: 500 }
    );
  }
}
