import { prisma } from '@/lib/prisma';
import { pdfParser } from '@/lib/services/education/pdf-parser';
import fs from 'fs/promises';
import path from 'path';

export type ContentType = 'text' | 'pdf' | 'mixed';
export type ContentDestination = 'library' | 'education' | 'both';

interface ContentSubmission {
  title: string;
  author: string;
  type: ContentType;
  destination: ContentDestination;
  content?: string; // For text-only submissions
  pdfPath?: string; // For PDF submissions
  language?: string;
  categories?: string[];
  tags?: string[];
  targetAge?: string;
  submittedBy: string; // Volunteer/Teacher ID
}

interface ProcessedContent {
  id: string;
  title: string;
  author: string;
  content: string;
  pdfUrl?: string;
  status: 'draft' | 'review' | 'published';
  destinations: ContentDestination[];
  metadata: {
    language: string;
    readingLevel: string;
    categories: string[];
    tags: string[];
    wordCount: number;
    estimatedReadTime: number;
  };
}

export class ContentPipeline {
  
  /**
   * Main entry point for content submission
   */
  async submitContent(submission: ContentSubmission): Promise<ProcessedContent> {
    // Validate submission
    this.validateSubmission(submission);
    
    // Process based on content type
    let processedContent: ProcessedContent;
    
    switch (submission.type) {
      case 'text':
        processedContent = await this.processTextContent(submission);
        break;
      case 'pdf':
        processedContent = await this.processPdfContent(submission);
        break;
      case 'mixed':
        processedContent = await this.processMixedContent(submission);
        break;
      default:
        throw new Error(`Unsupported content type: ${submission.type}`);
    }
    
    // Route to appropriate destinations
    await this.routeContent(processedContent);
    
    // Trigger review workflow if needed
    if (processedContent.status === 'draft') {
      await this.initiateReview(processedContent.id);
    }
    
    return processedContent;
  }
  
  /**
   * Process text-only submissions
   */
  private async processTextContent(submission: ContentSubmission): Promise<ProcessedContent> {
    if (!submission.content) {
      throw new Error('Text content is required for text submissions');
    }
    
    // Analyze text for metadata
    const metadata = await this.analyzeText(submission.content);
    
    // Create draft content record
    const content = await prisma.content.create({
      data: {
        title: submission.title,
        authorName: submission.author,
        content: submission.content,
        type: 'TEXT',
        status: 'DRAFT',
        language: submission.language || metadata.detectedLanguage || 'en',
        categories: submission.categories || metadata.suggestedCategories || ['General'],
        tags: submission.tags || metadata.extractedTags || [],
        readingLevel: metadata.readingLevel || 'Intermediate',
        wordCount: metadata.wordCount,
        estimatedReadTime: metadata.estimatedReadTime,
        submittedById: submission.submittedBy,
        destinations: [submission.destination]
      }
    });
    
    return this.mapToProcessedContent(content);
  }
  
  /**
   * Process PDF submissions
   */
  private async processPdfContent(submission: ContentSubmission): Promise<ProcessedContent> {
    if (!submission.pdfPath) {
      throw new Error('PDF path is required for PDF submissions');
    }
    
    // Parse PDF to extract text and metadata
    const parsedPdf = await pdfParser.parseFile(submission.pdfPath);
    
    // Analyze extracted text
    const metadata = await this.analyzeText(parsedPdf.content);
    
    // Copy PDF to storage location
    const pdfUrl = await this.storePdf(submission.pdfPath, submission.title);
    
    // Create content record
    const content = await prisma.content.create({
      data: {
        title: submission.title || parsedPdf.title,
        authorName: submission.author || parsedPdf.author,
        content: parsedPdf.content,
        pdfUrl,
        type: 'PDF',
        status: 'REVIEW', // PDFs go directly to review
        language: submission.language || metadata.detectedLanguage || 'en',
        categories: submission.categories || metadata.suggestedCategories || ['General'],
        tags: submission.tags || metadata.extractedTags || [],
        readingLevel: metadata.readingLevel || 'Intermediate',
        wordCount: metadata.wordCount,
        estimatedReadTime: metadata.estimatedReadTime,
        submittedById: submission.submittedBy,
        destinations: [submission.destination]
      }
    });
    
    return this.mapToProcessedContent(content);
  }
  
