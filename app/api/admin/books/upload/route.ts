import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { normalizeBookFolderName } from '@/lib/book-files';

interface BookUploadData {
  title: string;
  authorName: string;
  authorEmail?: string;
  language: string;
  category: string;
  ageGroup: string;
  summary: string;
  tags: string;
  isbn?: string;
  publicationDate?: string;
  price?: string;
  thumbnailPage: number;
  previewPageLimit: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Extract files
    const mainPdf = formData.get('mainPdf') as File;
    const frontCover = formData.get('frontCover') as File | null;
    const backCover = formData.get('backCover') as File | null;

    // Validate main PDF
    if (!mainPdf || mainPdf.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Main PDF file is required' },
        { status: 400 }
      );
    }

    // Validate file sizes
    if (mainPdf.size > 50 * 1024 * 1024) { // 50MB
      return NextResponse.json(
        { error: 'Main PDF file size cannot exceed 50MB' },
        { status: 400 }
      );
    }

    if (frontCover && frontCover.size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json(
        { error: 'Front cover file size cannot exceed 10MB' },
        { status: 400 }
      );
    }

    if (backCover && backCover.size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json(
        { error: 'Back cover file size cannot exceed 10MB' },
        { status: 400 }
      );
    }

    // Extract and validate form data
    const bookData: BookUploadData = {
      title: formData.get('title') as string,
      authorName: formData.get('authorName') as string,
      authorEmail: formData.get('authorEmail') as string || '',
      language: formData.get('language') as string || 'en',
      category: formData.get('category') as string,
      ageGroup: formData.get('ageGroup') as string,
      summary: formData.get('summary') as string,
      tags: formData.get('tags') as string || '',
      isbn: formData.get('isbn') as string || '',
      publicationDate: formData.get('publicationDate') as string || '',
      price: formData.get('price') as string || '',
      thumbnailPage: parseInt(formData.get('thumbnailPage') as string) || 1,
      previewPageLimit: parseInt(formData.get('previewPageLimit') as string) || 5,
    };

    // Validate required fields
    if (!bookData.title || !bookData.authorName || !bookData.summary) {
      return NextResponse.json(
        { error: 'Title, author name, and summary are required' },
        { status: 400 }
      );
    }

    // Generate book ID from title
    const bookId = normalizeBookFolderName(bookData.title);
    
    // Check if book already exists
    const existingBook = await prisma.story.findFirst({
      where: {
        OR: [
          { id: bookId },
          { title: bookData.title }
        ]
      }
    });

    if (existingBook) {
      return NextResponse.json(
        { error: 'A book with this title already exists' },
        { status: 409 }
      );
    }

    // Create book directory
    const bookDir = join(process.cwd(), 'public', 'books', bookId);
    
    if (!existsSync(bookDir)) {
      await mkdir(bookDir, { recursive: true });
    }

    // Save files
    const mainPdfPath = join(bookDir, 'main.pdf');
    const mainPdfBuffer = Buffer.from(await mainPdf.arrayBuffer());
    await writeFile(mainPdfPath, mainPdfBuffer);

    let frontCoverPath: string | null = null;
    if (frontCover) {
      frontCoverPath = join(bookDir, 'cover.pdf');
      const frontCoverBuffer = Buffer.from(await frontCover.arrayBuffer());
      await writeFile(frontCoverPath, frontCoverBuffer);
    }

    let backCoverPath: string | null = null;
    if (backCover) {
      backCoverPath = join(bookDir, 'back.pdf');
      const backCoverBuffer = Buffer.from(await backCover.arrayBuffer());
      await writeFile(backCoverPath, backCoverBuffer);
    }

    // Find or create author
    let author = await prisma.user.findUnique({
      where: { email: bookData.authorEmail || 'unknown@example.com' }
    });

    if (!author && bookData.authorEmail) {
      try {
        author = await prisma.user.create({
          data: {
            email: bookData.authorEmail,
            name: bookData.authorName,
            role: UserRole.LEARNER,
          }
        });
      } catch {
        // If email already exists but wasn't found (edge case), use admin user
        author = await prisma.user.findUnique({
          where: { id: session.user.id }
        });
      }
    }

    if (!author) {
      // Use the current admin user if no author found/created
      author = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
    }

    if (!author) {
      return NextResponse.json(
        { error: 'Unable to resolve author' },
        { status: 500 }
      );
    }

    // Parse tags
    const tagList = bookData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Create story record in database
    const story = await prisma.story.create({
      data: {
        id: bookId,
        title: bookData.title,
        content: `Book content available in PDF format: /books/${bookId}/main.pdf`,
        summary: bookData.summary,
        language: bookData.language,
        category: bookData.category ? [bookData.category] : ['General'],
        genres: bookData.ageGroup ? [bookData.ageGroup] : [],
        subjects: [],
        isPublished: true,
        tags: tagList,
        authorId: author.id,
        authorName: bookData.authorName,
        price: bookData.price ? parseFloat(bookData.price) : null,
        isbn: bookData.isbn,
        publishedDate: bookData.publicationDate ? new Date(bookData.publicationDate) : null,
        fullPdf: `/books/${bookId}/main.pdf`,
        coverImage: frontCover ? `/books/${bookId}/cover.pdf` : null,
        viewCount: 0,
        likeCount: 0,
        isPremium: !!bookData.price && parseFloat(bookData.price) > 0,
        featured: false
      }
    });

    // Generate thumbnail if needed (this would be done with a background job in production)
    // For now, we'll just log that thumbnail generation is needed
    console.log(`Thumbnail generation needed for book: ${bookId}, page: ${bookData.thumbnailPage}`);

    return NextResponse.json({
      success: true,
      message: 'Book uploaded successfully',
      bookId: story.id,
      story: {
        id: story.id,
        title: story.title,
        summary: story.summary,
        author: {
          id: author.id,
          name: author.name,
          email: author.email,
        },
        files: {
          main: `/books/${bookId}/main.pdf`,
          frontCover: frontCover ? `/books/${bookId}/cover.pdf` : null,
          backCover: backCover ? `/books/${bookId}/back.pdf` : null,
        },
        metadata: {
          authorName: story.authorName,
          language: story.language,
          category: story.category,
          isbn: story.isbn,
          publishedDate: story.publishedDate,
          tags: story.tags,
        },
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading book:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get books with their files
    const [books, totalCount] = await Promise.all([
      prisma.story.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        where: {
          // Only include stories that have PDF files
          fullPdf: {
            not: null
          }
        }
      }),
      prisma.story.count({
        where: {
          fullPdf: {
            not: null
          }
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      books: books.map(book => ({
        ...book,
        files: {
          main: book.fullPdf || null,
          frontCover: book.coverImage || null,
          backCover: null, // Back cover not implemented yet
        }
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}