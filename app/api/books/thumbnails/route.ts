import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('thumbnail') as File;
    const bookId = formData.get('bookId') as string;
    const size = formData.get('size') as string;

    if (!file || !bookId || !size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create thumbnails directory if it doesn't exist
    const thumbnailDir = path.join(process.cwd(), 'public', 'thumbnails');
    if (!existsSync(thumbnailDir)) {
      await mkdir(thumbnailDir, { recursive: true });
    }

    // Generate filename
    const filename = `${bookId}-${size}-${Date.now()}.jpg`;
    const filepath = path.join(thumbnailDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/thumbnails/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Error saving thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to save thumbnail' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');
  const size = searchParams.get('size') || 'large';

  if (!bookId) {
    return NextResponse.json(
      { error: 'Missing bookId parameter' },
      { status: 400 }
    );
  }

  // Check if thumbnail exists
  const thumbnailDir = path.join(process.cwd(), 'public', 'thumbnails');
  const pattern = `${bookId}-${size}-`;
  
  try {
    if (existsSync(thumbnailDir)) {
      const fs = await import('fs');
      const files = fs.readdirSync(thumbnailDir);
      const thumbnailFile = files.find(file => file.startsWith(pattern));
      
      if (thumbnailFile) {
        return NextResponse.json({ 
          url: `/thumbnails/${thumbnailFile}`,
          cached: true 
        });
      }
    }
    
    return NextResponse.json({ 
      url: null,
      cached: false 
    });
  } catch (error) {
    console.error('Error checking thumbnail cache:', error);
    return NextResponse.json(
      { error: 'Failed to check thumbnail cache' },
      { status: 500 }
    );
  }
}