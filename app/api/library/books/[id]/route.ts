import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * GET /api/library/books/[id]
 * 
 * Returns a single book by ID with access control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Get current user session
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Fetch book from database
    const book = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        content: true,
        authorName: true,
        authorAlias: true,
        authorAge: true,
        authorLocation: true,
        coAuthors: true,
        language: true,
        ageRange: true,
        readingLevel: true,
        category: true,
        genres: true,
        subjects: true,
        tags: true,
        isPremium: true,
        price: true,
        currency: true,
        coverImage: true,
        previewPages: true,
        pageCount: true,
        viewCount: true,
        downloadCount: true,
        rating: true,
        featured: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        format: true,
        pdfKey: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if book is published (unless user is admin)
    const userRole = session?.user?.role;
    if (!book.isPublished && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Transform book data for response
    const bookData = {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle || undefined,
      summary: book.summary || undefined,
      content: book.content || undefined,
      authorName: book.authorName,
      authorAlias: book.authorAlias || undefined,
      authorAge: book.authorAge || undefined,
      authorLocation: book.authorLocation || undefined,
      coAuthors: book.coAuthors || [],
      language: book.language,
      ageRange: book.ageRange || undefined,
      readingLevel: book.readingLevel || undefined,
      category: book.category || [],
      genres: book.genres || [],
      subjects: book.subjects || [],
      tags: book.tags || [],
      isPremium: book.isPremium,
      price: book.price ? Number(book.price) : undefined,
      currency: book.currency || undefined,
      coverImage: book.coverImage || undefined,
      previewPages: book.previewPages || undefined,
      pageCount: book.pageCount || undefined,
      viewCount: book.viewCount || 0,
      downloadCount: book.downloadCount || 0,
      rating: book.rating || undefined,
      featured: book.featured || false,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      format: book.format || 'pdf',
      pdfKey: book.pdfKey || undefined,
      hasAccess: true // TODO: Implement proper access control
    };

    // Increment view count (fire and forget)
    if (currentUserId) {
      prisma.book.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {}); // Ignore errors for view count updates
    }

    return NextResponse.json({
      success: true,
      book: bookData
    });
    
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch book',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
