import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

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

    const review = await prisma.review.findUnique({
      where: {
        unique_user_content_review: {
          userId: session.user.id,
          contentType: 'BOOK',
          contentId: bookId,
        },
      },
    });

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        rating: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const reviewCount = await prisma.review.count({
      where: {
        contentType: 'BOOK',
        contentId: bookId,
      },
    });

    return NextResponse.json({
      userReview: review
        ? {
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            createdAt: review.createdAt,
          }
        : null,
      book: {
        id: book.id,
        title: book.title,
        averageRating: book.rating,
        reviewCount,
      },
    });
  } catch (error) {
    console.error('Error fetching book rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
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
      select: { id: true, title: true },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = ratingSchema.parse(body);

    const review = await prisma.review.upsert({
      where: {
        unique_user_content_review: {
          userId: session.user.id,
          contentType: 'BOOK',
          contentId: bookId,
        },
      },
      update: {
        rating: validatedData.rating,
        title: validatedData.title || null,
        comment: validatedData.comment || null,
      },
      create: {
        userId: session.user.id,
        contentType: 'BOOK',
        contentId: bookId,
        rating: validatedData.rating,
        title: validatedData.title || null,
        comment: validatedData.comment || null,
      },
    });

    const stats = await prisma.review.aggregate({
      where: {
        contentType: 'BOOK',
        contentId: bookId,
      },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.book.update({
      where: { id: bookId },
      data: {
        rating: stats._avg.rating || 0,
      },
    });

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt,
      },
      book: {
        averageRating: stats._avg.rating,
        reviewCount: stats._count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error submitting book rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
