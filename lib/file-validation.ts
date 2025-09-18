/**
 * File signature validation utilities
 * Validates actual file types by checking magic numbers/signatures
 */

interface FileSignature {
  signature: number[];
  extension: string;
  mimeType: string;
  description: string;
}

// Common file signatures (magic numbers)
const FILE_SIGNATURES: FileSignature[] = [
  // PDF files
  {
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    extension: 'pdf',
    mimeType: 'application/pdf',
    description: 'PDF Document'
  },
  // PNG files
  {
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    extension: 'png',
    mimeType: 'image/png',
    description: 'PNG Image'
  },
  // JPEG files
  {
    signature: [0xFF, 0xD8, 0xFF],
    extension: 'jpg',
    mimeType: 'image/jpeg',
    description: 'JPEG Image'
  },
  // WebP files
  {
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF (check for WebP later)
    extension: 'webp',
    mimeType: 'image/webp',
    description: 'WebP Image'
  },
  // GIF files
  {
    signature: [0x47, 0x49, 0x46, 0x38], // GIF8
    extension: 'gif',
    mimeType: 'image/gif',
    description: 'GIF Image'
  }
];

/**
 * Read file signature from buffer
 */
export async function getFileSignature(file: File, length: number = 16): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer.slice(0, length));
      resolve(Array.from(bytes));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file signature'));
    
    // Read first bytes of the file
    reader.readAsArrayBuffer(file.slice(0, length));
  });
}

/**
 * Validate file type by checking signature
 */
export async function validateFileSignature(
  file: File, 
  allowedTypes: string[] = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif']
): Promise<{
  isValid: boolean;
  detectedType?: string;
  expectedTypes: string[];
  error?: string;
}> {
  try {
    const signature = await getFileSignature(file);
    
    // Find matching signature
    for (const fileType of FILE_SIGNATURES) {
      if (matchesSignature(signature, fileType.signature)) {
        const isTypeAllowed = allowedTypes.includes(fileType.extension) || 
                             allowedTypes.includes(fileType.mimeType);
        
        // Special check for WebP (needs to verify WEBP string after RIFF)
        if (fileType.extension === 'webp') {
          const extendedSignature = await getFileSignature(file, 16);
          const webpCheck = extendedSignature.slice(8, 12);
          const webpMarker = [0x57, 0x45, 0x42, 0x50]; // WEBP
          
          if (!matchesSignature(webpCheck, webpMarker)) {
            continue; // Not actually WebP, might be another RIFF format
          }
        }
        
        return {
          isValid: isTypeAllowed,
          detectedType: fileType.extension,
          expectedTypes: allowedTypes,
          error: isTypeAllowed ? undefined : `File type ${fileType.extension} not allowed`
        };
      }
    }
    
    // No signature matched
    return {
      isValid: false,
      expectedTypes: allowedTypes,
      error: 'Unknown or unsupported file type'
    };
    
  } catch (error) {
    return {
      isValid: false,
      expectedTypes: allowedTypes,
      error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if signature matches expected pattern
 */
function matchesSignature(actual: number[], expected: number[]): boolean {
  if (actual.length < expected.length) return false;
  
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) return false;
  }
  
  return true;
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File, 
  maxSizeBytes: number = 50 * 1024 * 1024 // 50MB default
): { isValid: boolean; error?: string; actualSize: number; maxSize: number } {
  const isValid = file.size <= maxSizeBytes;
  
  return {
    isValid,
    error: isValid ? undefined : `File too large. Maximum size: ${formatFileSize(maxSizeBytes)}, actual: ${formatFileSize(file.size)}`,
    actualSize: file.size,
    maxSize: maxSizeBytes
  };
}

/**
 * Format file size for human reading
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .substring(0, 255); // Limit length
}

/**
 * Comprehensive file validation
 */
export async function validateUploadedFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSize?: number;
    requireSignatureValidation?: boolean;
  } = {}
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    detectedType?: string;
  };
}> {
  const {
    allowedTypes = ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    maxSize = 50 * 1024 * 1024, // 50MB
    requireSignatureValidation = true
  } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate file size
  const sizeValidation = validateFileSize(file, maxSize);
  if (!sizeValidation.isValid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }
  
  // Validate file signature if required
  let detectedType: string | undefined;
  if (requireSignatureValidation) {
    const signatureValidation = await validateFileSignature(file, allowedTypes);
    detectedType = signatureValidation.detectedType;
    
    if (!signatureValidation.isValid && signatureValidation.error) {
      errors.push(signatureValidation.error);
    }
  }
  
  // Check filename
  const sanitizedName = sanitizeFilename(file.name);
  if (sanitizedName !== file.name) {
    warnings.push('Filename was sanitized to prevent security issues');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: sanitizedName,
      size: file.size,
      type: file.type,
      detectedType
    }
  };
}