import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const PDF_BASE_PATH = '/Users/jihunkong/1001project/processed-books';

type PdfType = 'main' | 'sample' | 'front' | 'back';

interface BookPdfPaths {
  main: string | null;
  sample: string | null;
  front: string | null;
  back: string | null;
}

function getBookPdfPaths(bookSlug: string): BookPdfPaths {
  const bookDir = path.join(PDF_BASE_PATH, bookSlug);

  return {
    main: fs.existsSync(path.join(bookDir, 'main.pdf')) ? path.join(bookDir, 'main.pdf') : null,
    sample: fs.existsSync(path.join(bookDir, 'sample.pdf')) ? path.join(bookDir, 'sample.pdf') : null,
    front: fs.existsSync(path.join(bookDir, 'front.pdf')) ? path.join(bookDir, 'front.pdf') : null,
    back: fs.existsSync(path.join(bookDir, 'back.pdf')) ? path.join(bookDir, 'back.pdf') : null,
  };
}

async function checkPdfAccess(
  userId: string | null,
  userRole: UserRole | null,
  bookId: string,
  pdfType: PdfType
): Promise<{ allowed: boolean; reason?: string }> {
  if (pdfType === 'sample' || pdfType === 'front' || pdfType === 'back') {
    return { allowed: true };
  }

  if (!userId) {
    return { allowed: false, reason: 'Authentication required for full PDF access' };
  }

  if (userRole === UserRole.ADMIN || userRole === UserRole.TEACHER ||
      userRole === UserRole.CONTENT_ADMIN || userRole === UserRole.BOOK_MANAGER) {
    return { allowed: true };
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      resources: {
        has: `book:${bookId}`
      },
      class: {
        enrollments: {
          some: {
            studentId: userId,
            status: 'ACTIVE'
          }
        }
      }
    }
  });

  if (assignment) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'This book has not been assigned to you' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const { searchParams } = new URL(request.url);
    const pdfType = (searchParams.get('type') || 'sample') as PdfType;

    if (!['main', 'sample', 'front', 'back'].includes(pdfType)) {
      return NextResponse.json({ error: 'Invalid PDF type' }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        pdfKey: true,
        samplePdf: true,
        pdfFrontCover: true,
        pdfBackCover: true,
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const userRole = session?.user?.role as UserRole | null;

    const accessCheck = await checkPdfAccess(userId, userRole, bookId, pdfType);
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    let pdfPath: string | null = null;

    if (book.pdfKey) {
      const bookFolder = book.pdfKey.includes('/') ? path.dirname(book.pdfKey) : book.pdfKey;
      const fullBookFolder = bookFolder.startsWith('/') ? bookFolder : path.join(PDF_BASE_PATH, bookFolder);

      if (fs.existsSync(fullBookFolder)) {
        const paths = getBookPdfPaths(path.basename(fullBookFolder));
        pdfPath = paths[pdfType];
      }
    }

    if (!pdfPath && pdfType === 'main' && book.pdfKey) {
      const fullPath = book.pdfKey.startsWith('/') ? book.pdfKey : path.join(PDF_BASE_PATH, book.pdfKey);
      if (fs.existsSync(fullPath)) {
        pdfPath = fullPath;
      }
    }
    if (!pdfPath && pdfType === 'sample' && book.samplePdf) {
      const fullPath = book.samplePdf.startsWith('/') ? book.samplePdf : path.join(PDF_BASE_PATH, book.samplePdf);
      if (fs.existsSync(fullPath)) {
        pdfPath = fullPath;
      }
    }
    if (!pdfPath && pdfType === 'front' && book.pdfFrontCover) {
      const fullPath = book.pdfFrontCover.startsWith('/') ? book.pdfFrontCover : path.join(PDF_BASE_PATH, book.pdfFrontCover);
      if (fs.existsSync(fullPath)) {
        pdfPath = fullPath;
      }
    }
    if (!pdfPath && pdfType === 'back' && book.pdfBackCover) {
      const fullPath = book.pdfBackCover.startsWith('/') ? book.pdfBackCover : path.join(PDF_BASE_PATH, book.pdfBackCover);
      if (fs.existsSync(fullPath)) {
        pdfPath = fullPath;
      }
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return NextResponse.json({
        error: `PDF file not found for type: ${pdfType}`,
        bookPdfKey: book.pdfKey,
      }, { status: 404 });
    }

    const stat = fs.statSync(pdfPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(pdfPath, { start, end });
      const chunks: Buffer[] = [];

      for await (const chunk of fileStream) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'application/pdf',
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    const fileBuffer = fs.readFileSync(pdfPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileSize.toString(),
        'Content-Disposition': `inline; filename="${book.title || 'book'}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('PDF streaming error:', error);
    return NextResponse.json({ error: 'Failed to stream PDF' }, { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const { searchParams } = new URL(request.url);
    const pdfType = (searchParams.get('type') || 'sample') as PdfType;

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { pdfKey: true, samplePdf: true }
    });

    if (!book) {
      return new NextResponse(null, { status: 404 });
    }

    let pdfPath: string | null = null;

    if (book.pdfKey) {
      const bookFolder = book.pdfKey.includes('/') ? path.dirname(book.pdfKey) : book.pdfKey;
      const fullBookFolder = bookFolder.startsWith('/') ? bookFolder : path.join(PDF_BASE_PATH, bookFolder);

      if (fs.existsSync(fullBookFolder)) {
        const paths = getBookPdfPaths(path.basename(fullBookFolder));
        pdfPath = paths[pdfType];
      }
    }

    if (!pdfPath) {
      return new NextResponse(null, { status: 404 });
    }

    const stat = fs.statSync(pdfPath);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
