import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.resourceCollection.findMany({
        where: { userId: session.user.id },
        include: {
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
            take: 4,
            orderBy: { addedAt: 'desc' },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.resourceCollection.count({
        where: { userId: session.user.id },
      }),
    ]);

    const collectionsWithMeta = collections.map((collection) => ({
      ...collection,
      itemCount: collection._count.items,
      previewResources: collection.items.map((item) => item.resource),
    }));

    return NextResponse.json({
      collections: collectionsWithMeta,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPublic = false } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const collection = await prisma.resourceCollection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(
      {
        ...collection,
        itemCount: collection._count.items,
        previewResources: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
