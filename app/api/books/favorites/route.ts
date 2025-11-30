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

    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
      book: {
        isPublished: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { authorName: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(language && { language }),
        ...(category && { category: { has: category } }),
        ...(contentType && { contentType }),
      },
    };

    const orderByField = sortBy === 'favorited' ? 'createdAt' : `book.${sortBy}`;
    const orderBy = sortBy === 'favorited'
      ? { createdAt: sortOrder as 'asc' | 'desc' }
      : { book: { [sortBy]: sortOrder as 'asc' | 'desc' } };

    const [favorites, total] = await Promise.all([
      prisma.bookFavorite.findMany({
        where: whereClause,
        include: {
          book: {
            include: {
              _count: {
                select: { reviews: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.bookFavorite.count({ where: whereClause }),
    ]);

    const books = favorites.map((fav) => ({
      ...fav.book,
      isFavorited: true,
      favoritedAt: fav.createdAt,
    }));

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
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
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const existingFavorite = await prisma.bookFavorite.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Book is already in favorites' },
        { status: 409 }
      );
    }

    const favorite = await prisma.bookFavorite.create({
      data: {
        userId: session.user.id,
        bookId,
      },
      include: {
        book: true,
      },
    });

    return NextResponse.json({
      message: 'Book added to favorites',
      favorite,
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}
