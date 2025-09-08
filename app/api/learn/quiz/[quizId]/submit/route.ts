import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, Quiz, QuizSubmission } from '@/types/learning';

// POST /api/learn/quiz/[quizId]/submit - Submit quiz answers
export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
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

    // Get quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: params.quizId,
        userId: session.user.id,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (quiz.completedAt) {
      return NextResponse.json(
        { success: false, error: 'Quiz already completed' },
        { status: 400 }
      );
    }

    // Calculate score
    const questions = quiz.questions as QuizQuestion[];
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

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.quizId },
      data: {
        score,
        completedAt: new Date(),
        timeSpent,
        submission: {
          answers,
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
    const userStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    if (userStats) {
      const xpGained = Math.round(score * 0.5); // 0.5 XP per percentage point
      const newTotalXp = userStats.totalXp + xpGained;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;

      await prisma.userStats.update({
        where: { userId: session.user.id },
        data: {
          totalXp: newTotalXp,
          level: newLevel,
          quizzesTaken: userStats.quizzesTaken + 1,
          averageQuizScore: Math.round(
            (userStats.averageQuizScore * userStats.quizzesTaken + score) / 
            (userStats.quizzesTaken + 1)
          ),
        },
      });

      // Check for achievements
      const achievements = [];
      if (score === 100) {
        achievements.push({
          id: 'perfect_quiz',
          name: 'Perfect Score',
          description: 'Score 100% on a quiz',
          icon: '🎯',
          unlockedAt: new Date(),
        });
      }
      if (userStats.quizzesTaken + 1 === 10) {
        achievements.push({
          id: 'quiz_master_10',
          name: 'Quiz Enthusiast',
          description: 'Complete 10 quizzes',
          icon: '📝',
          unlockedAt: new Date(),
        });
      }

      if (achievements.length > 0) {
        await prisma.achievement.createMany({
          data: achievements.map(a => ({
            ...a,
            userId: session.user.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        quiz: updatedQuiz,
        score,
        correctCount,
        totalQuestions: questions.length,
        results,
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
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: params.quizId,
        userId: session.user.id,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (!quiz.completedAt) {
      return NextResponse.json(
        { success: false, error: 'Quiz not completed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quiz,
    } as ApiResponse<Quiz>);
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