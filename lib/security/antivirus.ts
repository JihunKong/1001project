import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access, unlink } from 'fs/promises';
import { constants } from 'fs';
import { auditLogger } from './audit-logger';

const execAsync = promisify(exec);

export interface ScanResult {
  isClean: boolean;
  threatName?: string;
  scanEngine: string;
  scanTime: number;
  error?: string;
}

export interface ScanOptions {
  quarantineOnDetection?: boolean;
  deleteOnDetection?: boolean;
  timeoutMs?: number;
}

export class AntivirusScanner {
  private scanQueue = new Map<string, Promise<ScanResult>>();
  private readonly defaultTimeout = 60 * 1000; // 60 seconds

  async scanFile(filePath: string, sha256: string, options: ScanOptions = {}): Promise<ScanResult> {
    const startTime = Date.now();
    
    // Check if already scanning this file
    if (this.scanQueue.has(sha256)) {
      return await this.scanQueue.get(sha256)!;
    }

    // Create scan promise
    const scanPromise = this._performScan(filePath, sha256, options);
    this.scanQueue.set(sha256, scanPromise);

    try {
      const result = await scanPromise;
      
      // Log scan result
      await auditLogger.virusScanResult(sha256, result.isClean ? 'CLEAN' : 'INFECTED', {
        scanEngine: result.scanEngine,
        threatName: result.threatName,
        duration: Date.now() - startTime,
        filePath: filePath
      });

      return result;
    } finally {
      // Remove from queue
      this.scanQueue.delete(sha256);
    }
  }

  private async _performScan(filePath: string, sha256: string, options: ScanOptions): Promise<ScanResult> {
    const timeoutMs = options.timeoutMs || this.defaultTimeout;
    
    try {
      // Check if file exists
      await access(filePath, constants.F_OK);
      
      // Try ClamAV first
      const clamavResult = await this._scanWithClamAV(filePath, timeoutMs);
      if (clamavResult) {
        if (!clamavResult.isClean && options.quarantineOnDetection) {
          await this._quarantineFile(filePath, sha256);
        }
        return clamavResult;
      }

      // Fallback to basic checks if ClamAV unavailable
      console.warn('ClamAV not available, performing basic checks');
      const basicResult = await this._basicScan(filePath);
      
      return basicResult;
      
    } catch (error) {
      console.error(`Virus scan error for ${sha256}:`, error);
      
      return {
        isClean: false, // Err on side of caution
        scanEngine: 'error',
        scanTime: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown scan error'
      };
    }
  }

  private async _scanWithClamAV(filePath: string, timeoutMs: number): Promise<ScanResult | null> {
    try {
      const startTime = Date.now();
      
      // Check if clamdscan is available (faster daemon-based scanning)
      try {
        const { stdout, stderr } = await execAsync(`clamdscan --no-summary "${filePath}"`, {
          timeout: timeoutMs
        });
        
        const scanTime = Date.now() - startTime;
        
        if (stdout.includes('OK') && !stdout.includes('FOUND')) {
          return {
            isClean: true,
            scanEngine: 'clamdscan',
            scanTime
          };
        } else if (stdout.includes('FOUND')) {
          const threatMatch = stdout.match(/(.+): (.+) FOUND/);
          const threatName = threatMatch ? threatMatch[2] : 'Unknown threat';
          
          return {
            isClean: false,
            threatName,
            scanEngine: 'clamdscan',
            scanTime
          };
        }
      } catch (clamdscanError) {
        // Fall back to clamscan if daemon not available
        console.warn('clamdscan not available, trying clamscan');
      }

      // Try clamscan (direct scanning)
      const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`, {
        timeout: timeoutMs
      });
      
      const scanTime = Date.now() - startTime;
      
      if (stdout.includes('OK')) {
        return {
          isClean: true,
          scanEngine: 'clamscan',
          scanTime
        };
      } else if (stdout.includes('FOUND')) {
        const threatMatch = stdout.match(/(.+): (.+) FOUND/);
        const threatName = threatMatch ? threatMatch[2] : 'Unknown threat';
        
        return {
          isClean: false,
          threatName,
          scanEngine: 'clamscan',
          scanTime
        };
      } else {
        throw new Error(`Unexpected ClamAV output: ${stdout}`);
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('ClamAV not installed or not in PATH');
        return null;
      }
      throw error;
    }
  }

  private async _basicScan(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      // Read first 1KB of file for basic checks
      const buffer = await readFile(filePath, { encoding: null });
      const firstKB = buffer.slice(0, 1024);
      
      // Basic heuristics (very limited)
      const suspiciousPatterns = [
        // Script patterns that shouldn't be in PDFs
        Buffer.from('eval('),
        Buffer.from('document.write'),
        Buffer.from('<script'),
        Buffer.from('javascript:'),
        Buffer.from('vbscript:'),
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (firstKB.includes(pattern)) {
          return {
            isClean: false,
            threatName: 'Suspicious_Script_Content',
            scanEngine: 'basic_heuristics',
            scanTime: Date.now() - startTime
          };
        }
      }
      
      // If no obvious issues found, consider clean
      return {
        isClean: true,
        scanEngine: 'basic_heuristics',
        scanTime: Date.now() - startTime
      };
      
    } catch (error) {
      throw new Error(`Basic scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async _quarantineFile(filePath: string, sha256: string): Promise<void> {
    try {
      const quarantineDir = '/tmp/quarantine';
      const quarantinePath = `${quarantineDir}/${sha256}.quarantine`;
      
      // Move file to quarantine (simple implementation)
      await execAsync(`mkdir -p "${quarantineDir}" && mv "${filePath}" "${quarantinePath}"`);
      
      console.log(`File quarantined: ${filePath} -> ${quarantinePath}`);
    } catch (error) {
      console.error(`Failed to quarantine file ${filePath}:`, error);
    }
  }

  async getEngineVersion(): Promise<{ engine: string; version: string; database: string } | null> {
    try {
      const { stdout } = await execAsync('clamscan --version', { timeout: 5000 });
      
      // Parse ClamAV version output
      const versionMatch = stdout.match(/ClamAV (\d+\.\d+\.\d+)/);
      const databaseMatch = stdout.match(/\/(\d+)$/);
      
      if (versionMatch) {
        return {
          engine: 'ClamAV',
          version: versionMatch[1],
          database: databaseMatch ? databaseMatch[1] : 'unknown'
        };
      }
    } catch (error) {
      console.warn('Could not get ClamAV version:', error);
    }
    
    return null;
  }
}

// Singleton instance
export const antivirusScanner = new AntivirusScanner();

// Queue-based scanner for async processing
class ScanQueue {
  private queue: Array<{ filePath: string; sha256: string; options?: ScanOptions; resolve: Function; reject: Function }> = [];
  private processing = false;

  async queueScan(filePath: string, sha256: string, options?: ScanOptions): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ filePath, sha256, options, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        const result = await antivirusScanner.scanFile(item.filePath, item.sha256, item.options);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }
}

export const scanQueue = new ScanQueue();

// Helper function for upload commit route
export async function queueVirusScan(sha256: string, filePath: string): Promise<void> {
  // Queue for async processing - don't block the upload response
  scanQueue.queueScan(filePath, sha256, {
    quarantineOnDetection: true,
    timeoutMs: 120 * 1000 // 2 minutes
  }).catch(error => {
    console.error(`Virus scan failed for ${sha256}:`, error);
  });
}