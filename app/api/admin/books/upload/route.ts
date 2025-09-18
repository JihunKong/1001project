import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { normalizeBookFolderName } from '@/lib/book-files';
import { validateFileSignature, sanitizeFilename, validateFileSize } from '@/lib/file-validation';
import { logAuditEvent } from '@/lib/security/headers';

// Configure the API to handle large files (100MB)
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

interface BookUploadData {
  title: string;
  authorName: string;
  authorEmail?: string;
  language: string;
  category: string;
  ageGroup: string;
  summary: string;
  tags: string;
  isbn?: string | null;
  publicationDate?: string;
  price?: string;
  thumbnailPage: number;
  previewPageLimit: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let uploadSuccess = false;
  let session: any = null;
  let mainPdf: File | null = null;
  const userIp = request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session?.user?.id,
        action: 'UNAUTHORIZED_BOOK_UPLOAD',
        resource: '/api/admin/books/upload',
        ip: userIp,
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: { reason: 'Not admin user' }
      });
      
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Extract files
    mainPdf = formData.get('mainPdf') as File;
    const frontCover = formData.get('frontCover') as File | null;
    const backCover = formData.get('backCover') as File | null;

    // Validate main PDF file presence
    if (!mainPdf) {
      return NextResponse.json(
        { error: 'Main PDF file is required' },
        { status: 400 }
      );
    }

    // Enhanced PDF validation with signature checking
    const pdfValidation = await validateFileSignature(mainPdf, ['pdf']);
    if (!pdfValidation.isValid) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'INVALID_PDF_UPLOAD',
        resource: '/api/admin/books/upload',
        ip: userIp,
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: { 
          fileName: mainPdf.name,
          fileSize: mainPdf.size,
          detectedType: pdfValidation.detectedType || 'unknown',
          error: pdfValidation.error || 'Validation failed'
        }
      });
      
      return NextResponse.json(
        { error: `Invalid PDF file: ${pdfValidation.error}` },
        { status: 400 }
      );
    }

    // Validate PDF file size
    const pdfSizeValidation = validateFileSize(mainPdf, 100 * 1024 * 1024);
    if (!pdfSizeValidation.isValid) {
      return NextResponse.json(
        { error: pdfSizeValidation.error },
        { status: 400 }
      );
    }

    // Validate front cover image if provided
    if (frontCover) {
      const frontCoverValidation = await validateFileSignature(frontCover, ['png', 'jpg', 'jpeg', 'webp']);
      if (!frontCoverValidation.isValid) {
        return NextResponse.json(
          { error: `Invalid front cover image: ${frontCoverValidation.error}` },
          { status: 400 }
        );
      }
      
      const frontCoverSizeValidation = validateFileSize(frontCover, 10 * 1024 * 1024);
      if (!frontCoverSizeValidation.isValid) {
        return NextResponse.json(
          { error: `Front cover: ${frontCoverSizeValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Validate back cover image if provided
    if (backCover) {
      const backCoverValidation = await validateFileSignature(backCover, ['png', 'jpg', 'jpeg', 'webp']);
      if (!backCoverValidation.isValid) {
        return NextResponse.json(
          { error: `Invalid back cover image: ${backCoverValidation.error}` },
          { status: 400 }
        );
      }
      
      const backCoverSizeValidation = validateFileSize(backCover, 10 * 1024 * 1024);
      if (!backCoverSizeValidation.isValid) {
        return NextResponse.json(
          { error: `Back cover: ${backCoverSizeValidation.error}` },
          { status: 400 }
        );
      }
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
      isbn: formData.get('isbn') as string || null,
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
    let bookId = normalizeBookFolderName(bookData.title);
    
    // Check if book already exists and generate unique ID if needed
    const existingBook = await prisma.story.findFirst({
      where: {
        OR: [
          { id: bookId },
          { title: bookData.title }
        ]
      }
    });

    if (existingBook) {
      // If exact title match, reject
      if (existingBook.title === bookData.title) {
        return NextResponse.json(
          { error: 'A book with this exact title already exists' },
          { status: 409 }
        );
      }
      
      // If ID match, generate unique ID by appending timestamp
      if (existingBook.id === bookId) {
        bookId = `${bookId}-${Date.now()}`;
      }
    }

    // Additional check to ensure the new bookId doesn't exist
    const existingById = await prisma.story.findUnique({ where: { id: bookId } });
    if (existingById) {
      bookId = `${bookId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create book directory
    const bookDir = join(process.cwd(), 'public', 'books', bookId);
    
    if (!existsSync(bookDir)) {
      await mkdir(bookDir, { recursive: true });
    }

    // Save files with sanitized names
    const sanitizedMainPdfName = sanitizeFilename('main.pdf');
    const mainPdfPath = join(bookDir, sanitizedMainPdfName);
    const mainPdfBuffer = Buffer.from(await mainPdf.arrayBuffer());
    await writeFile(mainPdfPath, mainPdfBuffer);

    let frontCoverPath: string | null = null;
    if (frontCover) {
      const sanitizedCoverName = sanitizeFilename('cover.pdf');
      frontCoverPath = join(bookDir, sanitizedCoverName);
      const frontCoverBuffer = Buffer.from(await frontCover.arrayBuffer());
      await writeFile(frontCoverPath, frontCoverBuffer);
    }

    let backCoverPath: string | null = null;
    if (backCover) {
      const sanitizedBackName = sanitizeFilename('back.pdf');
      backCoverPath = join(bookDir, sanitizedBackName);
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

    // Create book record in database
    const book = await prisma.book.create({
      data: {
        id: bookId,
        title: bookData.title,
        summary: bookData.summary,
        authorName: bookData.authorName,
        language: bookData.language,
        category: bookData.category ? [bookData.category] : ['General'],
        genres: bookData.ageGroup ? [bookData.ageGroup] : [],
        subjects: [],
        tags: tagList,
        isPublished: true,
        isPremium: !!bookData.price && parseFloat(bookData.price) > 0,
        price: bookData.price ? parseFloat(bookData.price) : null,
        currency: 'USD',
        pdfKey: `/books/${bookId}/main.pdf`,
        pdfFrontCover: frontCover ? `/books/${bookId}/front.pdf` : null,
        pdfBackCover: backCover ? `/books/${bookId}/back.pdf` : null,
        previewPages: bookData.previewPageLimit,
        coverImage: frontCover ? `/books/${bookId}/front.pdf` : null,
        downloadAllowed: false,
        printAllowed: false
      }
    });

    // Generate thumbnails after successful upload
    try {
      const thumbnailPromises = [];

      // Generate front cover thumbnail if available
      if (frontCover) {
        thumbnailPromises.push(
          fetch(`${process.env.NEXTAUTH_URL}/api/thumbnails/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId: bookId,
              type: 'cover_front',
              pageNumber: 1,
              force: true
            })
          })
        );
      }

      // Generate back cover thumbnail if available
      if (backCover) {
        thumbnailPromises.push(
          fetch(`${process.env.NEXTAUTH_URL}/api/thumbnails/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId: bookId,
              type: 'cover_back',
              pageNumber: 1,
              force: true
            })
          })
        );
      }

      // Generate main book thumbnail from specified page
      thumbnailPromises.push(
        fetch(`${process.env.NEXTAUTH_URL}/api/thumbnails/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: bookId,
            type: 'book_content',
            pageNumber: bookData.thumbnailPage,
            force: true
          })
        })
      );

      // Wait for all thumbnail generations (don't fail upload if thumbnails fail)
      const results = await Promise.allSettled(thumbnailPromises);
      const successfulThumbnails = results.filter(r => r.status === 'fulfilled');
      
      console.log(`Generated ${successfulThumbnails.length}/${thumbnailPromises.length} thumbnails for book: ${bookId}`);

      // Update book with thumbnail information
      const thumbnailPaths: any = {};
      if (frontCover) thumbnailPaths.frontCover = `/thumbnails/${bookId}/cover_front-page-1.png`;
      if (backCover) thumbnailPaths.backCover = `/thumbnails/${bookId}/cover_back-page-1.png`;
      thumbnailPaths.mainPage = `/thumbnails/${bookId}/book_content-page-${bookData.thumbnailPage}.png`;

      // Update book with thumbnail paths when schema is ready
      // await prisma.book.update({
      //   where: { id: bookId },
      //   data: {
      //     thumbnails: thumbnailPaths,
      //     thumbnailGeneratedAt: new Date(),
      //     coverImage: frontCover ? thumbnailPaths.frontCover : thumbnailPaths.mainPage
      //   }
      // });

    } catch (thumbnailError) {
      // Log but don't fail the upload if thumbnail generation fails
      console.error('Error generating thumbnails:', thumbnailError);
    }

    // Log successful upload
    uploadSuccess = true;
    await logAuditEvent({
      timestamp: new Date(),
      userId: session.user.id,
      action: 'BOOK_UPLOAD_SUCCESS',
      resource: '/api/admin/books/upload',
      ip: userIp,
      userAgent: request.headers.get('user-agent') || '',
      success: true,
      metadata: {
        bookId: book.id,
        title: book.title,
        authorName: book.authorName,
        fileSize: mainPdf.size,
        hasFrontCover: !!frontCover,
        hasBackCover: !!backCover,
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Book uploaded successfully',
      bookId: book.id,
      book: {
        id: book.id,
        title: book.title,
        summary: book.summary,
        author: {
          id: author.id,
          name: author.name,
          email: author.email,
        },
        files: {
          main: `/books/${bookId}/main.pdf`,
          frontCover: frontCover ? `/books/${bookId}/front.pdf` : null,
          backCover: backCover ? `/books/${bookId}/back.pdf` : null,
        },
        // thumbnails: book.thumbnails, // Will be added when schema is ready
        metadata: {
          authorName: book.authorName,
          language: book.language,
          category: book.category,
          tags: book.tags,
          isPremium: book.isPremium,
          price: book.price,
          previewPages: book.previewPages
        },
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading book:', error);
    
    // Log upload failure
    if (!uploadSuccess) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session?.user?.id,
        action: 'BOOK_UPLOAD_FAILURE',
        resource: '/api/admin/books/upload',
        ip: userIp,
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
          fileSize: mainPdf?.size || 0
        }
      });
    }
    
    // More detailed error handling
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            error: 'Book already exists', 
            details: 'A book with this title or ID already exists. Please use a different title.'
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            error: 'Author not found', 
            details: 'The specified author does not exist. Please check the author email.'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('ENOENT') || error.message.includes('EACCES')) {
        return NextResponse.json(
          { 
            error: 'File system error', 
            details: 'Unable to save book files. Please check file permissions.'
          },
          { status: 500 }
        );
      }

      // Log the full error for debugging
      console.error('Book upload error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return NextResponse.json(
        { 
          error: 'Upload failed', 
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: 'Unknown error occurred during book upload'
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
      prisma.book.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          authorName: true,
          summary: true,
          language: true,
          category: true,
          tags: true,
          isPremium: true,
          price: true,
          currency: true,
          pdfKey: true,
          pdfFrontCover: true,
          pdfBackCover: true,
          coverImage: true,
          // thumbnails: true,
          // thumbnailGeneratedAt: true,
          previewPages: true,
          isPublished: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true
        },
        where: {
          // Only include books that have PDF files
          pdfKey: {
            not: null
          }
        }
      }),
      prisma.book.count({
        where: {
          pdfKey: {
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
          main: book.pdfKey || null,
          frontCover: book.pdfFrontCover || null,
          backCover: book.pdfBackCover || null,
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