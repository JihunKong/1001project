import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, BookContentType, BookVisibility } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { uploadPDF, uploadCoverImage, deleteFile } from '@/lib/file-upload';
import { canEditAnyBook } from '@/lib/validation/book-registration.schema';

// Validation schema for book updates
const UpdateBookSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  subtitle: z.string()
    .max(200, 'Subtitle must be less than 200 characters')
    .trim()
    .optional(),
  summary: z.string()
    .min(50, 'Summary must be at least 50 characters')
    .max(2000, 'Summary must be less than 2000 characters')
    .trim()
    .optional(),
  content: z.string()
    .min(100, 'Content must be at least 100 characters')
    .max(100000, 'Content must be less than 100,000 characters')
    .optional(),
  contentType: z.enum(['TEXT', 'PDF', 'EPUB', 'AUDIO', 'MULTIMEDIA', 'INTERACTIVE'])
    .optional(),
  authorName: z.string()
    .min(1, 'Author name is required')
    .max(100, 'Author name must be less than 100 characters')
    .trim()
    .optional(),
  authorAlias: z.string()
    .max(100, 'Author alias must be less than 100 characters')
    .trim()
    .optional(),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code must be less than 5 characters')
    .optional(),
  ageRange: z.string()
    .max(50, 'Age range must be less than 50 characters')
    .optional(),
  readingLevel: z.string()
    .max(50, 'Reading level must be less than 50 characters')
    .optional(),
  category: z.array(z.string().max(50))
    .max(5, 'Maximum 5 categories allowed')
    .optional(),
  genres: z.array(z.string().max(50))
    .max(5, 'Maximum 5 genres allowed')
    .optional(),
  tags: z.array(z.string().max(30))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  visibility: z.enum(['PUBLIC', 'RESTRICTED', 'CLASSROOM', 'PRIVATE'])
    .optional(),
  isPremium: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  price: z.number().min(0).optional(),
});

