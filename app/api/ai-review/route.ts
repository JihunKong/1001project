import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIReviewType, AIReviewStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getLanguagePreferenceFromHeaders } from '@/lib/i18n/language-cookie';
import { generateAIReview } from '@/lib/ai-review-trigger';

interface ReviewRequest {
  submissionId: string;
  reviewType: 'GRAMMAR' | 'STRUCTURE' | 'WRITING_HELP';
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

    const allowedRoles = ['ADMIN', 'STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN'];
    if (submission.authorId !== session.user.id && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to request AI reviews for this submission' },
        { status: 403 }
      );
    }

    const htmlContent = submission.content;
    const plainTextContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (plainTextContent.length < 50) {
      return NextResponse.json(
        { error: 'Story is too short for meaningful AI review (minimum 50 characters)' },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie');
    const language = getLanguagePreferenceFromHeaders(cookieHeader);

    const startTime = Date.now();
    const { feedback, score, suggestions, annotations, tokensUsed } = await generateAIReview(
      plainTextContent,
      htmlContent,
      reviewType as AIReviewType,
      language
    );
    const processingTime = Date.now() - startTime;

    const review = await prisma.aIReview.create({
      data: {
        submissionId,
        reviewType: reviewType as AIReviewType,
        feedback: feedback as any,
        score,
        suggestions,
        annotationData: annotations as any,
        status: AIReviewStatus.COMPLETED,
        modelUsed: 'gpt-4o-mini',
        tokensUsed,
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
    logger.error('AI Review error', error);

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
