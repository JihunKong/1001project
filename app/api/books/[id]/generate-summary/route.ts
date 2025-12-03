import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBookSummary } from '@/lib/solar-summary';
import { canEditBook } from '@/lib/validation/book-registration.schema';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!canEditBook(session.user.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only content managers can generate summaries.' },
        { status: 403 }
      );
    }

    const { id: bookId } = await params;

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.content) {
      return NextResponse.json(
        { error: 'Book content is required to generate a summary' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const customPrompt = body.prompt;

    // Remove HTML tags from content for cleaner summary generation
    const plainContent = book.content.replace(/<[^>]*>/g, '');

    logger.info('[SUMMARY-GEN] Starting summary generation', {
      bookId,
      bookTitle: book.title,
      hasCustomPrompt: !!customPrompt
    });

    const result = await generateBookSummary({
      title: book.title,
      content: plainContent,
      customPrompt,
    });

    if (!result.success) {
      logger.error('[SUMMARY-GEN] Failed to generate summary', {
        bookId,
        error: result.error
      });
      return NextResponse.json(
        { error: result.error || 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Update the book with the generated summary
    await prisma.book.update({
      where: { id: bookId },
      data: { summary: result.summary }
    });

    logger.info('[SUMMARY-GEN] Summary generated successfully', {
      bookId,
      summaryLength: result.summary?.length
    });

    return NextResponse.json({
      success: true,
      summary: result.summary
    });

  } catch (error) {
    logger.error('[SUMMARY-GEN] Error in generate-summary API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
