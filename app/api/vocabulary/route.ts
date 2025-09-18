import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiService } from '@/lib/ai-service';
import { z } from 'zod';

const addVocabularySchema = z.object({
  bookId: z.string(),
  word: z.string().min(1).max(100),
  context: z.string().min(1).max(500),
  pageNumber: z.number().optional(),
  definition: z.string().optional(),
  examples: z.array(z.string()).optional(),
});

const updateVocabularySchema = z.object({
  mastered: z.boolean().optional(),
  notes: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const onlyDifficult = searchParams.get('difficult') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: session.user.id,
    };

    if (bookId) {
      whereClause.bookId = bookId;
    }

    if (onlyDifficult) {
      whereClause.mastered = false;
    }

    const [vocabulary, totalCount] = await prisma.$transaction([
      prisma.vocabularyBank.findMany({
        where: whereClause,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authorName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { mastered: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.vocabularyBank.count({ where: whereClause }),
    ]);

    const stats = await prisma.vocabularyBank.groupBy({
      by: ['mastered'],
      where: { userId: session.user.id },
      _count: true,
    });

    const masteredCount = stats.find(s => s.mastered === true)?._count || 0;
    const learningCount = stats.find(s => s.mastered === false)?._count || 0;

    return NextResponse.json({
      vocabulary,
      stats: {
        total: totalCount,
        mastered: masteredCount,
        learning: learningCount,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = addVocabularySchema.parse(body);

    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId },
      select: {
        id: true,
        ageRange: true,
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const existingWord = await prisma.vocabularyBank.findFirst({
      where: {
        userId: session.user.id,
        bookId: validatedData.bookId,
        word: {
          equals: validatedData.word,
          mode: 'insensitive',
        },
      },
    });

    if (existingWord) {
      return NextResponse.json(
        { error: 'Word already exists in your vocabulary bank' },
        { status: 400 }
      );
    }

    let definition = validatedData.definition;
    let examples = validatedData.examples || [];

    if (!definition) {
      const targetAge = book.ageRange ? parseInt(book.ageRange.split('-')[0]) : 10;
      const { 
        explanation, 
        examples: generatedExamples, 
        error 
      } = await aiService.generateVocabularyExplanation(
        validatedData.word,
        validatedData.context,
        targetAge
      );

      if (!error) {
        definition = explanation;
        examples = generatedExamples;
      }
    }

    const vocabularyEntry = await prisma.vocabularyBank.create({
      data: {
        userId: session.user.id,
        bookId: validatedData.bookId,
        word: validatedData.word,
        context: validatedData.context,
        definition: definition || `The word "${validatedData.word}" appears in this context.`,
        examples,
        pageNumber: validatedData.pageNumber,
        mastered: false,
        difficulty: 'MEDIUM',
        reviewCount: 0,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'VOCABULARY_ADDED',
        details: {
          word: validatedData.word,
          bookId: validatedData.bookId,
          vocabularyId: vocabularyEntry.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      vocabulary: vocabularyEntry,
    });

  } catch (error) {
    console.error('Error adding vocabulary:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add vocabulary' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vocabularyId = searchParams.get('id');

    if (!vocabularyId) {
      return NextResponse.json(
        { error: 'Vocabulary ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateVocabularySchema.parse(body);

    const vocabulary = await prisma.vocabularyBank.findFirst({
      where: {
        id: vocabularyId,
        userId: session.user.id,
      },
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: 'Vocabulary entry not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      ...validatedData,
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
    };

    if (validatedData.mastered === true) {
      updateData.masteredAt = new Date();
    }

    const updated = await prisma.vocabularyBank.update({
      where: { id: vocabularyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      vocabulary: updated,
    });

  } catch (error) {
    console.error('Error updating vocabulary:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update vocabulary' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vocabularyId = searchParams.get('id');

    if (!vocabularyId) {
      return NextResponse.json(
        { error: 'Vocabulary ID is required' },
        { status: 400 }
      );
    }

    const vocabulary = await prisma.vocabularyBank.findFirst({
      where: {
        id: vocabularyId,
        userId: session.user.id,
      },
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: 'Vocabulary entry not found' },
        { status: 404 }
      );
    }

    await prisma.vocabularyBank.delete({
      where: { id: vocabularyId },
    });

    return NextResponse.json({
      success: true,
      message: 'Vocabulary entry deleted',
    });

  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete vocabulary' },
      { status: 500 }
    );
  }
}