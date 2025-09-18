import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { promises as fs } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get book details with enhanced PDF fields
    const book = await prisma.book.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        isPublished: true,
        isPremium: true,
        visibility: true,
        pdfStorageKey: true,
        pdfChecksum: true,
        pdfSize: true,
        fullPdf: true, // Legacy field support during transition
        // Access control relations
        assignments: {
          where: {
            studentId: session?.user?.id || '',
            isActive: true
          },
          select: { id: true }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Access control logic
    const hasAccess = await checkBookAccess(book, session);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Determine PDF file path
    const pdfPath = await resolvePdfPath(book);
    if (!pdfPath) {
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 });
    }

    // Verify file exists and get stats
    let fileStats;
    try {
      fileStats = await stat(pdfPath);
    } catch (error) {
      console.error('PDF file not found:', pdfPath, error);
      return NextResponse.json({ error: 'PDF file not available' }, { status: 404 });
    }

    const fileSize = fileStats.size;
    const range = request.headers.get('range');

    // Handle Range requests (HTTP 206 Partial Content)
    if (range) {
      return handleRangeRequest(pdfPath, fileSize, range, book);
    }

    // Handle full file request
    return handleFullFileRequest(pdfPath, fileSize, book);

  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Access control helper
async function checkBookAccess(book: any, session: any): Promise<boolean> {
  // Admin and content managers have full access
  if (session?.user?.role === UserRole.ADMIN || 
      session?.user?.role === UserRole.CONTENT_ADMIN) {
    return true;
  }

  // Public books - anyone can access if published
  if (book.visibility === 'PUBLIC' && book.isPublished) {
    return true;
  }

  // Teacher-controlled access for students
  if (session?.user?.role === UserRole.LEARNER) {
    // Check if student has assignment for this book
    return book.assignments.length > 0;
  }

  // Teachers can access all published books for assignment purposes
  if (session?.user?.role === UserRole.TEACHER && book.isPublished) {
    return true;
  }

  // Story managers can access during review process
  if (session?.user?.role === UserRole.STORY_MANAGER ||
      session?.user?.role === UserRole.BOOK_MANAGER) {
    return true;
  }

  return false;
}

// Resolve PDF file path from storage key or legacy path
async function resolvePdfPath(book: any): Promise<string | null> {
  // New enhanced approach - use pdfStorageKey
  if (book.pdfStorageKey) {
    // Handle different storage backends
    if (book.pdfStorageKey.startsWith('s3://')) {
      // S3 storage - would need to download or stream from S3
      // For now, return null to indicate S3 support not implemented
      throw new Error('S3 storage not yet implemented');
    } else if (book.pdfStorageKey.startsWith('/storage/')) {
      // Local storage path
      return path.join(process.cwd(), 'public', book.pdfStorageKey);
    }
  }

  // Legacy support - use fullPdf field
  if (book.fullPdf) {
    const legacyPath = path.join(process.cwd(), 'public', book.fullPdf);
    try {
      await stat(legacyPath);
      return legacyPath;
    } catch {
      // Legacy file not found
    }
  }

  return null;
}

// Handle HTTP 206 Partial Content requests
function handleRangeRequest(
  filePath: string, 
  fileSize: number, 
  range: string, 
  book: any
): Response {
  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunkSize = (end - start) + 1;

  // Validate range
  if (start >= fileSize || end >= fileSize || start > end) {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${fileSize}`,
      }
    });
  }

  // Create file stream for the requested range
  const fileStream = createReadStream(filePath, { start, end });

  // Convert Node.js ReadableStream to Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      fileStream.on('end', () => {
        controller.close();
      });
      fileStream.on('error', (error) => {
        controller.error(error);
      });
    }
  });

  return new Response(webStream, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
      'ETag': book.pdfChecksum || `"${book.id}-${fileSize}"`,
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
    }
  });
}

// Handle full file requests
async function handleFullFileRequest(
  filePath: string, 
  fileSize: number, 
  book: any
): Promise<Response> {
  const fileBuffer = await fs.readFile(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': fileSize.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
      'ETag': book.pdfChecksum || `"${book.id}-${fileSize}"`,
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      // Content disposition for download
      'Content-Disposition': `inline; filename="${encodeURIComponent(book.title)}.pdf"`
    }
  });
}