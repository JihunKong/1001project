import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import type { ApiResponse, Quiz, QuizQuestion } from '@/types/learning';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/learn/quiz/generate - Generate a quiz based on book content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookId, text, difficulty = 'B1', questionCount = 5 } = await request.json();

    if (!bookId || !text) {
      return NextResponse.json(
        { success: false, error: 'Book ID and text are required' },
        { status: 400 }
      );
    }

    // Check if user has completed reading
    const progress = await prisma.learningProgress.findFirst({
      where: {
        userId: session.user.id,
        bookId,
      },
    });

    if (!progress || progress.pagesRead < progress.totalPages * 0.8) {
      return NextResponse.json(
        { success: false, error: 'Please read at least 80% of the book before taking a quiz' },
        { status: 400 }
      );
    }

    // Generate quiz questions using AI
    const prompt = `Generate ${questionCount} comprehension questions for a ${difficulty} CEFR level English learner based on this text:

"${text.substring(0, 2000)}"

Return a JSON array with exactly ${questionCount} questions. Each question should have:
- "question": The question text
- "type": Either "multiple_choice" or "true_false" 
- "options": Array of 4 options for multiple choice, or ["True", "False"] for true/false
- "correctAnswer": The correct option (must match one of the options exactly)
- "explanation": Brief explanation of why this is correct
- "difficulty": Number 1-5 (1=easiest, 5=hardest)

Questions should test:
- Main idea comprehension
- Vocabulary understanding
- Detail recall
- Inference skills
- Critical thinking

Make questions appropriate for ${difficulty} level learners.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an ESL teacher creating comprehension quizzes. Return only valid JSON array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('Failed to generate quiz questions');
    }

    let questions: QuizQuestion[];
    try {
      questions = JSON.parse(result);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to default questions
      questions = generateFallbackQuestions(text, questionCount);
    }

    // Create quiz in database
    const quiz = await prisma.quiz.create({
      data: {
        userId: session.user.id,
        bookId,
        type: 'comprehension',
        questions,
        totalQuestions: questions.length,
        score: 0,
        completedAt: null,
        timeSpent: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: quiz,
    } as ApiResponse<Quiz>);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

function generateFallbackQuestions(text: string, count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Generate simple comprehension questions
  for (let i = 0; i < Math.min(count, 5); i++) {
    if (i === 0) {
      questions.push({
        question: 'What is the main topic of this text?',
        type: 'multiple_choice',
        options: [
          'The main topic discussed in the text',
          'A completely different topic',
          'An unrelated subject',
          'Something not mentioned',
        ],
        correctAnswer: 'The main topic discussed in the text',
        explanation: 'The text primarily focuses on this topic.',
        difficulty: 2,
      });
    } else if (i === 1 && sentences.length > 0) {
      questions.push({
        question: `Is this statement from the text true or false: "${sentences[0].trim().substring(0, 100)}..."`,
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'This statement appears in the text.',
        difficulty: 1,
      });
    } else if (i === 2) {
      questions.push({
        question: 'According to the text, which statement is correct?',
        type: 'multiple_choice',
        options: [
          'The information presented in the text',
          'Information not in the text',
          'Contradictory information',
          'Unrelated information',
        ],
        correctAnswer: 'The information presented in the text',
        explanation: 'This information is directly stated in the text.',
        difficulty: 3,
      });
    } else if (i === 3) {
      questions.push({
        question: 'What can you infer from the text?',
        type: 'multiple_choice',
        options: [
          'A logical conclusion based on the text',
          'An illogical conclusion',
          'Something contradictory',
          'An unrelated inference',
        ],
        correctAnswer: 'A logical conclusion based on the text',
        explanation: 'This can be inferred from the information provided.',
        difficulty: 4,
      });
    } else {
      questions.push({
        question: `Question ${i + 1}: Did you understand the text?`,
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Self-assessment of comprehension.',
        difficulty: 1,
      });
    }
  }
  
  return questions.slice(0, count);
}