  /**
   * Process mixed content (text + PDF)
   */
  private async processMixedContent(submission: ContentSubmission): Promise<ProcessedContent> {
    // Process both text and PDF components
    const textMetadata = submission.content ? await this.analyzeText(submission.content) : null;
    const pdfData = submission.pdfPath ? await pdfParser.parseFile(submission.pdfPath) : null;
    
    // Merge content and metadata
    const mergedContent = submission.content || pdfData?.content || '';
    const metadata = await this.analyzeText(mergedContent);
    
    // Store PDF if provided
    const pdfUrl = submission.pdfPath ? await this.storePdf(submission.pdfPath, submission.title) : undefined;
    
    // Create unified content record
    const content = await prisma.content.create({
      data: {
        title: submission.title,
        authorName: submission.author,
        content: mergedContent,
        pdfUrl,
        type: 'MIXED',
        status: 'REVIEW',
        language: submission.language || metadata.detectedLanguage || 'en',
        categories: submission.categories || metadata.suggestedCategories || ['General'],
        tags: submission.tags || metadata.extractedTags || [],
        readingLevel: metadata.readingLevel || 'Intermediate',
        wordCount: metadata.wordCount,
        estimatedReadTime: metadata.estimatedReadTime,
        submittedById: submission.submittedBy,
        destinations: [submission.destination]
      }
    });
    
    return this.mapToProcessedContent(content);
  }
  
  /**
   * Analyze text for metadata extraction
   */
  private async analyzeText(text: string): Promise<any> {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    // Simple reading level detection based on word length and sentence structure
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    let readingLevel = 'Intermediate';
    
    if (avgWordLength < 4.5) {
      readingLevel = 'Beginner';
    } else if (avgWordLength > 6) {
      readingLevel = 'Advanced';
    }
    
    // Extract potential tags (words that appear frequently)
    const wordFrequency = new Map<string, number>();
    words.forEach(word => {
      const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
      if (normalized.length > 5) {
        wordFrequency.set(normalized, (wordFrequency.get(normalized) || 0) + 1);
      }
    });
    
    const extractedTags = Array.from(wordFrequency.entries())
      .filter(([_, count]) => count > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    // Suggest categories based on keywords
    const suggestedCategories = this.suggestCategories(text);
    
    return {
      wordCount,
      estimatedReadTime,
      readingLevel,
      extractedTags,
      suggestedCategories,
      detectedLanguage: 'en' // Simplified - would use language detection library
    };
  }
  
  /**
   * Suggest categories based on content
   */
  private suggestCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();
    
    const categoryKeywords = {
      'Adventure': ['adventure', 'journey', 'explore', 'travel', 'quest'],
      'Educational': ['learn', 'school', 'education', 'study', 'knowledge'],
      'Friendship': ['friend', 'friendship', 'together', 'companion', 'buddy'],
      'Family': ['family', 'mother', 'father', 'parent', 'sibling', 'brother', 'sister'],
      'Fantasy': ['magic', 'wizard', 'dragon', 'fairy', 'enchanted'],
      'Science': ['science', 'experiment', 'discover', 'research', 'technology'],
      'History': ['history', 'past', 'ancient', 'historical', 'tradition'],
      'Cultural': ['culture', 'tradition', 'custom', 'heritage', 'festival']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }
    
    return categories.length > 0 ? categories : ['General'];
  }
  
  /**
   * Store PDF file in public directory
   */
  private async storePdf(sourcePath: string, title: string): Promise<string> {
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();
    const fileName = `${sanitizedTitle}-${timestamp}.pdf`;
    const destDir = path.join(process.cwd(), 'public', 'books', 'uploads');
    const destPath = path.join(destDir, fileName);
    
    // Ensure directory exists
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy file
    await fs.copyFile(sourcePath, destPath);
    
    return `/books/uploads/${fileName}`;
  }
  
