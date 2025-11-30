import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    const resourceWhere: Prisma.TeacherResourceWhereInput = {
      isPublished: true,
    };

    if (search) {
      resourceWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      resourceWhere.type = type as Prisma.EnumTeacherResourceTypeFilter;
    }

    if (subject) {
      resourceWhere.subject = subject;
    }

    if (grade) {
      resourceWhere.grade = grade;
    }

    const favoriteWhere: Prisma.TeacherResourceFavoriteWhereInput = {
      userId: session.user.id,
      resource: resourceWhere,
    };

    let orderBy: Prisma.TeacherResourceOrderByWithRelationInput = {};
    if (sortBy === 'popular') {
      orderBy = { downloadCount: sortOrder };
    } else if (sortBy === 'rating') {
      orderBy = { rating: sortOrder };
    } else if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const [favorites, total] = await Promise.all([
      prisma.teacherResourceFavorite.findMany({
        where: favoriteWhere,
        include: {
          resource: {
            include: {
              author: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
        orderBy: { resource: orderBy },
        skip,
        take: limit,
      }),
      prisma.teacherResourceFavorite.count({ where: favoriteWhere }),
    ]);

    const resources = favorites.map((fav) => ({
      ...fav.resource,
      isFavorited: true,
      favoritedAt: fav.createdAt,
    }));

    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching favorite resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite resources' },
      { status: 500 }
    );
  }
}
