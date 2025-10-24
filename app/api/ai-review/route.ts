import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIReviewType, AIReviewStatus } from '@prisma/client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReviewRequest {
  submissionId: string;
  reviewType: 'GRAMMAR' | 'STRUCTURE' | 'WRITING_HELP';
}

interface AIFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  details?: any;
}

const REVIEW_PROMPTS = {
  GRAMMAR: `Analyze the following story for grammar, spelling, and punctuation errors. Provide:
1. A brief summary of the overall grammar quality
2. Specific strengths in the writing
3. List of improvements needed with examples
4. A quality score from 0-100

Respond in JSON format with keys: summary, strengths, improvements, score`,

  STRUCTURE: `Analyze the following story's structure and organization. Evaluate:
1. Story flow and pacing
2. Character development (if applicable)
3. Plot structure and coherence
4. Beginning, middle, and end effectiveness
5. Overall structure quality score from 0-100

Respond in JSON format with keys: summary, strengths, improvements, score`,

  WRITING_HELP: `Provide constructive feedback on this story to help improve the writing. Focus on:
1. Writing style and voice
2. Word choice and vocabulary
3. Engagement and readability
4. Areas for development
5. Specific actionable suggestions

Respond in JSON format with keys: summary, strengths, improvements`
};

async function generateAIReview(content: string, reviewType: AIReviewType): Promise<{ feedback: AIFeedback; score: number | null; suggestions: string[] }> {
  const startTime = Date.now();

  try {
    const prompt = REVIEW_PROMPTS[reviewType];
    const systemMessage = 'You are a helpful writing coach for children\'s stories. Provide constructive, encouraging feedback that helps authors improve their work.';
    const fullPrompt = `${systemMessage}\n\n${prompt}\n\nStory:\n${content}`;

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: fullPrompt,
    });

    const processingTime = Date.now() - startTime;

    let responseContent = response.output_text || '{}';

    responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const feedback = JSON.parse(responseContent) as AIFeedback;

    const score = feedback.details?.score || null;
    const suggestions = [
      ...(feedback.improvements || []),
    ].slice(0, 5);

    return {
      feedback,
      score,
      suggestions
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI review');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ReviewRequest = await request.json();
    const { submissionId, reviewType } = body;

    if (!submissionId || !reviewType) {
      return NextResponse.json(
        { error: 'submissionId and reviewType are required' },
        { status: 400 }
      );
    }

    if (!['GRAMMAR', 'STRUCTURE', 'WRITING_HELP'].includes(reviewType)) {
      return NextResponse.json(
        { error: 'Invalid reviewType' },
        { status: 400 }
      );
    }

    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        author: { select: { id: true } }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only request AI reviews for your own submissions' },
        { status: 403 }
      );
    }

    const plainTextContent = submission.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (plainTextContent.length < 50) {
      return NextResponse.json(
        { error: 'Story is too short for meaningful AI review (minimum 50 characters)' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const { feedback, score, suggestions } = await generateAIReview(
      plainTextContent,
      reviewType as AIReviewType
    );
    const processingTime = Date.now() - startTime;

    const review = await prisma.aIReview.create({
      data: {
        submissionId,
        reviewType: reviewType as AIReviewType,
        feedback: feedback as any,
        score,
        suggestions,
        status: AIReviewStatus.COMPLETED,
        modelUsed: 'gpt-5-nano',
        tokensUsed: null,
        processingTime,
      }
    });

    return NextResponse.json({
      review: {
        id: review.id,
        feedback: review.feedback,
        suggestions: review.suggestions,
        score: review.score,
        createdAt: review.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('AI Review error:', error);

    if (error instanceof Error && error.message === 'Failed to generate AI review') {
      return NextResponse.json(
        { error: 'Failed to generate AI review. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
