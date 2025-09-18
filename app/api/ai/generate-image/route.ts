import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiService } from '@/lib/ai-service';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const generateImageSchema = z.object({
  bookId: z.string(),
  pageNumber: z.number().min(1),
  prompt: z.string().min(10).max(1000),
  useAutoPrompt: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!userHasPermission(session, PERMISSIONS.AI_GENERATE_IMAGE)) {
      return NextResponse.json(
        { error: 'You do not have permission to generate images' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = generateImageSchema.parse(body);

    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const canEdit = userHasPermission(session, PERMISSIONS.BOOK_EDIT);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this book' },
        { status: 403 }
      );
    }

    let finalPrompt = validatedData.prompt;

    if (validatedData.useAutoPrompt && book.content) {
      const { prompts, error } = await aiService.suggestIllustrationPrompts(
        book.content,
        validatedData.pageNumber
      );

      if (!error && prompts.length > 0) {
        finalPrompt = prompts[0];
      }
    }

    const { url, error } = await aiService.generateStoryImage(finalPrompt);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    // TODO: Fix AIGeneratedContent model - bookId field doesn't exist
    // const aiContent = await prisma.aIGeneratedContent.create({
    //   data: {
    //     bookId: validatedData.bookId,
    //     type: 'IMAGE',
    //     prompt: finalPrompt,
    //     result: url,
    //     metadata: {
    //       pageNumber: validatedData.pageNumber,
    //       generatedBy: session.user.id,
    //     },
    //   },
    // });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'AI_IMAGE_GENERATED',
        entity: 'Book',
        entityId: book.id,
        metadata: {
          bookTitle: book.title,
          pageNumber: validatedData.pageNumber,
          prompt: finalPrompt,
          imageUrl: url,
        },
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: url,
      // contentId: aiContent.id,
      prompt: finalPrompt,
    });

  } catch (error) {
    console.error('Error generating image:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}