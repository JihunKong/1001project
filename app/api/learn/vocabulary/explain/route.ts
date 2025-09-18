import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { upstageService } from '@/lib/upstage-service';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/learning';

interface VocabularyExplainRequest {
  word: string;
  context: string;
  bookId?: string;
  studentLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  studentAge?: number;
}

interface VocabularyExplanation {
  word: string;
  definition: string;
  simpleDefinition: string;
  examples: string[];
  pronunciation?: string;
  partOfSpeech: string;
  difficulty: 'easy' | 'medium' | 'hard';
  relatedWords?: string[];
  savedToVocabulary?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const body: VocabularyExplainRequest = await request.json();
    const { word, context, bookId, studentLevel, studentAge } = body;

    if (!word || !context) {
      return NextResponse.json(
        { success: false, error: 'Word and context are required' },
        { status: 400 }
      );
    }

    let userLevel = studentLevel;
    let userAge = studentAge;

    if (!userLevel || !userAge) {
      try {
        const userStats = await prisma.userStats.findUnique({
          where: { userId: session.user.id },
          select: { readingLevel: true }
        });

        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { dateOfBirth: true }
        });

        if (!userLevel && userStats?.readingLevel) {
          userLevel = userStats.readingLevel as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
        } else {
          userLevel = 'INTERMEDIATE';
        }

        if (!userAge && user?.dateOfBirth) {
          const today = new Date();
          const birth = new Date(user.dateOfBirth);
          userAge = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            userAge--;
          }
        } else {
          userAge = 12;
        }
      } catch (dbError) {
        console.warn('Could not fetch user profile for vocabulary:', dbError);
        userLevel = 'INTERMEDIATE';
        userAge = 12;
      }
    }

    const explanation = await upstageService.explainWord(
      word,
      context,
      userLevel,
      userAge
    );

    let savedToVocabulary = false;
    try {
      const existingWord = await prisma.vocabulary.findUnique({
        where: {
          userId_word: {
            userId: session.user.id,
            word: word.toLowerCase(),
          },
        },
      });

      if (existingWord) {
        await prisma.vocabulary.update({
          where: { id: existingWord.id },
          data: {
            timesSeen: { increment: 1 },
            lastSeen: new Date(),
            definition: explanation.definition,
            contexts: [
              ...(existingWord.contexts as string[] || []),
              context
            ].slice(-5),
          },
        });
        savedToVocabulary = true;
      } else {
        await prisma.vocabulary.create({
          data: {
            userId: session.user.id,
            word: word.toLowerCase(),
            definition: explanation.definition,
            translations: {},
            bookId: bookId || null,
            contexts: [context],
            masteryLevel: 0,
            timesSeen: 1,
            timesCorrect: 0,
            lastSeen: new Date(),
          },
        });
        savedToVocabulary = true;

        await prisma.userStats.update({
          where: { userId: session.user.id },
          data: {
            wordsLearned: { increment: 1 },
            xp: { increment: 5 },
            lastActiveDate: new Date(),
          },
        });
      }
    } catch (dbError) {
      console.warn('Could not save vocabulary word to database:', dbError);
    }

    try {
      await prisma.learningSession.create({
        data: {
          userId: session.user.id,
          bookId: bookId || null,
          activityType: 'VOCABULARY',
          content: {
            word: word,
            context: context,
            explanation: explanation.definition
          },
          metadata: {
            difficulty: explanation.difficulty,
            partOfSpeech: explanation.partOfSpeech,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (sessionError) {
      console.warn('Could not record vocabulary learning session:', sessionError);
    }

    const response: VocabularyExplanation = {
      ...explanation,
      savedToVocabulary
    };

    return NextResponse.json({
      success: true,
      data: response,
    } as ApiResponse<VocabularyExplanation>);

  } catch (error) {
    console.error('Vocabulary explanation API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { success: false, error: 'AI service authentication failed' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { success: false, error: 'Too many vocabulary requests. Please wait a moment.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to explain vocabulary word' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const word = url.searchParams.get('word');

    if (!word) {
      return NextResponse.json(
        { success: false, error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    const vocabularyEntry = await prisma.vocabulary.findUnique({
      where: {
        userId_word: {
          userId: session.user.id,
          word: word.toLowerCase(),
        },
      },
    });

    if (!vocabularyEntry) {
      return NextResponse.json(
        { success: false, error: 'Vocabulary word not found' },
        { status: 404 }
      );
    }

    const response = {
      word: vocabularyEntry.word,
      definition: vocabularyEntry.definition,
      contexts: vocabularyEntry.contexts as string[],
      masteryLevel: vocabularyEntry.masteryLevel,
      timesSeen: vocabularyEntry.timesSeen,
      timesCorrect: vocabularyEntry.timesCorrect,
      lastSeen: vocabularyEntry.lastSeen,
    };

    return NextResponse.json({
      success: true,
      data: response,
    } as ApiResponse<typeof response>);

  } catch (error) {
    console.error('Get vocabulary word error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vocabulary word' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}