import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET /api/books/[id]/translation?language=ko
// Fetch translated content for a specific book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      );
    }

    // Verify the book exists and is accessible
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        language: true,
        isPublished: true,
        visibility: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check access based on visibility
    const session = await getServerSession(authOptions);
    if (!book.isPublished && !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the translation
    const translation = await prisma.translation.findUnique({
      where: {
        bookId_toLanguage: {
          bookId,
          toLanguage: language
        }
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        toLanguage: true,
        fromLanguage: true,
        status: true,
        isAIGenerated: true,
        aiModel: true,
        humanReviewed: true,
        qualityScore: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        translator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!translation) {
      return NextResponse.json(
        {
          error: 'Translation not found',
          book: {
            id: book.id,
            title: book.title,
            language: book.language
          },
          requestedLanguage: language
        },
        { status: 404 }
      );
    }

    // Only return published translations to non-admin users
    if (translation.status !== 'PUBLISHED') {
      const isAdmin = session?.user?.role === 'ADMIN' ||
                      session?.user?.role === 'CONTENT_ADMIN';
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Translation not available' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      translation: {
        ...translation,
        originalBook: {
          id: book.id,
          title: book.title,
          language: book.language
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching book translation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
