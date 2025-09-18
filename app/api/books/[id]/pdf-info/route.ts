import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { stat } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins and content managers can access PDF info
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        authorName: true,
        pdfStorageKey: true,
        pdfChecksum: true,
        pdfSize: true,
        pdfPageCount: true,
        pdfUploadedAt: true,
        pdfUploadedBy: true,
        fullPdf: true, // Legacy support
        status: true
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get file system info
    const fileInfo = await getFileSystemInfo(book);
    
    // Return comprehensive PDF information
    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        authorName: book.authorName,
        status: book.status
      },
      pdf: {
        // Database stored info
        storageKey: book.pdfStorageKey,
        checksum: book.pdfChecksum,
        size: book.pdfSize,
        pageCount: book.pdfPageCount,
        uploadedAt: book.pdfUploadedAt,
        uploadedBy: book.pdfUploadedBy,
        
        // File system info
        ...fileInfo,
        
        // Legacy info
        legacyPath: book.fullPdf
      }
    });

  } catch (error) {
    console.error('Error getting PDF info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update PDF info in database (for admin reconciliation)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        pdfStorageKey: true,
        fullPdf: true
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get current file info and update database
    const fileInfo = await getFileSystemInfo(book);
    
    if (!fileInfo.exists) {
      return NextResponse.json({ error: 'PDF file not found' }, { status: 404 });
    }

    // Calculate checksum if file exists
    const filePath = await resolvePdfPath(book);
    let checksum = null;
    if (filePath) {
      const fileBuffer = await fs.readFile(filePath);
      checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // Update book record
    const updatedBook = await prisma.book.update({
      where: { id: params.id },
      data: {
        pdfSize: fileInfo.size || undefined,
        pdfChecksum: checksum || undefined,
        // Note: Page count would need PDF parsing library to extract
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'PDF info updated successfully',
      updated: {
        size: fileInfo.size,
        checksum: checksum,
        lastModified: fileInfo.lastModified
      }
    });

  } catch (error) {
    console.error('Error updating PDF info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getFileSystemInfo(book: any) {
  try {
    const filePath = await resolvePdfPath(book);
    
    if (!filePath) {
      return {
        exists: false,
        path: null,
        size: null,
        lastModified: null
      };
    }

    const stats = await stat(filePath);
    
    return {
      exists: true,
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
      accessible: true
    };

  } catch (error) {
    return {
      exists: false,
      path: null,
      size: null,
      lastModified: null,
      error: error.message
    };
  }
}

async function resolvePdfPath(book: any): Promise<string | null> {
  // Enhanced storage key approach
  if (book.pdfStorageKey) {
    if (book.pdfStorageKey.startsWith('s3://')) {
      // S3 storage - would need different handling
      return null;
    } else if (book.pdfStorageKey.startsWith('/storage/')) {
      return path.join(process.cwd(), 'public', book.pdfStorageKey);
    }
  }

  // Legacy support
  if (book.fullPdf) {
    return path.join(process.cwd(), 'public', book.fullPdf);
  }

  return null;
}