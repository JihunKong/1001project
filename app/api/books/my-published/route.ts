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
    const search = searchParams.get('search') || '';
    const language = searchParams.get('language') || '';
    const category = searchParams.get('category') || '';
    const contentType = searchParams.get('contentType') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const authorConditions: Record<string, unknown>[] = [];
    if (user.name) {
      authorConditions.push({ authorName: { contains: user.name, mode: 'insensitive' } });
    }
    if (user.email) {
      authorConditions.push({ authorName: { contains: user.email, mode: 'insensitive' } });
    }

    if (authorConditions.length === 0) {
      return NextResponse.json({
        books: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const baseWhere: Record<string, unknown> = {
      isPublished: true,
      OR: authorConditions,
    };

    if (search) {
      baseWhere.AND = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { authorName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (language) baseWhere.language = language;
    if (category) baseWhere.category = { has: category };
    if (contentType) baseWhere.contentType = contentType;

    const [books, total, favoriteBookIds] = await Promise.all([
      prisma.book.findMany({
        where: baseWhere,
        include: {
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.book.count({ where: baseWhere }),
      prisma.bookFavorite.findMany({
        where: { userId: session.user.id },
        select: { bookId: true },
      }),
    ]);

    const favoriteSet = new Set(favoriteBookIds.map((f) => f.bookId));

    const booksWithFavorites = books.map((book) => ({
      ...book,
      isFavorited: favoriteSet.has(book.id),
    }));

    return NextResponse.json({
      books: booksWithFavorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching my published books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch my published books' },
      { status: 500 }
    );
  }
}
