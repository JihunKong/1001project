import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { uploadManager } from '@/lib/upload/upload-manager';
import { logAuditEvent, auditLogger } from '@/lib/security/audit-logger';
import { queueVirusScan } from '@/lib/security/antivirus';

export const maxDuration = 300; // 5 minutes for commit
export const runtime = 'nodejs';

interface RouteParams {
  uploadId: string;
}

interface CommitRequest {
  metadata?: {
    title?: string;
    authorName?: string;
    category?: string;
    language?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId } = params;

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    // Get upload status first
    const uploadStatus = await uploadManager.getUploadStatus(uploadId);
    if (!uploadStatus.exists || !uploadStatus.session) {
      return NextResponse.json(
        { error: 'Upload session not found or expired' },
        { status: 404 }
      );
    }

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && uploadStatus.session.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if all chunks are uploaded
    if (uploadStatus.missingChunks && uploadStatus.missingChunks.length > 0) {
      return NextResponse.json(
        { 
          error: 'Upload incomplete',
          missingChunks: uploadStatus.missingChunks,
          progress: uploadStatus.progress
        },
        { status: 400 }
      );
    }

    // Parse optional metadata from request body
    let metadata: CommitRequest['metadata'] = {};
    try {
      const body = await request.json();
      metadata = body.metadata || {};
    } catch {
      // Body is optional, continue with empty metadata
    }

    // Commit the upload
    const commitResult = await uploadManager.commitUpload(uploadId);

    if (!commitResult.success) {
      // Log audit event for failure
      await auditLogger.uploadCommitFailure(
        session.user.id,
        uploadId,
        commitResult.error || 'Commit failed',
        {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || '',
          duration: Date.now() - startTime
        }
      );

      return NextResponse.json(
        { 
          error: commitResult.error || 'Commit failed',
          uploadId
        },
        { status: 422 }
      );
    }

    // Log successful commit
    await auditLogger.uploadCommitSuccess(
      session.user.id,
      uploadId,
      commitResult,
      {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        duration: Date.now() - startTime,
        fileName: uploadStatus.session.fileName
      }
    );

    // If virus scanning is enabled, queue the file for scanning
    if (process.env.ENABLE_VIRUS_SCAN === 'true') {
      await queueVirusScan(commitResult.finalSHA256!, commitResult.storagePath!);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      uploadId,
      file: {
        sha256: commitResult.finalSHA256,
        size: commitResult.size,
        storagePath: commitResult.storagePath,
        publicPath: commitResult.publicPath,
        isDuplicate: commitResult.isDuplicate,
        fileName: uploadStatus.session.fileName
      },
      metadata: {
        ...uploadStatus.session.metadata,
        ...metadata
      },
      message: commitResult.isDuplicate 
        ? 'File already exists (duplicate detected)'
        : 'File uploaded and committed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Upload commit error:', error);
    
    // Log audit event for system error
    try {
      const session = await getServerSession(authOptions);
      if (session) {
        await auditLogger.uploadCommitFailure(
          session.user.id,
          params.uploadId,
          error instanceof Error ? error.message : 'Unknown error',
          {
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || '',
            duration: Date.now() - startTime,
            systemError: true
          }
        );
      }
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId } = params;

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    // Get upload status
    const uploadStatus = await uploadManager.getUploadStatus(uploadId);
    if (!uploadStatus.exists || !uploadStatus.session) {
      return NextResponse.json(
        { error: 'Upload session not found or expired' },
        { status: 404 }
      );
    }

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && uploadStatus.session.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return commit status
    const isComplete = !uploadStatus.missingChunks || uploadStatus.missingChunks.length === 0;
    
    return NextResponse.json({
      uploadId,
      canCommit: isComplete,
      progress: uploadStatus.progress,
      totalChunks: uploadStatus.session.totalChunks,
      uploadedChunks: uploadStatus.session.uploadedChunks.length,
      missingChunks: uploadStatus.missingChunks,
      fileName: uploadStatus.session.fileName,
      totalSize: uploadStatus.session.totalSize,
      expiresAt: uploadStatus.session.expiresAt,
      createdAt: uploadStatus.session.createdAt
    });

  } catch (error) {
    console.error('Upload commit status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId } = params;

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    // Get upload status first to check ownership
    const uploadStatus = await uploadManager.getUploadStatus(uploadId);
    if (!uploadStatus.exists || !uploadStatus.session) {
      return NextResponse.json(
        { error: 'Upload session not found or expired' },
        { status: 404 }
      );
    }

    // Check ownership
    if (session.user.role !== UserRole.ADMIN && uploadStatus.session.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Note: Upload manager doesn't have a cancel method yet
    // This would require extending the upload manager
    // For now, return method not implemented
    
    return NextResponse.json(
      { error: 'Upload cancellation not implemented. Sessions expire automatically.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Upload cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}