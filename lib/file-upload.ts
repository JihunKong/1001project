import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

export interface FileValidation {
  maxSize: number;
  allowedTypes: string[];
}

const PDF_VALIDATION: FileValidation = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['application/pdf'],
};

const IMAGE_VALIDATION: FileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

const AVATAR_VALIDATION: FileValidation = {
  maxSize: 2 * 1024 * 1024, // 2MB for avatars (smaller for faster loading)
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

function validateFile(file: File, validation: FileValidation): { valid: boolean; error?: string } {
  if (file.size > validation.maxSize) {
    const maxSizeMB = validation.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (!validation.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${validation.allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function uploadPDF(
  file: File,
  bookId: string
): Promise<UploadResult> {
  try {
    const validation = validateFile(file, PDF_VALIDATION);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const sanitizedName = sanitizeFilename(file.name);
    const filename = `${bookId}-${Date.now()}-${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'books');

    await ensureDirectoryExists(uploadDir);

    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    logger.info(`PDF uploaded successfully: ${filename}`);

    return {
      success: true,
      filePath: `/books/${filename}`,
      publicUrl: `/books/${filename}`,
    };
  } catch (error) {
    logger.error('PDF upload error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload PDF',
    };
  }
}

export async function uploadCoverImage(
  file: File,
  bookId: string
): Promise<UploadResult> {
  try {
    const validation = validateFile(file, IMAGE_VALIDATION);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const sanitizedName = sanitizeFilename(file.name);
    const filename = `${bookId}-cover-${Date.now()}-${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'covers');

    await ensureDirectoryExists(uploadDir);

    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    logger.info(`Cover image uploaded successfully: ${filename}`);

    return {
      success: true,
      filePath: `/covers/${filename}`,
      publicUrl: `/covers/${filename}`,
    };
  } catch (error) {
    logger.error('Cover image upload error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload cover image',
    };
  }
}

export async function uploadAvatar(
  file: File,
  userId: string,
  existingAvatarUrl?: string | null
): Promise<UploadResult> {
  try {
    const validation = validateFile(file, AVATAR_VALIDATION);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Delete existing avatar if it's a local file
    if (existingAvatarUrl && existingAvatarUrl.startsWith('/avatars/')) {
      await deleteFile(existingAvatarUrl);
    }

    const sanitizedName = sanitizeFilename(file.name);
    const filename = `${userId}-${Date.now()}-${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'avatars');

    await ensureDirectoryExists(uploadDir);

    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    logger.info(`Avatar uploaded successfully: ${filename}`);

    return {
      success: true,
      filePath: `/avatars/${filename}`,
      publicUrl: `/avatars/${filename}`,
    };
  } catch (error) {
    logger.error('Avatar upload error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload avatar',
    };
  }
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isImageFile(file: File): boolean {
  return IMAGE_VALIDATION.allowedTypes.includes(file.type);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!filePath) {
      return { success: true };
    }

    const fullPath = path.join(process.cwd(), 'public', filePath);

    if (existsSync(fullPath)) {
      await unlink(fullPath);
      logger.info(`File deleted successfully: ${filePath}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('File deletion error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}
