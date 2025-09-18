import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, BookStatus } from '@prisma/client';

// GET /api/admin/books - Enhanced books management with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as BookStatus | '';
    const isPublished = searchParams.get('isPublished') || '';
    const language = searchParams.get('language') || '';
    const isPremium = searchParams.get('isPremium') || '';
    const featured = searchParams.get('featured') || '';
    const hasPdf = searchParams.get('hasPdf') || '';
    const levelBand = searchParams.get('levelBand') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const authorName = searchParams.get('authorName') || '';
    const category = searchParams.get('category') || '';

    // Build where clause for filtering
    const whereClause: any = {};

    // Search across multiple fields
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filtering
    if (status && Object.values(BookStatus).includes(status)) {
      whereClause.status = status;
    }

    // Published status
    if (isPublished !== '') {
      whereClause.isPublished = isPublished === 'true';
    }

    // Language filtering
    if (language) {
      whereClause.language = language;
    }

    // Premium filtering
    if (isPremium !== '') {
      whereClause.isPremium = isPremium === 'true';
    }

    // Featured filtering
    if (featured !== '') {
      whereClause.featured = featured === 'true';
    }

    // PDF filtering
    if (hasPdf === 'true') {
      whereClause.OR = [
        { pdfStorageKey: { not: null } },
        { fullPdf: { not: null } }
      ];
    } else if (hasPdf === 'false') {
      whereClause.AND = [
        { pdfStorageKey: null },
        { fullPdf: null }
      ];
    } else if (hasPdf === 'enhanced') {
      whereClause.AND = [
        { pdfChecksum: { not: null } },
        { pdfSize: { not: null } }
      ];
    }

    // Level band filtering
    if (levelBand) {
      whereClause.levelBand = levelBand;
    }

    // Date range filtering
    if (dateFrom) {
      whereClause.createdAt = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      if (whereClause.createdAt) {
        whereClause.createdAt.lte = new Date(dateTo);
      } else {
        whereClause.createdAt = { lte: new Date(dateTo) };
      }
    }

    // Author name filtering
    if (authorName) {
      whereClause.authorName = { contains: authorName, mode: 'insensitive' };
    }

    // Category filtering
    if (category) {
      whereClause.category = { has: category };
    }

    // Get total count for pagination
    const totalCount = await prisma.book.count({ where: whereClause });

    // Fetch books with pagination and relations
    const books = await prisma.book.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        language: true,
        category: true,
        isPublished: true,
        isPremium: true,
        featured: true,
        status: true,
        levelBand: true,
        visibility: true,
        
        // Enhanced PDF fields
        pdfStorageKey: true,
        pdfChecksum: true,
        pdfSize: true,
        pdfPageCount: true,
        pdfUploadedAt: true,
        fullPdf: true, // Legacy support
        
        // Timestamps
        createdAt: true,
        updatedAt: true,
        publishedDate: true,
        
        // Stats
        viewCount: true,
        likeCount: true,
        
        // Relationships - get assignment count
        assignments: {
          select: { id: true },
          where: { isActive: true }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get statistics for dashboard
    const stats = await getBookStatistics();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      authorName,
      summary,
      content,
      language = 'en',
      category = [],
      levelBand,
      isPremium = false,
      featured = false,
      visibility = 'PUBLIC'
    } = body;

    // Validate required fields
    if (!title || !authorName) {
      return NextResponse.json(
        { error: 'Title and author name are required' },
        { status: 400 }
      );
    }

    // Create new book
    const book = await prisma.book.create({
      data: {
        title,
        authorName,
        summary,
        content,
        language,
        category,
        levelBand,
        isPremium,
        featured,
        visibility,
        status: BookStatus.DRAFT, // Start as draft
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Book created successfully',
      book
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/books - Update book (bulk or single)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      authorName,
      summary,
      content,
      language,
      category,
      levelBand,
      isPremium,
      featured,
      visibility,
      status,
      isPublished,
      pdfStorageKey,
      pdfChecksum,
      pdfSize,
      pdfPageCount
    } = body;

    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (authorName !== undefined) updateData.authorName = authorName;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (language !== undefined) updateData.language = language;
    if (category !== undefined) updateData.category = category;
    if (levelBand !== undefined) updateData.levelBand = levelBand;
    if (typeof isPremium === 'boolean') updateData.isPremium = isPremium;
    if (typeof featured === 'boolean') updateData.featured = featured;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (status !== undefined && Object.values(BookStatus).includes(status)) {
      updateData.status = status;
    }
    if (typeof isPublished === 'boolean') {
      updateData.isPublished = isPublished;
      if (isPublished) {
        updateData.publishedDate = new Date();
      }
    }

    // Enhanced PDF fields
    if (pdfStorageKey !== undefined) updateData.pdfStorageKey = pdfStorageKey;
    if (pdfChecksum !== undefined) updateData.pdfChecksum = pdfChecksum;
    if (pdfSize !== undefined) updateData.pdfSize = pdfSize;
    if (pdfPageCount !== undefined) updateData.pdfPageCount = pdfPageCount;

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        authorName: true,
        status: true,
        isPublished: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/books?id=<id> - Delete book
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true,
        assignments: { select: { id: true } } 
      }
    });

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if book has active assignments
    if (existingBook.assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete book with active assignments. Please remove assignments first.' 
      }, { status: 400 });
    }

    // Delete the book (cascade will handle related records)
    await prisma.book.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Book "${existingBook.title}" deleted successfully` 
    });

  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get book statistics
async function getBookStatistics() {
  const [
    totalBooks,
    publishedBooks,
    draftBooks,
    withPdfEnhanced,
    withPdfLegacy,
    withoutPdf
  ] = await Promise.all([
    // Total books
    prisma.book.count(),
    
    // Published books
    prisma.book.count({ where: { isPublished: true } }),
    
    // Draft books
    prisma.book.count({ where: { status: BookStatus.DRAFT } }),
    
    // Books with enhanced PDF info
    prisma.book.count({
      where: {
        AND: [
          { pdfStorageKey: { not: null } },
          { pdfChecksum: { not: null } }
        ]
      }
    }),
    
    // Books with legacy PDF
    prisma.book.count({
      where: {
        AND: [
          { fullPdf: { not: null } },
          { pdfStorageKey: null }
        ]
      }
    }),
    
    // Books without PDF
    prisma.book.count({
      where: {
        AND: [
          { pdfStorageKey: null },
          { fullPdf: null }
        ]
      }
    })
  ]);

  const withPdf = withPdfEnhanced + withPdfLegacy;

  return {
    totalBooks,
    publishedBooks,
    draftBooks,
    withPdf,
    withoutPdf,
    // Additional stats
    enhancedPdf: withPdfEnhanced,
    legacyPdf: withPdfLegacy,
  };
}