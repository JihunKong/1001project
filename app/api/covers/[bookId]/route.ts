import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Dynamic Book Cover API
 * Serves book covers with intelligent fallback chain:
 * 1. Try PNG cover: /books/{bookId}/cover.png
 * 2. Try PDF front cover: /books/{bookId}/front.pdf
 * 3. Return placeholder image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    
    if (!bookId) {
      return new NextResponse('Book ID is required', { status: 400 });
    }

    // Security check - prevent path traversal
    const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9-_]/g, '');
    if (sanitizedBookId !== bookId) {
      return new NextResponse('Invalid book ID format', { status: 400 });
    }

    const booksDir = path.join(process.cwd(), 'public', 'books', bookId);
    const publicDir = path.join(process.cwd(), 'public');
    
    // Try PNG cover first
    const pngCoverPath = path.join(booksDir, 'cover.png');
    if (fs.existsSync(pngCoverPath)) {
      const imageBuffer = fs.readFileSync(pngCoverPath);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Content-Length': imageBuffer.length.toString(),
        },
      });
    }

    // Try PDF front cover
    const pdfFrontCoverPath = path.join(booksDir, 'front.pdf');
    if (fs.existsSync(pdfFrontCoverPath)) {
      // For PDF covers, we redirect to the PDF API with front cover
      const pdfUrl = `/api/pdf/books/${bookId}/front.pdf`;
      return NextResponse.redirect(new URL(pdfUrl, request.url));
    }

    // Try JPEG/JPG fallback
    const jpgCoverPath = path.join(booksDir, 'cover.jpg');
    if (fs.existsSync(jpgCoverPath)) {
      const imageBuffer = fs.readFileSync(jpgCoverPath);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'Content-Length': imageBuffer.length.toString(),
        },
      });
    }

    // Fallback to placeholder
    const placeholderPath = path.join(publicDir, 'images', 'placeholder-book.jpg');
    if (fs.existsSync(placeholderPath)) {
      const imageBuffer = fs.readFileSync(placeholderPath);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400', // Cache placeholder longer
          'Content-Length': imageBuffer.length.toString(),
        },
      });
    }

    // Generate a simple placeholder if nothing exists
    return new NextResponse('Book cover not found', { status: 404 });

  } catch (error) {
    console.error('Error serving book cover:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}