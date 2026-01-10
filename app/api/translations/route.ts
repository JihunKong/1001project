import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { TranslationStatus } from '@prisma/client';

const ADMIN_ROLES = ['ADMIN', 'CONTENT_ADMIN'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const bookId = searchParams.get('bookId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (language) {
      where.toLanguage = language;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    const skip = (page - 1) * limit;

    const [translations, totalCount] = await Promise.all([
      prisma.translation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          summary: true,
          fromLanguage: true,
          toLanguage: true,
          status: true,
          isAIGenerated: true,
          aiModel: true,
          humanReviewed: true,
          qualityScore: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          book: {
            select: {
              id: true,
              title: true,
              authorName: true,
              coverImage: true
            }
          },
          translator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.translation.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      translations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching translations', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, toLanguage, title, summary, content, isAIGenerated, aiModel } = body;

    if (!bookId || !toLanguage || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, toLanguage, title' },
        { status: 400 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, language: true }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const existingTranslation = await prisma.translation.findUnique({
      where: {
        bookId_toLanguage: { bookId, toLanguage }
      }
    });

    if (existingTranslation) {
      return NextResponse.json(
        { error: 'Translation already exists for this language' },
        { status: 409 }
      );
    }

    const translation = await prisma.translation.create({
      data: {
        bookId,
        fromLanguage: book.language,
        toLanguage,
        title,
        summary: summary || null,
        content: content || '',
        status: TranslationStatus.IN_PROGRESS,
        isAIGenerated: isAIGenerated || false,
        aiModel: aiModel || null,
        humanReviewed: false,
        translatorId: isAIGenerated ? null : session.user.id
      },
      select: {
        id: true,
        title: true,
        toLanguage: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Translation created successfully',
      translation
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating translation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
