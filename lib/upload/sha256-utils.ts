import { createHash } from 'crypto';
import { mkdir, stat, access, readFile } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

export interface SHA256Result {
  hash: string;
  size: number;
}

export interface ContentPath {
  storagePath: string;
  publicPath: string;
  exists: boolean;
}

export async function calculateSHA256(buffer: Buffer): Promise<SHA256Result> {
  const hash = createHash('sha256');
  hash.update(buffer);
  
  return {
    hash: hash.digest('hex'),
    size: buffer.length
  };
}

export async function calculateFileSHA256(filePath: string): Promise<SHA256Result> {
  try {
    const buffer = await readFile(filePath);
    return calculateSHA256(buffer);
  } catch (error) {
    throw new Error(`Failed to calculate SHA256 for file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function generateContentPath(sha256: string): ContentPath {
  const prefix = sha256.substring(0, 2);
  const subfolder = sha256.substring(2, 4);
  const filename = `${sha256}.pdf`;
  
  const storagePath = join(process.cwd(), 'storage', 'sha256', prefix, subfolder, filename);
  const publicPath = `/storage/sha256/${prefix}/${subfolder}/${filename}`;
  
  return {
    storagePath,
    publicPath,
    exists: false // Will be checked by caller
  };
}

export async function checkContentExists(sha256: string): Promise<ContentPath> {
  const paths = generateContentPath(sha256);
  
  try {
    await access(paths.storagePath, constants.F_OK);
    return { ...paths, exists: true };
  } catch {
    return { ...paths, exists: false };
  }
}

export async function ensureStorageDirectory(sha256: string): Promise<string> {
  const paths = generateContentPath(sha256);
  const dir = join(paths.storagePath, '..');
  
  try {
    await mkdir(dir, { recursive: true });
    return paths.storagePath;
  } catch (error) {
    throw new Error(`Failed to create storage directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function verifyChunkIntegrity(chunk: Buffer, expectedHash: string): boolean {
  const actualHash = createHash('sha256').update(chunk).digest('hex');
  return actualHash === expectedHash;
}

export async function verifyFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
  try {
    const result = await calculateFileSHA256(filePath);
    return result.hash === expectedHash;
  } catch {
    return false;
  }
}

export interface ChunkInfo {
  partNumber: number;
  size: number;
  hash: string;
  uploadedAt: Date;
}

export function generateUploadId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `upload_${timestamp}_${random}`;
}

export function calculateChunkSize(fileSize: number, maxChunkSize: number = 5 * 1024 * 1024): { chunkSize: number; totalChunks: number } {
  if (fileSize <= maxChunkSize) {
    return { chunkSize: fileSize, totalChunks: 1 };
  }
  
  const totalChunks = Math.ceil(fileSize / maxChunkSize);
  return { chunkSize: maxChunkSize, totalChunks };
}

export function getChunkRange(partNumber: number, chunkSize: number, totalSize: number): { start: number; end: number; size: number } {
  const start = partNumber * chunkSize;
  const end = Math.min(start + chunkSize - 1, totalSize - 1);
  const size = end - start + 1;
  
  return { start, end, size };
}