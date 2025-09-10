import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, Quiz, QuizSubmission } from '@/types/learning';

// POST /api/learn/quiz/[quizId]/submit - Submit quiz answers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { answers, timeSpent } = await request.json();
    const { quizId } = await params;

    // Get quiz
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if user already completed this quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: quizId,
        userId: session.user.id,
      },
    });

    if (existingAttempt) {
      return NextResponse.json(
        { success: false, error: 'Quiz already completed' },
        { status: 400 }
      );
    }

    // Calculate score
    const questions = quiz.questions as unknown as QuizQuestion[];
    let correctCount = 0;
    const results: QuizSubmission['results'] = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      results.push({
        questionIndex: index,
        userAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Create quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quizId,
        score,
        answers,
        timeSpent: timeSpent || 0,
        passed,
        feedback: {
          results,
          submittedAt: new Date(),
        },
      },
    });

    // Update learning progress
    const progress = await prisma.learningProgress.findFirst({
      where: {
        userId: session.user.id,
        bookId: quiz.bookId,
      },
    });

    if (progress) {
      const currentMetrics = progress.metrics as any || {};
      await prisma.learningProgress.update({
        where: { id: progress.id },
        data: {
          metrics: {
            ...currentMetrics,
            quizScore: score,
            comprehension: Math.round((score + (currentMetrics.comprehension || 0)) / 2),
          },
        },
      });
    }

    // Update user stats
    await prisma.userStats.upsert({
      where: { userId: session.user.id },
      update: {
        xp: { increment: Math.round(score * 0.5) },
        lastActiveDate: new Date(),
      },
      create: {
        userId: session.user.id,
        xp: Math.round(score * 0.5),
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(),
        booksCompleted: 0,
        wordsLearned: 0,
        totalReadingTime: 0
      }
    });

    // Note: Achievement system functionality commented out due to field mismatches
    // Need proper Achievement and UserAchievement models implementation

    return NextResponse.json({
      success: true,
      data: {
        attempt: quizAttempt,
        score,
        correctCount,
        totalQuestions: questions.length,
        results,
        passed,
      },
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}

// GET /api/learn/quiz/[quizId]/submit - Get quiz results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quizId } = await params;
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: quizId,
        userId: session.user.id,
      },
      include: {
        quiz: true,
      },
    });

    if (!quizAttempt) {
      return NextResponse.json(
        { success: false, error: 'Quiz attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quizAttempt,
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz results' },
      { status: 500 }
    );
  }
}

interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
}