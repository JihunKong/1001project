import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'favorites';

  try {
    if (filter === 'favorites') {
      const favorites = await prisma.bookFavorite.findMany({
        where: { userId: session.user.id },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authorName: true,
              coverImage: true,
              language: true,
              ageRange: true,
              readingProgress: {
                where: { userId: session.user.id },
                select: { percentComplete: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const books = favorites.map(fav => ({
        id: fav.book.id,
        title: fav.book.title,
        authorName: fav.book.authorName,
        coverImage: fav.book.coverImage,
        language: fav.book.language,
        ageRange: fav.book.ageRange,
        progress: fav.book.readingProgress[0]?.percentComplete || 0,
        isFavorited: true
      }));

      return NextResponse.json({ books, total: books.length });
    }

    return NextResponse.json({ books: [], total: 0 });
  } catch (error) {
    console.error('Error fetching user library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500 }
    );
  }
}
