import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { uploadManager } from '@/lib/upload/upload-manager';

export const maxDuration = 300; // 5 minutes for chunk upload
export const runtime = 'nodejs';

interface RouteParams {
  uploadId: string;
  partNo: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ![UserRole.ADMIN, UserRole.CONTENT_ADMIN, UserRole.BOOK_MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId, partNo } = params;
    const partNumber = parseInt(partNo, 10);

    // Validate parameters
    if (!uploadId || isNaN(partNumber) || partNumber < 0) {
      return NextResponse.json(
        { error: 'Invalid uploadId or partNumber' },
        { status: 400 }
      );
    }

    // Verify upload session exists and user has access
    const uploadStatus = await uploadManager.getUploadStatus(uploadId);
    if (!uploadStatus.exists || !uploadStatus.session) {
      return NextResponse.json(
        { error: 'Upload session not found or expired' },
        { status: 404 }
      );
    }

    // Check ownership (only admin can access others' uploads)
    if (session.user.role !== UserRole.ADMIN && uploadStatus.session.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get expected hash from headers (optional for integrity check)
    const expectedHash = request.headers.get('x-chunk-hash');
    const contentLength = request.headers.get('content-length');

    if (!contentLength || parseInt(contentLength) === 0) {
      return NextResponse.json(
        { error: 'Chunk data is required' },
        { status: 400 }
      );
    }

    // Read chunk data from request body
    const chunkBuffer = Buffer.from(await request.arrayBuffer());

    if (chunkBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty chunk data' },
        { status: 400 }
      );
    }

    // Upload the chunk
    const result = await uploadManager.uploadChunk(
      uploadId,
      partNumber,
      chunkBuffer,
      expectedHash || undefined
    );

    // Return success response
    return NextResponse.json({
      success: true,
      uploadId,
      partNumber,
      hash: result.hash,
      size: chunkBuffer.length,
      message: result.message || 'Chunk uploaded successfully'
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Upload session not found')) {
        return NextResponse.json(
          { error: 'Upload session not found or expired' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Upload session expired')) {
        return NextResponse.json(
          { error: 'Upload session has expired' },
          { status: 410 } // Gone
        );
      }
      
      if (error.message.includes('Invalid part number')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('integrity check failed')) {
        return NextResponse.json(
          { error: 'Chunk integrity verification failed' },
          { status: 422 } // Unprocessable Entity
        );
      }
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

    const { uploadId, partNo } = params;
    const partNumber = parseInt(partNo, 10);

    if (!uploadId || isNaN(partNumber) || partNumber < 0) {
      return NextResponse.json(
        { error: 'Invalid uploadId or partNumber' },
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

    // Find the specific chunk
    const chunk = uploadStatus.session.uploadedChunks.find(c => c.partNumber === partNumber);
    
    if (!chunk) {
      return NextResponse.json(
        { 
          uploaded: false,
          partNumber,
          uploadId,
          message: 'Chunk not yet uploaded'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      uploaded: true,
      partNumber: chunk.partNumber,
      size: chunk.size,
      hash: chunk.hash,
      uploadedAt: chunk.uploadedAt,
      uploadId
    });

  } catch (error) {
    console.error('Chunk status error:', error);
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

    const { uploadId, partNo } = params;
    const partNumber = parseInt(partNo, 10);

    if (!uploadId || isNaN(partNumber) || partNumber < 0) {
      return NextResponse.json(
        { error: 'Invalid uploadId or partNumber' },
        { status: 400 }
      );
    }

    // Note: Individual chunk deletion is not implemented in the upload manager
    // This would require extending the upload manager to support chunk removal
    // For now, return method not allowed
    
    return NextResponse.json(
      { error: 'Individual chunk deletion not supported. Cancel entire upload instead.' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Chunk deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}