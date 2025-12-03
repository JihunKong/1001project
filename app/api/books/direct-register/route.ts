import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  bookRegistrationSchema,
  canDirectRegisterBook,
} from '@/lib/validation/book-registration.schema';
import { uploadCoverImage } from '@/lib/file-upload';

const getStringOrUndefined = (value: FormDataEntryValue | null): string | undefined => {
  if (value === null || value === '') return undefined;
  return String(value);
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!canDirectRegisterBook(session.user.role)) {
      logger.warn(`Unauthorized book registration attempt by role: ${session.user.role}`);
      return NextResponse.json(
        {
          error: 'You do not have permission to directly register books',
          requiredRoles: ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'],
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const coverImageFile = formData.get('coverImage') as File | null;

    const formDataObject = {
      title: formData.get('title') as string,
      subtitle: getStringOrUndefined(formData.get('subtitle')),
      summary: getStringOrUndefined(formData.get('summary')),
      authorName: formData.get('authorName') as string,
      authorAlias: getStringOrUndefined(formData.get('authorAlias')),
      coAuthors: formData.get('coAuthors')
        ? JSON.parse(formData.get('coAuthors') as string)
        : [],
      authorAge: formData.get('authorAge')
        ? parseInt(formData.get('authorAge') as string)
        : undefined,
      authorLocation: getStringOrUndefined(formData.get('authorLocation')),
      contentType: 'TEXT' as const,
      content: formData.get('content') as string,
      language: (formData.get('language') as string) || 'en',
      ageRange: getStringOrUndefined(formData.get('ageRange')),
      readingLevel: getStringOrUndefined(formData.get('readingLevel')),
      category: formData.get('category')
        ? JSON.parse(formData.get('category') as string)
        : [],
      genres: formData.get('genres')
        ? JSON.parse(formData.get('genres') as string)
        : [],
      subjects: formData.get('subjects')
        ? JSON.parse(formData.get('subjects') as string)
        : [],
      tags: formData.get('tags')
        ? JSON.parse(formData.get('tags') as string)
        : [],
      visibility: (formData.get('visibility') as 'PUBLIC' | 'RESTRICTED' | 'CLASSROOM') || 'PUBLIC',
      isPremium: formData.get('isPremium') === 'true',
      price: formData.get('price')
        ? parseFloat(formData.get('price') as string)
        : undefined,
      pageLayout: (formData.get('pageLayout') as 'single' | 'double') || 'single',
      previewPages: formData.get('previewPages')
        ? parseInt(formData.get('previewPages') as string)
        : 10,
    };

    const validation = bookRegistrationSchema.safeParse(formDataObject);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const bookId = `book-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let coverImage: string | null = null;

    if (coverImageFile) {
      const coverUploadResult = await uploadCoverImage(coverImageFile, bookId);
      if (!coverUploadResult.success) {
        return NextResponse.json(
          { error: `Cover image upload failed: ${coverUploadResult.error}` },
          { status: 500 }
        );
      }
      coverImage = coverUploadResult.filePath || null;
    }

    const book = await prisma.book.create({
      data: {
        id: bookId,
        title: data.title,
        subtitle: data.subtitle,
        summary: data.summary,
        authorId: session.user.id,
        authorName: data.authorName,
        authorAlias: data.authorAlias,
        coAuthors: data.coAuthors,
        authorAge: data.authorAge,
        authorLocation: data.authorLocation,
        contentType: 'TEXT',
        content: data.content,
        coverImage: coverImage,
        language: data.language,
        ageRange: data.ageRange,
        readingLevel: data.readingLevel,
        category: data.category,
        genres: data.genres,
        subjects: data.subjects,
        tags: data.tags,
        visibility: data.visibility,
        isPremium: data.isPremium,
        price: data.price,
        pageLayout: data.pageLayout,
        previewPages: data.previewPages,
        isPublished: true,
        publishedDate: new Date(),
        publishedAt: new Date(),
      },
    });

    logger.info(`Book directly registered by ${session.user.role}`, {
      bookId: book.id,
      userId: session.user.id,
      contentType: data.contentType,
      role: session.user.role,
    });

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        authorName: book.authorName,
        contentType: book.contentType,
        isPublished: book.isPublished,
      },
      message: 'Book registered successfully and published immediately',
    });
  } catch (error) {
    logger.error('Direct book registration error', error);

    return NextResponse.json(
      {
        error: 'Failed to register book',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
