import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';
import { UserRole } from '@prisma/client';

const ALLOWED_DOWNLOAD_ROLES: UserRole[] = [
  'TEACHER',
  'INSTITUTION',
  'STORY_MANAGER',
  'BOOK_MANAGER',
  'CONTENT_ADMIN',
  'ADMIN',
];

async function canDownloadPDF(
  userId: string,
  userRole: UserRole,
  bookId: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (ALLOWED_DOWNLOAD_ROLES.includes(userRole)) {
    return { allowed: true };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { canDownloadPDF: true, status: true },
  });

  if (subscription?.status === 'ACTIVE' && subscription.canDownloadPDF) {
    return { allowed: true };
  }

  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      bookId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (entitlement) {
    const hasDownloadsLeft =
      entitlement.maxDownloads === null ||
      entitlement.downloadCount < entitlement.maxDownloads;

    if (hasDownloadsLeft) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Download limit reached for this book' };
  }

  return {
    allowed: false,
    reason: 'You do not have permission to download this PDF',
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: bookId } = await params;
    const userId = session.user.id;
    const userRole = session.user.role as UserRole;

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        pdfKey: true,
        pdfStorageKey: true,
        isPublished: true,
        downloadAllowed: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.isPublished && !ALLOWED_DOWNLOAD_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: 'Book is not published' },
        { status: 403 }
      );
    }

    const pdfPath = book.pdfKey || book.pdfStorageKey;
    if (!pdfPath) {
      return NextResponse.json(
        { error: 'PDF not available for this book' },
        { status: 404 }
      );
    }

    const { allowed, reason } = await canDownloadPDF(userId, userRole, bookId);
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    let fullPath = pdfPath;
    if (!path.isAbsolute(pdfPath)) {
      if (pdfPath.startsWith('/')) {
        fullPath = path.join(process.cwd(), 'public', pdfPath);
      } else {
        fullPath = path.join(process.cwd(), 'public', 'books', pdfPath);
      }
    }

    try {
      const fileBuffer = await readFile(fullPath);

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'BOOK_PDF_DOWNLOAD',
          entity: 'BOOK',
          entityId: bookId,
          metadata: {
            bookTitle: book.title,
            timestamp: new Date().toISOString(),
          },
        },
      });

      await prisma.entitlement.updateMany({
        where: {
          userId,
          bookId,
          isActive: true,
        },
        data: {
          downloadCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });

      await prisma.book.update({
        where: { id: bookId },
        data: { downloadCount: { increment: 1 } },
      });

      const sanitizedTitle = book.title
        .replace(/[^a-zA-Z0-9가-힣\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const filename = `${sanitizedTitle}.pdf`;

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    } catch {
      console.error(`PDF file not found at path: ${fullPath}`);
      return NextResponse.json(
        { error: 'PDF file not found on server' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF' },
      { status: 500 }
    );
  }
}