// GET /api/books/[id] - Get single book details
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Get session for access control
    const session = await getServerSession(authOptions);

    // Find book with comprehensive details
    const book = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        content: true,
        contentType: true,
        authorId: true,
        authorName: true,
        authorAlias: true,
        language: true,
        ageRange: true,
        readingLevel: true,
        readingTime: true,
        category: true,
        genres: true,
        subjects: true,
        tags: true,
        coverImage: true,
        illustrations: true,
        pdfKey: true,
        pageCount: true,
        previewPages: true,
        downloadAllowed: true,
        printAllowed: true,
        visibility: true,
        isPremium: true,
        isPublished: true,
        featured: true,
        price: true,
        currency: true,
        viewCount: true,
        downloadCount: true,
        likeCount: true,
        rating: true,
        publishedDate: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        // Include author details if available
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: {
              select: {
                organization: true,
                bio: true,
              }
            }
          }
        },
        // Include chapters for structured content
        chapters: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            readingTime: true,
          },
          orderBy: { chapterNumber: 'asc' }
        },
        // Include reading progress for authenticated users
        ...(session?.user ? {
          readingProgress: {
            where: { userId: session.user.id },
            select: {
              currentChapter: true,
              currentPage: true,
              percentComplete: true,
              lastReadAt: true,
              isCompleted: true,
            }
          }
        } : {}),
        // Include bookmarks for authenticated users
        ...(session?.user ? {
          bookmarks: {
            where: { userId: session.user.id },
            select: {
              id: true,
              chapterId: true,
              position: true,
              note: true,
              color: true,
            }
          }
        } : {}),
        // Include reviews summary
        reviews: {
          select: {
            rating: true,
            verified: true,
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Access control checks
    const canAccess = await checkBookAccess(book, session);
    if (!canAccess.allowed) {
      return NextResponse.json(
        { error: canAccess.reason },
        { status: canAccess.status || 403 }
      );
    }

    // Increment view count (non-blocking)
    prisma.book.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    }).catch(error => logger.error('Error incrementing book view count', error, { bookId: id }));

    // Calculate review statistics
    const reviewStats = calculateReviewStats(book.reviews);

    // Format response based on access level
    const response = {
      ...book,
      reviews: reviewStats,
      userProgress: book.readingProgress?.[0] || null,
      userBookmarks: book.bookmarks || [],
      accessLevel: canAccess.level,
      canDownload: canAccess.canDownload,
      canPrint: canAccess.canPrint,
    };

    // Remove sensitive data based on access level
    if (canAccess.level === 'preview') {
      const { content, ...responseWithoutContent } = response;
      return NextResponse.json({
        ...responseWithoutContent,
        previewContent: book.content?.substring(0, 1000) + '...',
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error fetching book', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] - Update book (supports both JSON and FormData)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingBook = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        isPublished: true,
        pdfKey: true,
        coverImage: true,
        contentType: true,
      }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const canEdit = session.user.role === UserRole.ADMIN ||
                   canEditAnyBook(session.user.role) ||
                   existingBook.authorId === session.user.id;

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let validatedData: z.infer<typeof UpdateBookSchema>;
    let pdfFile: File | null = null;
    let coverImageFile: File | null = null;

    if (isFormData) {
      const formData = await request.formData();

      pdfFile = formData.get('pdfFile') as File | null;
      coverImageFile = formData.get('coverImage') as File | null;

      const formDataObject: Record<string, unknown> = {};

      const stringFields = ['title', 'subtitle', 'summary', 'content', 'authorName',
                          'authorAlias', 'language', 'ageRange', 'readingLevel',
                          'contentType', 'visibility', 'pageLayout'];

      for (const field of stringFields) {
        const value = formData.get(field);
        if (value !== null && value !== '') {
          formDataObject[field] = value as string;
        }
      }

      const arrayFields = ['category', 'genres', 'subjects', 'tags'];
      for (const field of arrayFields) {
        const value = formData.get(field);
        if (value) {
          try {
            formDataObject[field] = JSON.parse(value as string);
          } catch {
            formDataObject[field] = [];
          }
        }
      }

      const booleanFields = ['isPremium', 'isPublished', 'featured', 'removeCoverImage', 'removePdf'];
      for (const field of booleanFields) {
        const value = formData.get(field);
        if (value !== null) {
          formDataObject[field] = value === 'true';
        }
      }

      const numberFields = ['price', 'previewPages'];
      for (const field of numberFields) {
        const value = formData.get(field);
        if (value !== null && value !== '') {
          formDataObject[field] = parseFloat(value as string);
        }
      }

      try {
        validatedData = UpdateBookSchema.parse(formDataObject);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: error.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
              }))
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Invalid request data' },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      try {
        validatedData = UpdateBookSchema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: error.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
              }))
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Invalid request data' },
          { status: 400 }
        );
      }
    }

    if (existingBook.isPublished &&
        validatedData.isPublished === false &&
        session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only administrators can unpublish books' },
        { status: 403 }
      );
    }

    let newPdfKey: string | null | undefined = undefined;
    let newCoverImage: string | null | undefined = undefined;

    if (pdfFile && pdfFile.size > 0) {
      const pdfUploadResult = await uploadPDF(pdfFile, id);
      if (!pdfUploadResult.success) {
        return NextResponse.json(
          { error: `PDF upload failed: ${pdfUploadResult.error}` },
          { status: 500 }
        );
      }
      newPdfKey = pdfUploadResult.filePath || null;

      if (existingBook.pdfKey) {
        await deleteFile(existingBook.pdfKey);
      }
    }

    if (coverImageFile && coverImageFile.size > 0) {
      const coverUploadResult = await uploadCoverImage(coverImageFile, id);
      if (!coverUploadResult.success) {
        return NextResponse.json(
          { error: `Cover image upload failed: ${coverUploadResult.error}` },
          { status: 500 }
        );
      }
      newCoverImage = coverUploadResult.filePath || null;

      if (existingBook.coverImage) {
        await deleteFile(existingBook.coverImage);
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([key, value]) =>
        value !== undefined && key !== 'removeCoverImage' && key !== 'removePdf'
      )
    );

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        ...updateData,
        ...(newPdfKey !== undefined && { pdfKey: newPdfKey }),
        ...(newCoverImage !== undefined && { coverImage: newCoverImage }),
        ...(validatedData.contentType && { contentType: validatedData.contentType as BookContentType }),
        ...(validatedData.visibility && { visibility: validatedData.visibility as BookVisibility }),
        ...(validatedData.isPublished && !existingBook.isPublished && {
          publishedAt: new Date(),
          publishedDate: new Date(),
        }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        content: true,
        contentType: true,
        authorName: true,
        authorAlias: true,
        language: true,
        ageRange: true,
        category: true,
        tags: true,
        coverImage: true,
        pdfKey: true,
        visibility: true,
        isPremium: true,
        price: true,
        isPublished: true,
        publishedAt: true,
        updatedAt: true,
      }
    });

    logger.info(`Book updated by ${session.user.role}`, {
      bookId: id,
      userId: session.user.id,
      role: session.user.role,
    });

    return NextResponse.json({
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (error) {
    logger.error('Error updating book', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Delete book (Admin only)
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete books
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Soft delete by updating visibility and adding deleted flag
    // In a full implementation, you might want a deletedAt field
    await prisma.book.update({
      where: { id },
      data: {
        visibility: 'PRIVATE',
        isPublished: false,
        title: `[DELETED] ${book.title}`,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Book deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting book', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check book access permissions
async function checkBookAccess(book: any, session: any) {
  // Admin access
  if (session?.user?.role === UserRole.ADMIN) {
    return {
      allowed: true,
      level: 'full',
      canDownload: true,
      canPrint: true,
    };
  }

  // Author access
  if (session?.user?.id === book.authorId) {
    return {
      allowed: true,
      level: 'full',
      canDownload: true,
      canPrint: true,
    };
  }

  // Check if book is published
  if (!book.isPublished) {
    return {
      allowed: false,
      reason: 'Book is not published',
      status: 404,
    };
  }

  // Check visibility
  if (book.visibility === 'PRIVATE') {
    return {
      allowed: false,
      reason: 'Book is private',
      status: 403,
    };
  }

  // Premium book access
  if (book.isPremium && session?.user) {
    // Check user entitlements (simplified for now)
    const hasAccess = await prisma.entitlement.findFirst({
      where: {
        userId: session.user.id,
        bookId: book.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!hasAccess) {
      return {
        allowed: true,
        level: 'preview',
        canDownload: false,
        canPrint: false,
        reason: 'Premium content - purchase required for full access',
      };
    }
  }

  // Public access
  return {
    allowed: true,
    level: book.isPremium ? 'preview' : 'full',
    canDownload: book.downloadAllowed,
    canPrint: book.printAllowed,
  };
}

// Helper function to calculate review statistics
function calculateReviewStats(reviews: any[]) {
  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      verifiedReviews: 0,
    };
  }

  const totalReviews = reviews.length;
  const verifiedReviews = reviews.filter(r => r.verified).length;
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    verifiedReviews,
  };
}