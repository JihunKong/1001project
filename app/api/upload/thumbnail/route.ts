import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookId = formData.get('bookId') as string;
    const type = formData.get('type') as string;

    if (!file || !bookId) {
      return NextResponse.json(
        { error: 'Missing file or bookId' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'thumbnails');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${bookId}_${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update book record with thumbnail URL
    const thumbnailUrl = `/thumbnails/${filename}`;
    
    try {
      await prisma.book.update({
        where: { id: bookId },
        data: {
          coverImage: thumbnailUrl,
          updatedAt: new Date()
        }
      });
    } catch (dbError) {
      console.error('Failed to update book thumbnail in database:', dbError);
      // Don't fail the upload if DB update fails - just log it
    }

    return NextResponse.json({
      url: thumbnailUrl,
      filename: filename,
      message: 'Thumbnail uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to upload thumbnail' },
      { status: 500 }
    );
  }
}