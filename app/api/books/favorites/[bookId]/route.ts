import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await params;

    const favorite = await prisma.bookFavorite.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    return NextResponse.json({
      isFavorited: !!favorite,
      favoritedAt: favorite?.createdAt || null,
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await params;

    const existingFavorite = await prisma.bookFavorite.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Book is not in favorites' },
        { status: 404 }
      );
    }

    await prisma.bookFavorite.delete({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    return NextResponse.json({
      message: 'Book removed from favorites',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await params;

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
      await prisma.bookFavorite.delete({
        where: {
          userId_bookId: {
            userId: session.user.id,
            bookId,
          },
        },
      });

      return NextResponse.json({
        isFavorited: false,
        message: 'Book removed from favorites',
      });
    } else {
      const favorite = await prisma.bookFavorite.create({
        data: {
          userId: session.user.id,
          bookId,
        },
      });

      return NextResponse.json({
        isFavorited: true,
        message: 'Book added to favorites',
        favoritedAt: favorite.createdAt,
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
