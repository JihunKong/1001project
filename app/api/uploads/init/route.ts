import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { uploadManager } from '@/lib/upload/upload-manager';
import { validateFileSignature } from '@/lib/file-validation';

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

interface InitUploadRequest {
  fileName: string;
  fileSize: number;
  expectedSHA256?: string;
  idempotencyKey?: string;
  metadata?: {
    title?: string;
    authorName?: string;
    category?: string;
    language?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InitUploadRequest = await request.json();
    const { fileName, fileSize, expectedSHA256, idempotencyKey, metadata } = body;

    // Validate request
    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: 'fileName and fileSize are required' },
        { status: 400 }
      );
    }

    if (fileSize <= 0 || fileSize > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json(
        { error: 'File size must be between 1 byte and 100MB' },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Optional: Validate expected SHA256 format
    if (expectedSHA256 && !/^[a-f0-9]{64}$/i.test(expectedSHA256)) {
      return NextResponse.json(
        { error: 'Invalid SHA256 format' },
        { status: 400 }
      );
    }

    // Check rate limiting (simple implementation)
    const userUploads = await getRateLimitInfo(session.user.id);
    if (userUploads.count >= 10) { // Max 10 concurrent uploads
      return NextResponse.json(
        { error: 'Too many concurrent uploads. Please wait for existing uploads to complete.' },
        { status: 429 }
      );
    }

    // Initialize upload session
    const uploadResponse = await uploadManager.initializeUpload(
      fileName,
      fileSize,
      session.user.id,
      idempotencyKey,
      expectedSHA256,
      {
        ...metadata,
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    );

    return NextResponse.json({
      success: true,
      upload: uploadResponse,
      message: 'Upload session initialized successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Upload initialization error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Content already exists')) {
        return NextResponse.json(
          { error: 'File with this content already exists', duplicate: true },
          { status: 409 }
        );
      }
      
      if (error.message.includes('idempotency')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    
    if (!uploadId) {
      return NextResponse.json(
        { error: 'uploadId parameter is required' },
        { status: 400 }
      );
    }

    const status = await uploadManager.getUploadStatus(uploadId);
    
    if (!status.exists) {
      return NextResponse.json(
        { error: 'Upload session not found or expired' },
        { status: 404 }
      );
    }

    // Only allow users to see their own uploads (except admins)
    if (session.user.role !== UserRole.ADMIN && status.session?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      uploadId: status.session?.uploadId,
      progress: status.progress,
      totalChunks: status.session?.totalChunks,
      uploadedChunks: status.session?.uploadedChunks.length,
      missingChunks: status.missingChunks,
      expiresAt: status.session?.expiresAt,
      createdAt: status.session?.createdAt
    });

  } catch (error) {
    console.error('Upload status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simple rate limiting - in production, use Redis or similar
const userUploadCache = new Map<string, { count: number; lastReset: number }>();

async function getRateLimitInfo(userId: string): Promise<{ count: number; resetTime: number }> {
  const now = Date.now();
  const resetInterval = 60 * 60 * 1000; // 1 hour
  
  let userInfo = userUploadCache.get(userId);
  
  if (!userInfo || now - userInfo.lastReset > resetInterval) {
    userInfo = { count: 0, lastReset: now };
    userUploadCache.set(userId, userInfo);
  }
  
  return {
    count: userInfo.count,
    resetTime: userInfo.lastReset + resetInterval
  };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const resetInterval = 60 * 60 * 1000;
  
  for (const [userId, info] of userUploadCache.entries()) {
    if (now - info.lastReset > resetInterval) {
      userUploadCache.delete(userId);
    }
  }
}, 10 * 60 * 1000); // Clean every 10 minutes