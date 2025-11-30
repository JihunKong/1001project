import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TeacherResourceType, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const subject = searchParams.get('subject') || '';
    const grade = searchParams.get('grade') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    const where: Prisma.TeacherResourceWhereInput = {
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type as TeacherResourceType;
    }

    if (subject) {
      where.subject = subject;
    }

    if (grade) {
      where.grade = grade;
    }

    const orderBy: Prisma.TeacherResourceOrderByWithRelationInput = {};
    if (sortBy === 'popular') {
      orderBy.downloadCount = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [resources, total, favoriteIds] = await Promise.all([
      prisma.teacherResource.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.teacherResource.count({ where }),
      prisma.teacherResourceFavorite.findMany({
        where: { userId: session.user.id },
        select: { resourceId: true },
      }),
    ]);

    const favoriteSet = new Set(favoriteIds.map((f) => f.resourceId));

    const resourcesWithFavorites = resources.map((resource) => ({
      ...resource,
      isFavorited: favoriteSet.has(resource.id),
    }));

    return NextResponse.json({
      resources: resourcesWithFavorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teacher resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher resources' },
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

    const allowedRoles = ['TEACHER', 'ADMIN', 'CONTENT_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, subject, grade, fileUrl, fileSize, duration, thumbnailUrl } = body;

    if (!title || !type || !subject || !grade || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resource = await prisma.teacherResource.create({
      data: {
        title,
        description,
        type: type as TeacherResourceType,
        subject,
        grade,
        fileUrl,
        fileSize,
        duration,
        thumbnailUrl,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher resource:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher resource' },
      { status: 500 }
    );
  }
}
