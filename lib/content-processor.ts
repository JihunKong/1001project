import { marked } from 'marked';

export interface ProcessedContent {
  chapters: Chapter[];
  totalWords: number;
  estimatedReadingTime: number;
  format: 'html' | 'text' | 'markdown';
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

export class ContentProcessor {
  /**
   * Process raw content into structured chapters
   */
  static processContent(rawContent: string): ProcessedContent {
    // Remove markdown artifacts and clean up content
    let cleanedContent = this.cleanContent(rawContent);
    
    // Parse into chapters
    const chapters = this.parseChapters(cleanedContent);
    
    // Calculate stats
    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    const estimatedReadingTime = Math.ceil(totalWords / 200); // 200 words per minute
    
    return {
      chapters,
      totalWords,
      estimatedReadingTime,
      format: 'html'
    };
  }
  
  /**
   * Clean content by removing unnecessary markdown and formatting
   */
  private static cleanContent(content: string): string {
    // Remove excessive markdown symbols
    let cleaned = content
      // Remove markdown headers but keep the text
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Remove code blocks markers but keep content
      .replace(/```[a-z]*\n([\s\S]*?)```/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove list markers but keep content
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove blockquote markers
      .replace(/^>\s+/gm, '')
      // Clean up extra spaces
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    return cleaned;
  }
  
  /**
   * Parse content into logical chapters/sections
   */
  private static parseChapters(content: string): Chapter[] {
    const chapters: Chapter[] = [];
    
    // Look for chapter markers (various patterns)
    const chapterPatterns = [
      /Chapter\s+(\d+|[IVX]+)[:\s]+([^\n]+)/gi,
      /Part\s+(\d+|[IVX]+)[:\s]+([^\n]+)/gi,
      /Section\s+(\d+|[IVX]+)[:\s]+([^\n]+)/gi,
      /(\d+)\.\s+([^\n]+)/g, // Numbered sections
      /^([A-Z][^.!?\n]{10,50})$/gm // Capitalized lines as potential headers
    ];
    
    // Split by double line breaks first
    const sections = content.split(/\n\n+/);
    
    let currentChapter: Chapter | null = null;
    let chapterIndex = 0;
    
    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;
      
      // Check if this section is a chapter header
      let isChapterHeader = false;
      let chapterTitle = '';
      
      for (const pattern of chapterPatterns) {
        const match = pattern.exec(trimmedSection);
        if (match && trimmedSection.length < 100) { // Headers are usually short
          isChapterHeader = true;
          chapterTitle = match[2] || match[1] || trimmedSection;
          break;
        }
      }
      
      if (isChapterHeader) {
        // Save previous chapter if exists
        if (currentChapter && currentChapter.content.trim()) {
          chapters.push(currentChapter);
        }
        
        // Start new chapter
        currentChapter = {
          id: `chapter-${chapterIndex}`,
          title: this.cleanTitle(chapterTitle),
          content: '',
          wordCount: 0,
          order: chapterIndex
        };
        chapterIndex++;
      } else {
        // Add to current chapter or create default chapter
        if (!currentChapter) {
          currentChapter = {
            id: `chapter-${chapterIndex}`,
            title: `Section ${chapterIndex + 1}`,
            content: '',
            wordCount: 0,
            order: chapterIndex
          };
          chapterIndex++;
        }
        
        // Filter out unnecessary content
        if (!this.isUnnecessaryContent(trimmedSection)) {
          currentChapter.content += (currentChapter.content ? '\n\n' : '') + trimmedSection;
          currentChapter.wordCount = currentChapter.content.split(/\s+/).length;
        }
      }
    });
    
    // Don't forget the last chapter
    if (currentChapter && currentChapter.content.trim()) {
      chapters.push(currentChapter);
    }
    
    // If no chapters were found, create one from all content
    if (chapters.length === 0 && content.trim()) {
      chapters.push({
        id: 'chapter-0',
        title: 'Main Content',
        content: content.trim(),
        wordCount: content.trim().split(/\s+/).length,
        order: 0
      });
    }
    
    return chapters;
  }
  
