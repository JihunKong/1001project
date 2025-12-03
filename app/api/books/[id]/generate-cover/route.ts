import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCuteCartoonImage } from '@/lib/google-genai-image';
import { canEditBook } from '@/lib/validation/book-registration.schema';
import { logger } from '@/lib/logger';
import path from 'path';

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
        { error: 'Permission denied. Only content managers can generate covers.' },
        { status: 403 }
      );
    }

    const { id: bookId } = await params;

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        coverImage: true,
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const customPrompt = body.prompt;

    let prompt: string;
    if (customPrompt) {
      prompt = customPrompt;
    } else {
      const contentPreview = book.content
        ? book.content.replace(/<[^>]*>/g, '').substring(0, 200)
        : '';
      const summaryText = book.summary || contentPreview;
      prompt = `Children's book cover illustration for "${book.title}". ${summaryText}. Colorful, engaging, child-friendly, suitable for a book cover.`;
    }

    logger.info('[COVER-GEN] Starting cover generation', {
      bookId,
      bookTitle: book.title,
      hasCustomPrompt: !!customPrompt
    });
    console.log('[COVER-GEN] Generating cover for book:', book.title);

    const outputPath = path.join(
      process.cwd(),
      'public',
      'covers',
      `${bookId}.png`
    );

    const result = await generateCuteCartoonImage(prompt, outputPath);

    if (!result.success) {
      logger.error('[COVER-GEN] Failed to generate cover', {
        bookId,
        error: result.error
      });
      console.error('[COVER-GEN] Generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate cover image' },
        { status: 500 }
      );
    }

    const coverImageUrl = `/covers/${bookId}.png`;

    await prisma.book.update({
      where: { id: bookId },
      data: { coverImage: coverImageUrl }
    });

    logger.info('[COVER-GEN] Cover generated successfully', {
      bookId,
      coverImageUrl
    });
    console.log('[COVER-GEN] Cover saved:', coverImageUrl);

    return NextResponse.json({
      success: true,
      coverImage: coverImageUrl
    });

  } catch (error) {
    logger.error('[COVER-GEN] Error in generate-cover API', error);
    console.error('[COVER-GEN] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
