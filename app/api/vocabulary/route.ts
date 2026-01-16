import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createWordSchema = z.object({
  word: z.string().min(1).max(100),
  definition: z.string().min(1),
  partOfSpeech: z.string().optional(),
  pronunciation: z.string().optional(),
  audioUrl: z.string().url().optional(),
  context: z.string().optional(),
  sourceBookId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const masteryLevel = searchParams.get('masteryLevel');
    const sourceBookId = searchParams.get('sourceBookId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (masteryLevel !== null && masteryLevel !== undefined && masteryLevel !== '') {
      where.masteryLevel = parseInt(masteryLevel);
    }

    if (sourceBookId) {
      where.sourceBookId = sourceBookId;
    }

    const [words, total] = await Promise.all([
      prisma.vocabularyWord.findMany({
        where,
        include: {
          sourceBook: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vocabularyWord.count({ where }),
    ]);

    const stats = await prisma.vocabularyWord.groupBy({
      by: ['masteryLevel'],
      where: { userId: session.user.id },
      _count: true,
    });

    const masteryStats = {
      learning: 0,
      reviewing: 0,
      mastered: 0,
    };

    stats.forEach(s => {
      if (s.masteryLevel <= 1) masteryStats.learning += s._count;
      else if (s.masteryLevel <= 3) masteryStats.reviewing += s._count;
      else masteryStats.mastered += s._count;
    });

    return NextResponse.json({
      words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        ...masteryStats,
      },
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWordSchema.parse(body);

    const existingWord = await prisma.vocabularyWord.findUnique({
      where: {
        userId_word: {
          userId: session.user.id,
          word: validatedData.word.toLowerCase(),
        },
      },
    });

    if (existingWord) {
      return NextResponse.json({
        error: 'Word already exists in your vocabulary',
        existingWord,
      }, { status: 409 });
    }

    const word = await prisma.vocabularyWord.create({
      data: {
        userId: session.user.id,
        word: validatedData.word.toLowerCase(),
        definition: validatedData.definition,
        partOfSpeech: validatedData.partOfSpeech,
        pronunciation: validatedData.pronunciation,
        audioUrl: validatedData.audioUrl,
        context: validatedData.context,
        sourceBookId: validatedData.sourceBookId,
        masteryLevel: 0,
        nextReviewAt: new Date(),
      },
      include: {
        sourceBook: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating vocabulary word:', error);
    return NextResponse.json({ error: 'Failed to create vocabulary word' }, { status: 500 });
  }
}