  /**
   * Route content to appropriate destinations
   */
  private async routeContent(content: ProcessedContent): Promise<void> {
    const destinations = content.destinations;
    
    if (destinations.includes('library') || destinations.includes('both')) {
      // Create library entry
      await this.createLibraryEntry(content);
    }
    
    if (destinations.includes('education') || destinations.includes('both')) {
      // Create education material
      await this.createEducationMaterial(content);
    }
  }
  
  /**
   * Create library entry from content
   */
  private async createLibraryEntry(content: ProcessedContent): Promise<void> {
    await prisma.book.create({
      data: {
        title: content.title,
        authorName: content.author,
        summary: content.content.substring(0, 500),
        language: content.metadata.language,
        category: content.metadata.categories,
        tags: content.metadata.tags,
        readingLevel: content.metadata.readingLevel,
        pdfKey: content.pdfUrl,
        isPublished: content.status === 'published',
        isPremium: false, // All content is free
        publishedAt: content.status === 'published' ? new Date() : null
      }
    });
  }
  
  /**
   * Create education material from content
   */
  private async createEducationMaterial(content: ProcessedContent): Promise<void> {
    // This would integrate with the existing education materials system
    // For now, we'll update the sample-materials.json file
    const materialsPath = path.join(
      process.cwd(),
      'public/books/english-education/sample-materials.json'
    );
    
    try {
      const existingData = await fs.readFile(materialsPath, 'utf-8');
      const materials = JSON.parse(existingData);
      
      materials.materials.push({
        id: content.id,
        title: content.title,
        author: content.author,
        content: content.content,
        level: content.metadata.readingLevel,
        category: content.metadata.categories[0] || 'General',
        topics: content.metadata.categories,
        vocabulary: content.metadata.tags,
        questions: this.generateQuestions(content),
        source: 'volunteer-submission'
      });
      
      await fs.writeFile(materialsPath, JSON.stringify(materials, null, 2));
    } catch (error) {
      console.error('Error updating education materials:', error);
    }
  }
  
  /**
   * Generate comprehension questions for content
   */
  private generateQuestions(content: ProcessedContent): string[] {
    return [
      `What is the main theme of "${content.title}"?`,
      'Who are the main characters in this story?',
      'What lesson can we learn from this story?',
      'Describe the setting of the story.',
      'How does the story end?'
    ];
  }
  
  /**
   * Initiate review workflow for draft content
   */
  private async initiateReview(contentId: string): Promise<void> {
    // Create review task
    await prisma.contentReview.create({
      data: {
        contentId,
        status: 'PENDING',
        assignedTo: null, // Would be assigned to available reviewer
        createdAt: new Date()
      }
    });
    
    // Send notification to reviewers (implementation depends on notification system)
    console.log(`Review initiated for content: ${contentId}`);
  }
  
  /**
   * Validate content submission
   */
  private validateSubmission(submission: ContentSubmission): void {
    if (!submission.title || !submission.author) {
      throw new Error('Title and author are required');
    }
    
    if (submission.type === 'text' && !submission.content) {
      throw new Error('Content is required for text submissions');
    }
    
    if (submission.type === 'pdf' && !submission.pdfPath) {
      throw new Error('PDF path is required for PDF submissions');
    }
    
    if (!submission.submittedBy) {
      throw new Error('Submitter ID is required');
    }
  }
  
  /**
   * Map database content to ProcessedContent interface
   */
  private mapToProcessedContent(content: any): ProcessedContent {
    return {
      id: content.id,
      title: content.title,
      author: content.authorName,
      content: content.content,
      pdfUrl: content.pdfUrl,
      status: content.status.toLowerCase() as 'draft' | 'review' | 'published',
      destinations: content.destinations,
      metadata: {
        language: content.language,
        readingLevel: content.readingLevel,
        categories: content.categories,
        tags: content.tags,
        wordCount: content.wordCount,
        estimatedReadTime: content.estimatedReadTime
      }
    };
  }
}

export const contentPipeline = new ContentPipeline();