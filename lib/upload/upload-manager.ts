import { writeFile, readFile, mkdir, access, unlink, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { constants } from 'fs';
import { 
  generateUploadId, 
  calculateChunkSize, 
  verifyChunkIntegrity, 
  ChunkInfo,
  calculateSHA256,
  ensureStorageDirectory,
  checkContentExists
} from './sha256-utils';

export interface UploadSession {
  uploadId: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: ChunkInfo[];
  expectedSHA256?: string;
  fileName: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface UploadInitResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
  expiresAt: Date;
}

export interface ChunkUploadResult {
  success: boolean;
  partNumber: number;
  hash: string;
  message?: string;
}

export interface UploadCommitResult {
  success: boolean;
  finalSHA256?: string;
  storagePath?: string;
  publicPath?: string;
  size?: number;
  error?: string;
  isDuplicate?: boolean;
}

const UPLOAD_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const TEMP_UPLOAD_DIR = join(process.cwd(), '.temp', 'uploads');

export class ChunkedUploadManager {
  private sessionCache = new Map<string, UploadSession>();
  
  constructor() {
    this.cleanupExpiredSessions();
    // Set up periodic cleanup every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async initializeUpload(
    fileName: string,
    totalSize: number,
    userId: string,
    idempotencyKey?: string,
    expectedSHA256?: string,
    metadata?: Record<string, any>
  ): Promise<UploadInitResponse> {
    // Check for existing session with idempotency key
    if (idempotencyKey) {
      const existingSession = this.findSessionByIdempotencyKey(idempotencyKey);
      if (existingSession) {
        return {
          uploadId: existingSession.uploadId,
          chunkSize: existingSession.chunkSize,
          totalChunks: existingSession.totalChunks,
          expiresAt: existingSession.expiresAt
        };
      }
    }

    // Check if content already exists by SHA256
    if (expectedSHA256) {
      const existing = await checkContentExists(expectedSHA256);
      if (existing.exists) {
        // Return special response indicating duplicate
        throw new Error(`Content already exists with SHA256: ${expectedSHA256}`);
      }
    }

    const uploadId = generateUploadId();
    const { chunkSize, totalChunks } = calculateChunkSize(totalSize, MAX_CHUNK_SIZE);
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TIMEOUT);

    const session: UploadSession = {
      uploadId,
      totalSize,
      chunkSize,
      totalChunks,
      uploadedChunks: [],
      expectedSHA256,
      fileName,
      userId,
      createdAt: new Date(),
      expiresAt,
      idempotencyKey,
      metadata
    };

    this.sessionCache.set(uploadId, session);
    await this.saveSessionToDisk(session);
    await this.ensureUploadDirectory(uploadId);

    return {
      uploadId,
      chunkSize,
      totalChunks,
      expiresAt
    };
  }

  async uploadChunk(
    uploadId: string,
    partNumber: number,
    chunkBuffer: Buffer,
    expectedHash?: string
  ): Promise<ChunkUploadResult> {
    const session = await this.getSession(uploadId);
    if (!session) {
      throw new Error(`Upload session not found: ${uploadId}`);
    }

    if (Date.now() > session.expiresAt.getTime()) {
      throw new Error(`Upload session expired: ${uploadId}`);
    }

    if (partNumber < 0 || partNumber >= session.totalChunks) {
      throw new Error(`Invalid part number: ${partNumber}. Expected 0-${session.totalChunks - 1}`);
    }

    // Check if chunk already uploaded (idempotency)
    const existingChunk = session.uploadedChunks.find(c => c.partNumber === partNumber);
    if (existingChunk) {
      return {
        success: true,
        partNumber,
        hash: existingChunk.hash,
        message: 'Chunk already uploaded'
      };
    }

    // Calculate and verify chunk hash
    const chunkResult = await calculateSHA256(chunkBuffer);
    const chunkHash = chunkResult.hash;

    if (expectedHash && chunkHash !== expectedHash) {
      throw new Error(`Chunk integrity check failed for part ${partNumber}`);
    }

    // Save chunk to disk
    const chunkPath = await this.getChunkPath(uploadId, partNumber);
    await writeFile(chunkPath, chunkBuffer);

    // Update session
    const chunkInfo: ChunkInfo = {
      partNumber,
      size: chunkBuffer.length,
      hash: chunkHash,
      uploadedAt: new Date()
    };

    session.uploadedChunks.push(chunkInfo);
    session.uploadedChunks.sort((a, b) => a.partNumber - b.partNumber);

    await this.saveSessionToDisk(session);

    return {
      success: true,
      partNumber,
      hash: chunkHash
    };
  }

  async commitUpload(uploadId: string): Promise<UploadCommitResult> {
    const session = await this.getSession(uploadId);
    if (!session) {
      throw new Error(`Upload session not found: ${uploadId}`);
    }

    if (session.uploadedChunks.length !== session.totalChunks) {
      return {
        success: false,
        error: `Missing chunks. Expected ${session.totalChunks}, got ${session.uploadedChunks.length}`
      };
    }

    try {
      // Merge chunks into final file
      const finalBuffer = await this.mergeChunks(session);
      const finalResult = await calculateSHA256(finalBuffer);

      // Verify expected SHA256 if provided
      if (session.expectedSHA256 && finalResult.hash !== session.expectedSHA256) {
        await this.cleanup(uploadId);
        return {
          success: false,
          error: `Final hash mismatch. Expected: ${session.expectedSHA256}, Got: ${finalResult.hash}`
        };
      }

      // Check for duplicates
      const existing = await checkContentExists(finalResult.hash);
      if (existing.exists) {
        await this.cleanup(uploadId);
        return {
          success: true,
          finalSHA256: finalResult.hash,
          storagePath: existing.storagePath,
          publicPath: existing.publicPath,
          size: finalResult.size,
          isDuplicate: true
        };
      }

      // Save to content-addressed storage
      const finalPath = await ensureStorageDirectory(finalResult.hash);
      await writeFile(finalPath, finalBuffer);

      // Cleanup temp files
      await this.cleanup(uploadId);

      const paths = await checkContentExists(finalResult.hash);
      return {
        success: true,
        finalSHA256: finalResult.hash,
        storagePath: paths.storagePath,
        publicPath: paths.publicPath,
        size: finalResult.size,
        isDuplicate: false
      };

    } catch (error) {
      await this.cleanup(uploadId);
      return {
        success: false,
        error: `Commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getUploadStatus(uploadId: string): Promise<{
    exists: boolean;
    session?: UploadSession;
    progress?: number;
    missingChunks?: number[];
  }> {
    const session = await this.getSession(uploadId);
    if (!session) {
      return { exists: false };
    }

    const uploadedParts = session.uploadedChunks.map(c => c.partNumber);
    const missingChunks = Array.from({ length: session.totalChunks }, (_, i) => i)
      .filter(partNo => !uploadedParts.includes(partNo));

    const progress = (session.uploadedChunks.length / session.totalChunks) * 100;

    return {
      exists: true,
      session,
      progress,
      missingChunks
    };
  }

  private async getSession(uploadId: string): Promise<UploadSession | null> {
    let session = this.sessionCache.get(uploadId);
    if (!session) {
      session = await this.loadSessionFromDisk(uploadId);
      if (session) {
        this.sessionCache.set(uploadId, session);
      }
    }
    return session || null;
  }

  private findSessionByIdempotencyKey(idempotencyKey: string): UploadSession | null {
    for (const session of this.sessionCache.values()) {
      if (session.idempotencyKey === idempotencyKey) {
        return session;
      }
    }
    return null;
  }

  private async ensureUploadDirectory(uploadId: string): Promise<void> {
    const uploadDir = join(TEMP_UPLOAD_DIR, uploadId);
    await mkdir(uploadDir, { recursive: true });
  }

  private async getChunkPath(uploadId: string, partNumber: number): Promise<string> {
    return join(TEMP_UPLOAD_DIR, uploadId, `chunk_${partNumber.toString().padStart(6, '0')}`);
  }

  private async saveSessionToDisk(session: UploadSession): Promise<void> {
    const sessionPath = join(TEMP_UPLOAD_DIR, session.uploadId, 'session.json');
    await mkdir(dirname(sessionPath), { recursive: true });
    await writeFile(sessionPath, JSON.stringify(session, null, 2));
  }

  private async loadSessionFromDisk(uploadId: string): Promise<UploadSession | null> {
    try {
      const sessionPath = join(TEMP_UPLOAD_DIR, uploadId, 'session.json');
      const sessionData = await readFile(sessionPath, 'utf-8');
      const session = JSON.parse(sessionData);
      
      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.expiresAt = new Date(session.expiresAt);
      session.uploadedChunks = session.uploadedChunks.map((chunk: any) => ({
        ...chunk,
        uploadedAt: new Date(chunk.uploadedAt)
      }));

      return session;
    } catch {
      return null;
    }
  }

  private async mergeChunks(session: UploadSession): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = await this.getChunkPath(session.uploadId, i);
      const chunkBuffer = await readFile(chunkPath);
      chunks.push(chunkBuffer);
    }

    return Buffer.concat(chunks);
  }

  private async cleanup(uploadId: string): Promise<void> {
    try {
      const uploadDir = join(TEMP_UPLOAD_DIR, uploadId);
      
      // Remove all files in upload directory
      const files = await readdir(uploadDir);
      for (const file of files) {
        await unlink(join(uploadDir, file));
      }
      
      // Remove the directory
      await unlink(uploadDir);
      
      // Remove from cache
      this.sessionCache.delete(uploadId);
    } catch (error) {
      console.error(`Failed to cleanup upload ${uploadId}:`, error);
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    
    for (const [uploadId, session] of this.sessionCache.entries()) {
      if (now > session.expiresAt.getTime()) {
        await this.cleanup(uploadId);
      }
    }
  }
}

export const uploadManager = new ChunkedUploadManager();