  /**
   * Clean up chapter titles
   */
  private static cleanTitle(title: string): string {
    return title
      .replace(/^Chapter\s+\d+[:\s]+/i, '')
      .replace(/^Part\s+\d+[:\s]+/i, '')
      .replace(/^Section\s+\d+[:\s]+/i, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/[#*_]+/g, '')
      .trim();
  }
  
  /**
   * Check if content is unnecessary (metadata, repeated headers, etc.)
   */
  private static isUnnecessaryContent(content: string): boolean {
    const unnecessary = [
      /^table of contents$/i,
      /^index$/i,
      /^copyright/i,
      /^all rights reserved/i,
      /^isbn/i,
      /^published by/i,
      /^printed in/i,
      /^dedication$/i,
      /^acknowledgments?$/i,
      /^about the author$/i,
      /^bibliography$/i,
      /^references$/i,
      /^appendix/i,
      /^glossary$/i,
      /^notes$/i,
      /^preface$/i,
      /^foreword$/i,
      /^end of (book|chapter|section)/i,
      /^page \d+$/i,
      /^\d+$/, // Just page numbers
      /^[-_*]{3,}$/, // Dividers
      /^\.{3,}$/, // Ellipsis only
    ];
    
    const trimmed = content.trim();
    
    // Check if it's too short to be meaningful content
    if (trimmed.length < 20) {
      return true;
    }
    
    // Check against unnecessary patterns
    for (const pattern of unnecessary) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }
    
    // Check if it's mostly special characters or numbers
    const alphaRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
    if (alphaRatio < 0.5) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Convert processed content to HTML for rendering
   */
  static toHTML(content: ProcessedContent): string {
    let html = '';
    
    content.chapters.forEach((chapter, index) => {
      if (index > 0) {
        html += '<div class="chapter-separator"></div>\n';
      }
      
      html += `<div class="chapter" id="${chapter.id}">\n`;
      html += `  <h2 class="text-2xl font-bold text-gray-900 mb-4">${chapter.title}</h2>\n`;
      
      // Convert content paragraphs to HTML
      const paragraphs = chapter.content.split(/\n\n+/);
      paragraphs.forEach(para => {
        if (para.trim()) {
          html += `  <p class="mb-4 text-gray-800">${para.trim()}</p>\n`;
        }
      });
      
      html += `</div>\n`;
    });
    
    return html;
  }
  
  /**
   * Get content for a specific page (pagination support)
   */
  static getPageContent(
    content: ProcessedContent, 
    pageNumber: number, 
    wordsPerPage: number = 300
  ): { html: string; currentChapter: string; progress: number } {
    const startWord = (pageNumber - 1) * wordsPerPage;
    const endWord = startWord + wordsPerPage;
    
    let wordsSoFar = 0;
    let pageHtml = '';
    let currentChapterTitle = '';
    let foundStart = false;
    
    for (const chapter of content.chapters) {
      const chapterStart = wordsSoFar;
      const chapterEnd = wordsSoFar + chapter.wordCount;
      
      // Check if this chapter contains our page
      if (chapterEnd > startWord && chapterStart < endWord) {
        if (!foundStart) {
          foundStart = true;
          currentChapterTitle = chapter.title;
        }
        
        // Calculate which part of the chapter to include
        const words = chapter.content.split(/\s+/);
        const relativeStart = Math.max(0, startWord - chapterStart);
        const relativeEnd = Math.min(words.length, endWord - chapterStart);
        
        const pageWords = words.slice(relativeStart, relativeEnd);
        
        // Add chapter title if starting a new chapter
        if (relativeStart === 0) {
          pageHtml += `<h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">${chapter.title}</h2>\n`;
        }
        
        // Group words back into paragraphs (rough approximation)
        const pageText = pageWords.join(' ');
        const paragraphs = pageText.split(/\.\s+/);
        
        paragraphs.forEach((para, i) => {
          if (para.trim()) {
            // Add period back if not the last paragraph
            const text = i < paragraphs.length - 1 ? para + '.' : para;
            pageHtml += `<p class="mb-4 text-gray-800">${text.trim()}</p>\n`;
          }
        });
      }
      
      wordsSoFar += chapter.wordCount;
      
      if (wordsSoFar >= endWord) break;
    }
    
    const progress = Math.min(100, Math.round((endWord / content.totalWords) * 100));
    
    return {
      html: pageHtml || '<p>No content available for this page.</p>',
      currentChapter: currentChapterTitle,
      progress
    };
  }
}