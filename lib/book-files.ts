'use client';

export interface BookFiles {
  main: string | null;
  frontCover: string | null;
  backCover: string | null;
  bookId: string;
  folderName: string;
}

export interface BookFileConfig {
  baseDir: string;
  publicUrl: string;
}

// Default configuration for book files
const DEFAULT_CONFIG: BookFileConfig = {
  baseDir: '/books',
  publicUrl: '/books'
};

/**
 * Normalize book folder name from various formats
 * Examples: "01_ Neema_01" -> "neema-01", "02_ Neema_02" -> "neema-02"
 */
export function normalizeBookFolderName(originalName: string): string {
  return originalName
    .toLowerCase()
    .replace(/^\d+_?\s*/, '') // Remove leading numbers and underscores
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * Generate book ID from folder name
 */
export function generateBookId(folderName: string): string {
  return normalizeBookFolderName(folderName);
}

/**
 * Resolve book file paths for a given book (client-side only)
 */
export function resolveBookFiles(
  bookId: string, 
  config: Partial<BookFileConfig> = {}
): BookFiles {
  const { publicUrl } = { ...DEFAULT_CONFIG, ...config };
  
  // In browser, we construct standard URLs
  const result: BookFiles = {
    main: `${publicUrl}/${bookId}/main.pdf`,
    frontCover: `${publicUrl}/${bookId}/cover.pdf`, // Use correct cover files
    backCover: `${publicUrl}/${bookId}/back.pdf`,
    bookId,
    folderName: bookId
  };

  return result;
}

/**
 * Get all available book folders (not available client-side)
 */
export function getAvailableBooks(config: Partial<BookFileConfig> = {}): string[] {
  console.warn('getAvailableBooks can only be called on server side');
  return [];
}

/**
 * Validate book files configuration
 */
export function validateBookFiles(bookFiles: BookFiles): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!bookFiles.main) {
    errors.push('Main PDF file is required');
  }

  if (!bookFiles.frontCover) {
    warnings.push('Front cover PDF is missing');
  }

  if (!bookFiles.backCover) {
    warnings.push('Back cover PDF is missing');
  }

  if (!bookFiles.bookId || bookFiles.bookId.trim() === '') {
    errors.push('Book ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get thumbnail source for a book
 * Priority: front cover > main PDF first page
 */
export function getBookThumbnailSource(bookFiles: BookFiles): {
  pdfUrl: string;
  sourceType: 'front-cover' | 'main-pdf';
} {
  if (bookFiles.frontCover) {
    return {
      pdfUrl: bookFiles.frontCover,
      sourceType: 'front-cover'
    };
  }

  if (bookFiles.main) {
    return {
      pdfUrl: bookFiles.main,
      sourceType: 'main-pdf'
    };
  }

  throw new Error('No PDF source available for thumbnail generation');
}

/**
 * Generate display name from book ID
 */
export function getBookDisplayName(bookId: string): string {
  return bookId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse original book folder structure
 */
export function parseOriginalBookFolder(folderName: string): {
  series?: string;
  title?: string;
  part?: string;
  number?: string;
} {
  // Examples to handle:
  // "01_ Neema_01" -> { series: "Neema", part: "01", number: "01" }
  // "04_ Second chance" -> { title: "Second chance", number: "04" }
  // "05_ Angel prayer" -> { title: "Angel prayer", number: "05" }

  const parts = folderName.split(/[_\s]+/).filter(p => p.length > 0);
  const result: any = {};

  if (parts.length >= 1) {
    // First part is usually a number
    const firstPart = parts[0];
    if (/^\d+/.test(firstPart)) {
      result.number = firstPart.replace(/\D/g, '');
    }
  }

  if (parts.length >= 2) {
    const remainingParts = parts.slice(1);
    
    // Check if it follows "Series_PartNumber" pattern
    if (remainingParts.length >= 2 && /^\d+$/.test(remainingParts[remainingParts.length - 1])) {
      result.series = remainingParts.slice(0, -1).join(' ');
      result.part = remainingParts[remainingParts.length - 1];
    } else {
      // Treat as title
      result.title = remainingParts.join(' ');
    }
  }

  return result;
}