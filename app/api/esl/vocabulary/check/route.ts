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
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    // Check if word exists in user's vocabulary
    const existingWord = await prisma.vocabularyBank.findFirst({
      where: {
        userId: session.user.id,
        word: word.toLowerCase()
      }
    });

    return NextResponse.json({ 
      isSaved: !!existingWord,
      vocabularyEntry: existingWord
    });

  } catch (error) {
    console.error('Error checking vocabulary:', error);
    return NextResponse.json({ error: 'Failed to check word' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}