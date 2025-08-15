import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const updateMediaSchema = z.object({
  altText: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
});

// GET /api/admin/media/[id] - Get single media file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return NextResponse.json(mediaFile);
  } catch (error) {
    console.error('Error fetching media file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/media/[id] - Update media file metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateMediaSchema.parse(body);

    // Check if media file exists
    const existingFile = await prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Update media file
    const updatedFile = await prisma.mediaFile.update({
      where: { id },
      data: validatedData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error updating media file:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media/[id] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get media file info before deletion
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', mediaFile.url);
      await unlink(filePath);

      // Delete thumbnail if it exists
      if (mediaFile.thumbnailUrl) {
        const thumbnailPath = path.join(process.cwd(), 'public', mediaFile.thumbnailUrl);
        try {
          await unlink(thumbnailPath);
        } catch (error) {
          console.warn('Could not delete thumbnail:', error);
        }
      }
    } catch (error) {
      console.warn('Could not delete file from filesystem:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Error deleting media file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}