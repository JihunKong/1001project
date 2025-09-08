import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, Vocabulary } from '@/types/learning';
import { XP_REWARDS } from '@/types/learning';

// GET /api/learn/vocabulary - Get user's vocabulary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const bookId = url.searchParams.get('bookId');
    const masteryLevel = url.searchParams.get('masteryLevel');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const where = {
      userId: session.user.id,
      ...(bookId && { bookId }),
      ...(masteryLevel && { masteryLevel: parseInt(masteryLevel) }),
    };

    const vocabulary = await prisma.vocabulary.findMany({
      where,
      orderBy: { lastSeen: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: vocabulary,
    } as ApiResponse<Vocabulary[]>);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}

// POST /api/learn/vocabulary - Add new vocabulary word
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { word, definition, bookId, context, translations } = data;

    if (!word || !definition) {
      return NextResponse.json(
        { success: false, error: 'Word and definition are required' },
        { status: 400 }
      );
    }

    // Check if word already exists for user
    const existingWord = await prisma.vocabulary.findUnique({
      where: {
        userId_word: {
          userId: session.user.id,
          word: word.toLowerCase(),
        },
      },
    });

    if (existingWord) {
      // Update existing word
      const updated = await prisma.vocabulary.update({
        where: { id: existingWord.id },
        data: {
          timesSeen: { increment: 1 },
          lastSeen: new Date(),
          contexts: context 
            ? [...(existingWord.contexts as any[] || []), context]
            : existingWord.contexts,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
      } as ApiResponse<Vocabulary>);
    }

    // Create new vocabulary entry
    const vocabulary = await prisma.vocabulary.create({
      data: {
        userId: session.user.id,
        word: word.toLowerCase(),
        definition,
        translations: translations || {},
        bookId,
        contexts: context ? [context] : [],
        masteryLevel: 0,
        timesSeen: 1,
        timesCorrect: 0,
        lastSeen: new Date(),
      },
    });

    // Award XP for learning new word
    await prisma.userStats.update({
      where: { userId: session.user.id },
      data: {
        wordsLearned: { increment: 1 },
        totalXP: { increment: XP_REWARDS.WORD_LEARNED },
        lastActive: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: vocabulary,
    } as ApiResponse<Vocabulary>);
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add vocabulary' },
      { status: 500 }
    );
  }
}