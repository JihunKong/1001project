import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

interface ParsedPDF {
  title: string;
  author: string;
  content: string;
  pageCount: number;
  extractedText: string;
}

export class PDFParser {
  async parseFile(filePath: string): Promise<ParsedPDF> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      // Extract title from filename or first line
      const fileName = filePath.split('/').pop()?.replace('.pdf', '') || 'Untitled';
      const lines = data.text.split('\n').filter(line => line.trim());
      const title = this.extractTitle(lines, fileName);
      const author = this.extractAuthor(lines);
      
      return {
        title,
        author,
        content: this.cleanText(data.text),
        pageCount: data.numpages,
        extractedText: data.text
      };
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error}`);
    }
  }
  
  async parseBuffer(buffer: Buffer, fileName: string = 'Untitled'): Promise<ParsedPDF> {
    try {
      const data = await pdfParse(buffer);
      
      const lines = data.text.split('\n').filter(line => line.trim());
      const title = this.extractTitle(lines, fileName);
      const author = this.extractAuthor(lines);
      
      return {
        title,
        author,
        content: this.cleanText(data.text),
        pageCount: data.numpages,
        extractedText: data.text
      };
    } catch (error) {
      console.error('Error parsing PDF buffer:', error);
      throw new Error(`Failed to parse PDF: ${error}`);
    }
  }
  
  private extractTitle(lines: string[], fallback: string): string {
    // Try to find title in first few lines
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 0 && firstLine.length < 100) {
        return firstLine;
      }
    }
    return fallback;
  }
  
  private extractAuthor(lines: string[]): string {
    // Look for author patterns
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('by ') || line.includes('author:')) {
        return lines[i].replace(/^(by |author:)/i, '').trim();
      }
    }
    return 'Unknown Author';
  }
  
  private cleanText(text: string): string {
    // Clean up text for better readability
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();
  }
  
  splitIntoChapters(content: string): string[] {
    // Split content into chapters or sections
    const chapters: string[] = [];
    const lines = content.split('\n');
    let currentChapter = '';
    
    for (const line of lines) {
      // Look for chapter markers
      if (line.match(/^(Chapter|CHAPTER|Section|SECTION|Part|PART)\s+\d+/i)) {
        if (currentChapter) {
          chapters.push(currentChapter.trim());
        }
        currentChapter = line + '\n';
      } else {
        currentChapter += line + '\n';
      }
    }
    
    // Add the last chapter
    if (currentChapter) {
      chapters.push(currentChapter.trim());
    }
    
    // If no chapters found, split by paragraph length
    if (chapters.length === 1) {
      const paragraphs = content.split('\n\n');
      const chunkSize = Math.ceil(paragraphs.length / 5); // Split into 5 sections
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        chapters.push(paragraphs.slice(i, i + chunkSize).join('\n\n'));
      }
    }
    
    return chapters.filter(ch => ch.length > 0);
  }
}

export const pdfParser = new PDFParser();