import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCuteCartoonImage } from '@/lib/google-genai-image';
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
        { error: 'Permission denied. Only content managers can generate covers.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, summary, content } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const descriptionText = summary || (content ? content.replace(/<[^>]*>/g, '').trim().substring(0, 200) : '');

    if (!descriptionText) {
      return NextResponse.json(
        { error: 'Summary or content is required for cover generation' },
        { status: 400 }
      );
    }

    const prompt = `Children's book cover illustration for "${title}". ${descriptionText}. Colorful, engaging, child-friendly, suitable for book cover.`;

    logger.info('[COVER-PREVIEW] Starting cover preview generation', {
      userId: session.user.id,
      title,
      promptLength: prompt.length
    });

    const result = await generateCuteCartoonImage(prompt);

    if (!result.success || !result.base64Data) {
      logger.error('[COVER-PREVIEW] Failed to generate cover', {
        error: result.error
      });
      return NextResponse.json(
        { error: result.error || 'Failed to generate cover image' },
        { status: 500 }
      );
    }

    logger.info('[COVER-PREVIEW] Cover preview generated successfully', {
      base64Length: result.base64Data.length
    });

    return NextResponse.json({
      success: true,
      base64Data: result.base64Data,
      mimeType: 'image/png'
    });

  } catch (error) {
    logger.error('[COVER-PREVIEW] Error in generate-cover-preview API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
