import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const PDF_BASE_PATH = '/Users/jihunkong/1001project/processed-books';
const PUBLIC_BOOKS_PATH = path.join(process.cwd(), 'public', 'books');

type PdfType = 'main' | 'sample' | 'front' | 'back';

interface BookPdfPaths {
  main: string | null;
  sample: string | null;
  front: string | null;
  back: string | null;
}

interface BookWithPdfFields {
  id: string;
  title: string;
  pdfKey: string | null;
  samplePdf: string | null;
  pdfFrontCover: string | null;
  pdfBackCover: string | null;
}

function findPdfInPublicBooks(bookId: string, pdfType: PdfType): string | null {
  const possibleSlugs = [bookId];

  for (const slug of possibleSlugs) {
    const pdfPath = path.join(PUBLIC_BOOKS_PATH, slug, `${pdfType}.pdf`);
    if (fs.existsSync(pdfPath)) {
      return pdfPath;
    }
  }

  return null;
}

function resolvePdfPath(book: BookWithPdfFields, pdfType: PdfType): string | null {
  const pdfFieldMap: Record<PdfType, keyof BookWithPdfFields> = {
    main: 'pdfKey',
    sample: 'samplePdf',
    front: 'pdfFrontCover',
    back: 'pdfBackCover',
  };

  const dbPath = book[pdfFieldMap[pdfType]] as string | null;

  if (dbPath) {
    if (dbPath.startsWith('/books/')) {
      const fullPath = path.join(process.cwd(), 'public', dbPath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    if (dbPath.startsWith('/') && fs.existsSync(dbPath)) {
      return dbPath;
    }

    const processedPath = path.join(PDF_BASE_PATH, dbPath);
    if (fs.existsSync(processedPath)) {
      return processedPath;
    }
  }

  const publicPath = findPdfInPublicBooks(book.id, pdfType);
  if (publicPath) {
    return publicPath;
  }

  return null;
}

function getBookPdfPaths(bookSlug: string): BookPdfPaths {
  const publicDir = path.join(PUBLIC_BOOKS_PATH, bookSlug);
  const legacyDir = path.join(PDF_BASE_PATH, bookSlug);

  const checkPath = (dir: string, filename: string): string | null => {
    const fullPath = path.join(dir, filename);
    return fs.existsSync(fullPath) ? fullPath : null;
  };

  return {
    main: checkPath(publicDir, 'main.pdf') || checkPath(legacyDir, 'main.pdf'),
    sample: checkPath(publicDir, 'sample.pdf') || checkPath(legacyDir, 'sample.pdf'),
    front: checkPath(publicDir, 'front.pdf') || checkPath(legacyDir, 'front.pdf'),
    back: checkPath(publicDir, 'back.pdf') || checkPath(legacyDir, 'back.pdf'),
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
      userRole === UserRole.CONTENT_ADMIN || userRole === UserRole.BOOK_MANAGER ||
      userRole === UserRole.WRITER || userRole === UserRole.STORY_MANAGER ||
      userRole === UserRole.INSTITUTION) {
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

    let pdfPath: string | null = resolvePdfPath(book, pdfType);

    if (!pdfPath && book.pdfKey) {
      const bookFolder = book.pdfKey.includes('/') ? path.dirname(book.pdfKey) : book.pdfKey;
      const folderName = path.basename(bookFolder);

      const paths = getBookPdfPaths(folderName);
      pdfPath = paths[pdfType];
    }

    if (!pdfPath && pdfType === 'sample') {
      pdfPath = resolvePdfPath(book, 'main');
      if (!pdfPath && book.pdfKey) {
        const bookFolder = book.pdfKey.includes('/') ? path.dirname(book.pdfKey) : book.pdfKey;
        const folderName = path.basename(bookFolder);
        const paths = getBookPdfPaths(folderName);
        pdfPath = paths['main'];
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

      const nodeStream = fs.createReadStream(pdfPath, { start, end });
      const readableStream = new ReadableStream({
        start(controller) {
          nodeStream.on('data', (chunk) => controller.enqueue(new Uint8Array(Buffer.from(chunk))));
          nodeStream.on('end', () => controller.close());
          nodeStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new NextResponse(readableStream, {
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

    const nodeStream = fs.createReadStream(pdfPath);
    const readableStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(new Uint8Array(Buffer.from(chunk))));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(readableStream, {
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
      return new NextResponse(null, { status: 404 });
    }

    let pdfPath: string | null = resolvePdfPath(book, pdfType);

    if (!pdfPath && book.pdfKey) {
      const bookFolder = book.pdfKey.includes('/') ? path.dirname(book.pdfKey) : book.pdfKey;
      const folderName = path.basename(bookFolder);
      const paths = getBookPdfPaths(folderName);
      pdfPath = paths[pdfType];
    }

    if (!pdfPath && pdfType === 'sample') {
      pdfPath = resolvePdfPath(book, 'main');
      if (!pdfPath && book.pdfKey) {
        const bookFolder = book.pdfKey.includes('/') ? path.dirname(book.pdfKey) : book.pdfKey;
        const folderName = path.basename(bookFolder);
        const paths = getBookPdfPaths(folderName);
        pdfPath = paths['main'];
      }
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) {
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
