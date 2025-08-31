import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import sharp from 'sharp';

// Configure the API for server-side thumbnail generation
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

interface ThumbnailGenerationRequest {
  bookId?: string;
  pdfPath?: string;
  outputPath?: string;
  pageNumber?: number;
  width?: number;
  height?: number;
  quality?: number;
  type?: 'cover_front' | 'cover_back' | 'book_content' | 'page';
  force?: boolean; // Force regeneration even if exists
}

/**
 * Generate PDF thumbnail using pdf-poppler (requires poppler-utils to be installed)
 * This is a server-side solution that converts PDF to images
 */
async function generatePDFThumbnailWithPoppler(
  pdfPath: string,
  outputDir: string,
  options: {
    pageNumber?: number;
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<string> {
  const { spawn } = require('child_process');
  
  const {
    pageNumber = 1,
    width = 400,
    height = 533, // 3:4 aspect ratio
    quality = 90
  } = options;

  // Create output directory
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const outputFile = join(outputDir, `page-${pageNumber}.png`);
  
  // Check if file already exists and return if not forcing regeneration
  if (existsSync(outputFile)) {
    return outputFile;
  }

  return new Promise((resolve, reject) => {
    // Use pdftoppm from poppler-utils to convert PDF to PNG
    const args = [
      '-png',
      '-f', pageNumber.toString(),
      '-l', pageNumber.toString(),
      '-scale-to-x', width.toString(),
      '-scale-to-y', height.toString(),
      '-jpeg',
      pdfPath,
      join(outputDir, 'page')
    ];

    const process = spawn('pdftoppm', args);
    
    let stderr = '';
    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    process.on('close', (code: number) => {
      if (code === 0) {
        // pdftoppm creates files like "page-1.png"
        const expectedFile = join(outputDir, `page-${pageNumber.toString().padStart(6, '0')}.png`);
        
        // Check both possible naming conventions
        if (existsSync(expectedFile)) {
          resolve(expectedFile);
        } else if (existsSync(outputFile)) {
          resolve(outputFile);
        } else {
          reject(new Error(`Generated file not found at ${expectedFile} or ${outputFile}`));
        }
      } else {
        reject(new Error(`pdftoppm failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error: Error) => {
      reject(new Error(`Failed to start pdftoppm: ${error.message}`));
    });
  });
}

/**
 * Fallback: Generate thumbnail using sharp from existing image
 */
async function generateImageThumbnail(
  imagePath: string,
  outputPath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<string> {
  const {
    width = 400,
    height = 533,
    quality = 90
  } = options;

  const imageBuffer = await readFile(imagePath);
  
  const processedBuffer = await sharp(imageBuffer)
    .resize(width, height, { 
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality })
    .toBuffer();

  await writeFile(outputPath, processedBuffer);
  return outputPath;
}

/**
 * Server-side PDF thumbnail generation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both admin and authenticated users (for their own content)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const body: ThumbnailGenerationRequest = await request.json();
    const {
      bookId,
      pdfPath,
      outputPath,
      pageNumber = 1,
      width = 400,
      height = 533,
      quality = 90,
      type = 'book_content',
      force = false
    } = body;

    if (!bookId && !pdfPath) {
      return NextResponse.json(
        { error: 'Either bookId or pdfPath is required' },
        { status: 400 }
      );
    }

    let targetPdfPath: string;
    let targetOutputDir: string;
    let book: any = null;

    if (bookId) {
      // Get book from database
      book = await prisma.book.findUnique({
        where: { id: bookId },
        select: {
          id: true,
          title: true,
          pdfKey: true,
          pdfFrontCover: true,
          pdfBackCover: true,
          coverImage: true
        }
      });

      if (!book) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        );
      }

      // Determine PDF path based on type
      switch (type) {
        case 'cover_front':
          if (!book.pdfFrontCover) {
            return NextResponse.json(
              { error: 'Front cover PDF not available' },
              { status: 404 }
            );
          }
          targetPdfPath = join(process.cwd(), 'public', 'books', bookId, 'front.pdf');
          break;
        case 'cover_back':
          if (!book.pdfBackCover) {
            return NextResponse.json(
              { error: 'Back cover PDF not available' },
              { status: 404 }
            );
          }
          targetPdfPath = join(process.cwd(), 'public', 'books', bookId, 'back.pdf');
          break;
        default:
          if (!book.pdfKey) {
            return NextResponse.json(
              { error: 'Main PDF not available' },
              { status: 404 }
            );
          }
          targetPdfPath = join(process.cwd(), 'public', 'books', bookId, 'main.pdf');
      }

      targetOutputDir = join(process.cwd(), 'public', 'thumbnails', bookId);
    } else {
      targetPdfPath = pdfPath!;
      targetOutputDir = outputPath ? join(process.cwd(), 'public', outputPath) : join(process.cwd(), 'public', 'thumbnails', 'temp');
    }

    // Check if PDF file exists
    if (!existsSync(targetPdfPath)) {
      return NextResponse.json(
        { error: `PDF file not found: ${targetPdfPath}` },
        { status: 404 }
      );
    }

    // Create thumbnails directory
    if (!existsSync(targetOutputDir)) {
      await mkdir(targetOutputDir, { recursive: true });
    }

    const thumbnailFileName = `${type}-page-${pageNumber}.png`;
    const thumbnailPath = join(targetOutputDir, thumbnailFileName);
    
    // Check if thumbnail already exists and not forcing regeneration
    if (!force && existsSync(thumbnailPath)) {
      const stats = await require('fs').promises.stat(thumbnailPath);
      return NextResponse.json({
        success: true,
        message: 'Thumbnail already exists',
        thumbnailPath: `/thumbnails/${bookId || 'temp'}/${thumbnailFileName}`,
        localPath: thumbnailPath,
        fileSize: stats.size,
        generated: false,
        pageNumber
      });
    }

    let generatedPath: string;

    try {
      // Try server-side PDF generation first (requires poppler-utils)
      generatedPath = await generatePDFThumbnailWithPoppler(
        targetPdfPath,
        targetOutputDir,
        { pageNumber, width, height, quality }
      );

      // Move/rename the generated file to our naming convention
      if (generatedPath !== thumbnailPath) {
        const buffer = await readFile(generatedPath);
        await writeFile(thumbnailPath, buffer);
        
        // Clean up temp file if different
        try {
          await require('fs').promises.unlink(generatedPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

    } catch (popplerError) {
      console.warn('Poppler generation failed, falling back to image processing:', popplerError);
      
      // Fallback: if we have a PNG cover, use that
      if (bookId && type === 'cover_front') {
        const pngCoverPath = join(process.cwd(), 'public', 'books', bookId, 'cover.png');
        if (existsSync(pngCoverPath)) {
          await generateImageThumbnail(pngCoverPath, thumbnailPath, { width, height, quality });
        } else {
          throw new Error('No fallback method available for thumbnail generation');
        }
      } else {
        throw popplerError;
      }
    }

    // Update book record with thumbnail path if bookId provided
    if (bookId && book && type === 'cover_front') {
      await prisma.book.update({
        where: { id: bookId },
        data: {
          coverImage: `/thumbnails/${bookId}/${thumbnailFileName}`
        }
      });
    }

    const stats = await require('fs').promises.stat(thumbnailPath);
    const publicUrl = `/thumbnails/${bookId || 'temp'}/${thumbnailFileName}`;

    return NextResponse.json({
      success: true,
      message: 'Thumbnail generated successfully',
      thumbnailPath: publicUrl,
      localPath: thumbnailPath,
      fileSize: stats.size,
      generated: true,
      pageNumber,
      type,
      bookId
    });

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    
    return NextResponse.json({
      error: 'Failed to generate thumbnail',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get thumbnail info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const type = searchParams.get('type') || 'cover_front';
    const pageNumber = parseInt(searchParams.get('pageNumber') || '1');

    if (!bookId) {
      return NextResponse.json(
        { error: 'bookId is required' },
        { status: 400 }
      );
    }

    const thumbnailFileName = `${type}-page-${pageNumber}.png`;
    const thumbnailDir = join(process.cwd(), 'public', 'thumbnails', bookId);
    const thumbnailPath = join(thumbnailDir, thumbnailFileName);

    if (existsSync(thumbnailPath)) {
      const stats = await require('fs').promises.stat(thumbnailPath);
      return NextResponse.json({
        exists: true,
        thumbnailPath: `/thumbnails/${bookId}/${thumbnailFileName}`,
        fileSize: stats.size,
        lastModified: stats.mtime,
        type,
        pageNumber
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: 'Thumbnail not found'
      });
    }

  } catch (error) {
    console.error('Error checking thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Batch generate thumbnails for multiple pages
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId, pages, type = 'book_content', force = false } = body;

    if (!bookId || !pages || !Array.isArray(pages)) {
      return NextResponse.json(
        { error: 'bookId and pages array are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const pageNumber of pages) {
      try {
        // Generate thumbnail for each page
        const thumbnailRequest: ThumbnailGenerationRequest = {
          bookId,
          pageNumber,
          type,
          force
        };

        // Call the POST handler internally
        const thumbnailResult = await POST(request);
        const result = await thumbnailResult.json();
        
        results.push({
          pageNumber,
          success: result.success || false,
          thumbnailPath: result.thumbnailPath,
          error: result.error
        });

      } catch (error) {
        results.push({
          pageNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: successCount > 0,
      message: `Generated ${successCount}/${pages.length} thumbnails`,
      results,
      bookId
    });

  } catch (error) {
    console.error('Error in batch thumbnail generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}