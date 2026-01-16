import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitAttemptSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.object({
    questionIndex: z.number(),
    selectedAnswer: z.number().min(0).max(3),
  })),
  timeSpent: z.number().optional(),
});

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = submitAttemptSchema.parse(body);

    const quiz = await prisma.comprehensionQuiz.findUnique({
      where: { id: validatedData.quizId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (!quiz.isActive) {
      return NextResponse.json({ error: 'Quiz is not active' }, { status: 400 });
    }

    const questions = quiz.questions as unknown as QuizQuestion[];
    let correctCount = 0;
    const gradedAnswers = validatedData.answers.map((answer) => {
      const question = questions[answer.questionIndex];
      const isCorrect = question && answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        correctAnswer: question?.correctAnswer ?? 0,
        explanation: question?.explanation ?? '',
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: validatedData.quizId,
        userId: session.user.id,
        score,
        passed,
        answers: gradedAnswers,
        timeSpent: validatedData.timeSpent,
      },
    });

    const attemptCount = await prisma.quizAttempt.count({
      where: {
        quizId: validatedData.quizId,
        userId: session.user.id,
      },
    });

    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: validatedData.quizId,
        userId: session.user.id,
      },
      orderBy: { score: 'desc' },
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
        answers: gradedAnswers,
        timeSpent: validatedData.timeSpent,
      },
      stats: {
        attemptCount,
        bestScore: bestAttempt?.score ?? score,
        isNewBest: score === bestAttempt?.score && attempt.id === bestAttempt?.id,
      },
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        book: quiz.book,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error submitting quiz attempt:', error);
    return NextResponse.json({ error: 'Failed to submit quiz attempt' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (quizId) {
      where.quizId = quizId;
    }

    const attempts = await prisma.quizAttempt.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            book: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    const stats = await prisma.quizAttempt.aggregate({
      where: { userId: session.user.id },
      _count: true,
      _avg: { score: true },
    });

    const passedCount = await prisma.quizAttempt.count({
      where: {
        userId: session.user.id,
        passed: true,
      },
    });

    return NextResponse.json({
      attempts,
      stats: {
        totalAttempts: stats._count,
        averageScore: Math.round(stats._avg.score ?? 0),
        passedCount,
        passRate: stats._count > 0
          ? Math.round((passedCount / stats._count) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}
