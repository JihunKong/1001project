import { promises as fs } from 'fs';
import path from 'path';
import { extractTextFromPDF } from './pdf-text-extractor';

export type ContentFormat = 'pdf' | 'md' | 'html' | 'txt';

export interface BookContent {
  format: ContentFormat;
  content: string;
  // Database fields (when fetched from API)
  id?: string;
  title?: string;
  author?: string;
  coverImage?: string | null;
  thumbnails?: string[];
  // Legacy metadata structure (for file-based content)
  metadata?: {
    title?: string;
    author?: string;
    level?: string;
    tags?: string[];
    pageCount?: number;
  };
}

export class ContentLoader {
  private bookId: string;
  private basePath: string;

  constructor(bookId: string) {
    this.bookId = bookId;
    this.basePath = path.join(process.cwd(), 'public', 'books', bookId);
  }

  async loadContent(): Promise<BookContent | null> {
    try {
      // Check for different content formats in order of preference
      const formats: { ext: string; type: ContentFormat }[] = [
        { ext: 'content.md', type: 'md' },
        { ext: 'content.html', type: 'html' },
        { ext: 'content.txt', type: 'txt' },
        { ext: 'main.pdf', type: 'pdf' },
      ];

      for (const format of formats) {
        const filePath = path.join(this.basePath, format.ext);
        try {
          await fs.access(filePath);
          
          if (format.type === 'pdf') {
            // For PDF, extract text content
            try {
              const textContent = await extractTextFromPDF(filePath);
              
              // Return extracted text content for ESL processing
              return {
                format: 'txt', // Return as text format for ESL processing
                content: textContent,
                metadata: {
                  ...await this.loadMetadata(),
                  pageCount: 10, // Default page count for now
                },
              };
            } catch (pdfError) {
              console.error('Error extracting PDF text:', pdfError);
              // Fallback to returning path if extraction fails
              return {
                format: 'pdf',
                content: `/books/${this.bookId}/main.pdf`,
                metadata: await this.loadMetadata(),
              };
            }
          } else {
            // For text formats, read the content
            const content = await fs.readFile(filePath, 'utf-8');
            return {
              format: format.type,
              content,
              metadata: await this.loadMetadata(),
            };
          }
        } catch {
          // File doesn't exist, try next format
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading content:', error);
      return null;
    }
  }

  async loadMetadata(): Promise<BookContent['metadata']> {
    try {
      const metadataPath = path.join(this.basePath, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(metadataContent);
    } catch {
      // If metadata doesn't exist, return empty object
      return {};
    }
  }

  async getCoverImage(): Promise<string | null> {
    const coverFormats = ['cover.png', 'cover.jpg', 'cover.jpeg', 'cover.webp'];
    
    for (const format of coverFormats) {
      const coverPath = path.join(this.basePath, format);
      try {
        await fs.access(coverPath);
        return `/books/${this.bookId}/${format}`;
      } catch {
        continue;
      }
    }
    
    return null;
  }

  async getThumbnails(): Promise<string[]> {
    try {
      const thumbnailsPath = path.join(this.basePath, 'thumbnails');
      const files = await fs.readdir(thumbnailsPath);
      return files
        .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
        .sort()
        .map(file => `/books/${this.bookId}/thumbnails/${file}`);
    } catch {
      return [];
    }
  }

  static async listAvailableBooks(): Promise<string[]> {
    try {
      const booksPath = path.join(process.cwd(), 'public', 'books');
      const entries = await fs.readdir(booksPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }
}

// Helper function to parse different content formats
export function parseContent(content: string, format: ContentFormat): string[] {
  switch (format) {
    case 'md':
      // Split markdown by headers or double newlines for pages
      return content.split(/\n#{1,3}\s+/).filter(Boolean);
    
    case 'html':
      // Split HTML by section tags or h1/h2/h3
      const htmlSections = content.split(/<(?:section|h[123])[^>]*>/);
      return htmlSections.filter(Boolean);
    
    case 'txt':
      // Split text by double newlines or fixed word count
      const paragraphs = content.split(/\n\n+/);
      const pages: string[] = [];
      let currentPage = '';
      let wordCount = 0;
      
      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).length;
        if (wordCount + words > 300) { // ~300 words per page
          if (currentPage) {
            pages.push(currentPage.trim());
          }
          currentPage = paragraph;
          wordCount = words;
        } else {
          currentPage += '\n\n' + paragraph;
          wordCount += words;
        }
      }
      
      if (currentPage) {
        pages.push(currentPage.trim());
      }
      
      return pages;
    
    case 'pdf':
      // PDF content is handled differently
      return [content];
    
    default:
      return [content];
  }
}