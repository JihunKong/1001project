import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, Vocabulary } from '@/types/learning';

// PUT /api/learn/vocabulary/[wordId]/mastery - Update vocabulary mastery
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { correct } = await request.json();

    // Get existing word
    const word = await prisma.vocabulary.findFirst({
      where: {
        id: params.wordId,
        userId: session.user.id,
      },
    });

    if (!word) {
      return NextResponse.json(
        { success: false, error: 'Word not found' },
        { status: 404 }
      );
    }

    // Calculate new mastery level
    const newTimesCorrect = correct ? word.timesCorrect + 1 : word.timesCorrect;
    const newTimesSeen = word.timesSeen + 1;
    const accuracy = newTimesCorrect / newTimesSeen;
    
    let newMasteryLevel = word.masteryLevel;
    if (correct && accuracy >= 0.8 && newTimesSeen >= 3) {
      newMasteryLevel = Math.min(5, word.masteryLevel + 1);
    } else if (!correct && word.masteryLevel > 0) {
      newMasteryLevel = word.masteryLevel - 1;
    }

    // Update vocabulary
    const updated = await prisma.vocabulary.update({
      where: { id: params.wordId },
      data: {
        timesSeen: newTimesSeen,
        timesCorrect: newTimesCorrect,
        masteryLevel: newMasteryLevel,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    } as ApiResponse<Vocabulary>);
  } catch (error) {
    console.error('Error updating vocabulary mastery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vocabulary mastery' },
      { status: 500 }
    );
  }
}