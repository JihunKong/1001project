import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await params;

    const quiz = await prisma.comprehensionQuiz.findUnique({
      where: { bookId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const userAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quiz.id,
        userId: session.user.id,
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    const bestAttempt = userAttempts.length > 0
      ? userAttempts.reduce((best, current) =>
          current.score > best.score ? current : best
        )
      : null;

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        bookId: quiz.bookId,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        book: quiz.book,
      },
      userStats: {
        attemptCount: userAttempts.length,
        bestScore: bestAttempt?.score ?? null,
        passed: bestAttempt?.passed ?? false,
        lastAttempt: userAttempts[0] ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['TEACHER', 'ADMIN', 'CONTENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bookId } = await params;

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        ageRange: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.content && !book.summary) {
      return NextResponse.json(
        { error: 'Book has no content to generate quiz from' },
        { status: 400 }
      );
    }

    const existingQuiz = await prisma.comprehensionQuiz.findUnique({
      where: { bookId },
    });

    if (existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz already exists for this book', quiz: existingQuiz },
        { status: 409 }
      );
    }

    const contentForQuiz = book.content
      ? book.content.substring(0, 8000)
      : book.summary || '';

    const prompt = `You are an educational quiz creator for an ESL learning platform. Create a comprehension quiz based on the following story content.

Story Title: ${book.title}
Target Age Range: ${book.ageRange || 'All ages'}

Content:
${contentForQuiz}

Create exactly 5 multiple-choice questions that test reading comprehension. Each question should:
1. Test understanding of the story's main ideas, characters, events, or themes
2. Have exactly 4 answer options (A, B, C, D)
3. Be appropriate for ESL learners
4. Include a brief explanation for the correct answer

Return ONLY a valid JSON array with no additional text. Each question object must have:
- "question": the question text
- "options": array of 4 string options
- "correctAnswer": index (0-3) of the correct option
- "explanation": brief explanation of why this is correct

Example format:
[
  {
    "question": "What is the main theme of the story?",
    "options": ["Friendship", "Adventure", "Mystery", "Learning"],
    "correctAnswer": 0,
    "explanation": "The story focuses on the friendship between the two main characters."
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an educational content creator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';

    let questions: QuizQuestion[];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      questions = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions array');
      }

      questions = questions.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : 0,
        explanation: q.explanation || 'No explanation provided.',
      }));
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to generate valid quiz questions' },
        { status: 500 }
      );
    }

    const quiz = await prisma.comprehensionQuiz.create({
      data: {
        bookId,
        title: `${book.title} - Comprehension Quiz`,
        description: `Test your understanding of "${book.title}"`,
        questions: JSON.parse(JSON.stringify(questions)),
        passingScore: 70,
        timeLimit: 15,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: 'Quiz generated successfully',
      quiz,
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
