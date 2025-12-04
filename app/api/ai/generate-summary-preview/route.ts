import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateBookSummary } from '@/lib/solar-summary';
import { canDirectRegisterBook } from '@/lib/validation/book-registration.schema';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!canDirectRegisterBook(session.user.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only content managers can generate summaries.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, customPrompt } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const plainContent = content.replace(/<[^>]*>/g, '').trim();

    if (plainContent.length < 50) {
      return NextResponse.json(
        { error: 'Content must be at least 50 characters' },
        { status: 400 }
      );
    }

    logger.info('[SUMMARY-PREVIEW] Starting summary preview generation', {
      userId: session.user.id,
      title: title || 'Untitled',
      contentLength: plainContent.length,
      hasCustomPrompt: !!customPrompt
    });

    const result = await generateBookSummary({
      title: title || 'Untitled',
      content: plainContent,
      customPrompt,
    });

    if (!result.success) {
      logger.error('[SUMMARY-PREVIEW] Failed to generate summary', {
        error: result.error
      });
      return NextResponse.json(
        { error: result.error || 'Failed to generate summary' },
        { status: 500 }
      );
    }

    logger.info('[SUMMARY-PREVIEW] Summary preview generated successfully', {
      summaryLength: result.summary?.length
    });

    return NextResponse.json({
      success: true,
      summary: result.summary
    });

  } catch (error) {
    logger.error('[SUMMARY-PREVIEW] Error in generate-summary-preview API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
