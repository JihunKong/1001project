import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Get user's saved vocabulary
    const vocabulary = await prisma.vocabularyBank.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        [sortBy]: order
      },
      take: limit
    });

    return NextResponse.json({ vocabulary });

  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word, definition, pronunciation, partOfSpeech, example, bookId } = await request.json();

    if (!word || !definition) {
      return NextResponse.json({ error: 'Word and definition are required' }, { status: 400 });
    }

    // Check if word already exists for this user
    const existingWord = await prisma.vocabularyBank.findFirst({
      where: {
        userId: session.user.id,
        word: word.toLowerCase()
      }
    });

    if (existingWord) {
      return NextResponse.json({ error: 'Word already saved' }, { status: 409 });
    }

    // Create new vocabulary entry
    const vocabularyEntry = await prisma.vocabularyBank.create({
      data: {
        userId: session.user.id,
        word: word.toLowerCase(),
        definition,
        pronunciation: pronunciation || null,
        partOfSpeech: partOfSpeech || null,
        example: example || null,
        bookId: bookId || null,
        difficulty: determineDifficulty(word),
        context: null, // Could be added later
        masteryLevel: 1, // Starting level
        reviewCount: 0,
        correctCount: 0,
        lastReviewedAt: null
      }
    });

    return NextResponse.json({ 
      message: 'Word saved successfully',
      vocabularyEntry 
    });

  } catch (error) {
    console.error('Error saving vocabulary:', error);
    return NextResponse.json({ error: 'Failed to save word' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word } = await request.json();

    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // Find and delete the vocabulary entry
    const deletedEntry = await prisma.vocabularyBank.deleteMany({
      where: {
        userId: session.user.id,
        word: word.toLowerCase()
      }
    });

    if (deletedEntry.count === 0) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Word removed successfully' 
    });

  } catch (error) {
    console.error('Error removing vocabulary:', error);
    return NextResponse.json({ error: 'Failed to remove word' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

function determineDifficulty(word: string): 'EASY' | 'MEDIUM' | 'HARD' {
  // Basic difficulty determination based on word characteristics
  if (word.length <= 4) {
    return 'EASY';
  } else if (word.length <= 8) {
    return 'MEDIUM';
  } else {
    return 'HARD';
  }
}