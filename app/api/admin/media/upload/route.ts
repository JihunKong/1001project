import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { z } from 'zod';
import { uploadLimiter } from '@/lib/rate-limiter';

// Configure the API to handle large files (100MB)
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

const uploadSchema = z.object({
  folder: z.string().optional().default('/'),
  altText: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// Helper function to generate unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName}-${timestamp}-${randomString}${extension}`;
}

// Helper function to process image
async function processImage(
  buffer: Buffer,
  filename: string,
  uploadDir: string
): Promise<{ url: string; thumbnailUrl: string; width: number; height: number; format: string }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  const format = metadata.format || 'jpeg';
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  
  // Process main image (max 1920px width, optimize quality)
  const processedImagePath = path.join(uploadDir, filename);
  await image
    .resize(1920, null, { 
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 85 })
    .toFile(processedImagePath);
  
  // Generate thumbnail (300px width)
  const thumbnailFilename = `thumb-${filename}`;
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);
  await image
    .resize(300, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
  
  return {
    url: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/${thumbnailFilename}`,
    width,
    height,
    format,
  };
}

// POST /api/admin/media/upload - Upload media files
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for uploads
    const rateLimitResult = await uploadLimiter.check(request, session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type and extension
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'];
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type or extension. Allowed: JPEG, PNG, GIF, WebP, PDF, TXT' },
        { status: 400 }
      );
    }

    // Additional security: Check file name for malicious patterns
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (sanitizedFileName !== file.name) {
      console.warn(`Potentially malicious filename detected: ${file.name}`);
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 100MB' },
        { status: 400 }
      );
    }

    // Parse additional form data
    const folderParam = formData.get('folder') as string;
    const altTextParam = formData.get('altText') as string;
    const descriptionParam = formData.get('description') as string;
    const tagsParam = formData.get('tags') as string;
    
    const validatedData = uploadSchema.parse({
      folder: folderParam || '/',
      altText: altTextParam || '',
      description: descriptionParam || '',
      tags: tagsParam ? JSON.parse(tagsParam) : [],
    });

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Setup upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await ensureDirectoryExists(uploadDir);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let mediaData: any = {
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/${uniqueFilename}`,
      folder: validatedData.folder,
      altText: validatedData.altText,
      description: validatedData.description,
      tags: validatedData.tags,
      uploadedById: session.user.id,
    };

    // Process images
    if (file.type.startsWith('image/')) {
      try {
        const imageData = await processImage(buffer, uniqueFilename, uploadDir);
        mediaData = {
          ...mediaData,
          ...imageData,
        };
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: save original file
        const filePath = path.join(uploadDir, uniqueFilename);
        await writeFile(filePath, buffer);
      }
    } else {
      // For non-images, save as-is
      const filePath = path.join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);
    }

    // Save to database
    const mediaFile = await prisma.mediaFile.create({
      data: mediaData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(mediaFile, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    
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

// GET /api/admin/media/upload - List media files
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const folder = searchParams.get('folder') || '/';
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { folder };
    
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (type) {
      where.mimeType = { startsWith: type };
    }

    // Fetch media files
    const [mediaFiles, totalCount] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.mediaFile.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      mediaFiles,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}