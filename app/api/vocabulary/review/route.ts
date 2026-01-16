import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reviewResultSchema = z.object({
  wordId: z.string(),
  correct: z.boolean(),
  responseTime: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const mode = searchParams.get('mode') || 'due';

    let words;

    if (mode === 'due') {
      words = await prisma.vocabularyWord.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { nextReviewAt: { lte: new Date() } },
            { nextReviewAt: null },
          ],
        },
        orderBy: [
          { masteryLevel: 'asc' },
          { nextReviewAt: 'asc' },
        ],
        take: limit,
        include: {
          sourceBook: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } else if (mode === 'random') {
      const count = await prisma.vocabularyWord.count({
        where: { userId: session.user.id },
      });

      const skip = Math.max(0, Math.floor(Math.random() * (count - limit)));

      words = await prisma.vocabularyWord.findMany({
        where: { userId: session.user.id },
        skip,
        take: limit,
        include: {
          sourceBook: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
    } else if (mode === 'weak') {
      words = await prisma.vocabularyWord.findMany({
        where: {
          userId: session.user.id,
          masteryLevel: { lte: 2 },
        },
        orderBy: { masteryLevel: 'asc' },
        take: limit,
        include: {
          sourceBook: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } else {
      words = await prisma.vocabularyWord.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sourceBook: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    const totalDue = await prisma.vocabularyWord.count({
      where: {
        userId: session.user.id,
        OR: [
          { nextReviewAt: { lte: new Date() } },
          { nextReviewAt: null },
        ],
      },
    });

    return NextResponse.json({
      words,
      totalDue,
      count: words.length,
    });
  } catch (error) {
    console.error('Error fetching review words:', error);
    return NextResponse.json({ error: 'Failed to fetch review words' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewResultSchema.parse(body);

    const word = await prisma.vocabularyWord.findFirst({
      where: {
        id: validatedData.wordId,
        userId: session.user.id,
      },
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    let newMasteryLevel: number;
    if (validatedData.correct) {
      newMasteryLevel = Math.min(word.masteryLevel + 1, 5);
    } else {
      newMasteryLevel = Math.max(word.masteryLevel - 1, 0);
    }

    const intervals = [1, 2, 4, 7, 14, 30];
    const daysUntilNextReview = intervals[newMasteryLevel];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview);

    const updatedWord = await prisma.vocabularyWord.update({
      where: { id: word.id },
      data: {
        masteryLevel: newMasteryLevel,
        reviewCount: word.reviewCount + 1,
        nextReviewAt: nextReviewDate,
      },
    });

    return NextResponse.json({
      word: updatedWord,
      previousMasteryLevel: word.masteryLevel,
      newMasteryLevel,
      nextReviewAt: nextReviewDate,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error recording review result:', error);
    return NextResponse.json({ error: 'Failed to record review result' }, { status: 500 });
  }
}
