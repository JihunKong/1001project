import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateWordSchema = z.object({
  definition: z.string().optional(),
  partOfSpeech: z.string().optional(),
  pronunciation: z.string().optional(),
  audioUrl: z.string().url().optional().nullable(),
  context: z.string().optional(),
  masteryLevel: z.number().min(0).max(5).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const word = await prisma.vocabularyWord.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sourceBook: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json(word);
  } catch (error) {
    console.error('Error fetching vocabulary word:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary word' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateWordSchema.parse(body);

    const existingWord = await prisma.vocabularyWord.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWord) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validatedData };

    if (validatedData.masteryLevel !== undefined) {
      updateData.reviewCount = existingWord.reviewCount + 1;

      const intervals = [1, 2, 4, 7, 14, 30];
      const daysUntilNextReview = intervals[Math.min(validatedData.masteryLevel, 5)];
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview);
      updateData.nextReviewAt = nextReviewDate;
    }

    const word = await prisma.vocabularyWord.update({
      where: { id },
      data: updateData,
      include: {
        sourceBook: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(word);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating vocabulary word:', error);
    return NextResponse.json({ error: 'Failed to update vocabulary word' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingWord = await prisma.vocabularyWord.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWord) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    await prisma.vocabularyWord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vocabulary word:', error);
    return NextResponse.json({ error: 'Failed to delete vocabulary word' }, { status: 500 });
  }
}
