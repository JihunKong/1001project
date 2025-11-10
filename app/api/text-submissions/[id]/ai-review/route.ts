import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enqueueAIReview, getJobStatus } from '@/lib/queue';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getLanguagePreferenceFromHeaders } from '@/lib/i18n/language-cookie';

const AI_REVIEW_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many AI review requests. AI reviews are resource-intensive. Please try again later.'
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(
      request,
      AI_REVIEW_RATE_LIMIT,
      session.user.id
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': AI_REVIEW_RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const { id } = await context.params;
    const submissionId = id;

    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        content: true,
        authorId: true,
        status: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const isAuthor = submission.authorId === session.user.id;
    const isReviewer = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(
      session.user.role
    );

    if (!isAuthor && !isReviewer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!submission.content) {
      return NextResponse.json(
        { error: 'Submission has no content to review' },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie');
    const language = getLanguagePreferenceFromHeaders(cookieHeader);

    const jobId = await enqueueAIReview({
      submissionId: submission.id,
      content: submission.content,
      userId: session.user.id,
      triggerType: 'manual',
      language,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'AI review job queued successfully',
        jobId,
      },
      { status: 202 }
    );
  } catch (error) {
    logger.error('[AI Review API] Error', error);
    return NextResponse.json(
      {
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const jobStatus = await getJobStatus(jobId);

      if (!jobStatus) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        job: jobStatus,
      });
    }

    const { id } = await context.params;
    const submissionId = id;

    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        authorId: true,
        aiReviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            reviewType: true,
            feedback: true,
            score: true,
            suggestions: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const isAuthor = submission.authorId === session.user.id;
    const isReviewer = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(
      session.user.role
    );

    if (!isAuthor && !isReviewer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const latestReview = submission.aiReviews[0] || null;

    return NextResponse.json({
      success: true,
      review: latestReview,
    });
  } catch (error) {
    logger.error('[AI Review API] Error', error);
    return NextResponse.json(
      {
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}
