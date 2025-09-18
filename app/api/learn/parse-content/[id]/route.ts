import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAssignmentAccess } from '@/lib/assignment-access';
import { pdfParser } from '@/lib/services/education/pdf-parser';
import * as fs from 'fs/promises';
import * as path from 'path';

// Enhanced text extraction from book data with PDF parsing
async function extractTextFromBook(bookId: string) {
  try {
    // First try to get book from database
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        content: true,
        language: true,
        readingLevel: true,
        pdfKey: true
      }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // Priority 1: Try to extract from PDF if available
    const bookDir = path.join(process.cwd(), 'public', 'books', bookId);
    const possiblePdfPaths = [
      path.join(bookDir, 'main.pdf'),
      path.join(bookDir, `${bookId}.pdf`),
      path.join(bookDir, 'sample.pdf')
    ];

    for (const pdfPath of possiblePdfPaths) {
      try {
        await fs.access(pdfPath);
        console.log(`Found PDF file: ${pdfPath}`);
        
        const parsedPDF = await pdfParser.parseFile(pdfPath);
        
        // Return the full extracted text from PDF
        return {
          text: parsedPDF.content,
          language: book.language,
          readingLevel: book.readingLevel,
          pageCount: parsedPDF.pageCount,
          source: 'pdf'
        };
      } catch (pdfError) {
        console.log(`PDF not found at ${pdfPath}, trying next...`);
        continue;
      }
    }

    // Priority 2: Use book content if available
    if (book.content && book.content.length > 100) {
      return {
        text: book.content,
        language: book.language,
        readingLevel: book.readingLevel,
        source: 'database_content'
      };
    }

    // Priority 3: Try to read from text file if exists
    const textFile = path.join(bookDir, 'content.txt');
    try {
      const content = await fs.readFile(textFile, 'utf-8');
      if (content.length > 100) {
        return {
          text: content,
          language: book.language,
          readingLevel: book.readingLevel,
          source: 'text_file'
        };
      }
    } catch {
      console.log(`No text file found at ${textFile}`);
    }

    // Priority 4: Use summary if substantial
    if (book.summary && book.summary.length > 50) {
      return {
        text: book.summary,
        language: book.language,
        readingLevel: book.readingLevel,
        source: 'summary'
      };
    }

    // Fallback: Return error message
    return {
      text: `${book.title}

by ${book.authorName}

[Content not available for parsing. This book may not have readable text content available.]

Please contact support if you believe this is an error.`,
      language: book.language,
      readingLevel: book.readingLevel,
      source: 'fallback'
    };
    
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Extract vocabulary words from text
function extractVocabulary(text: string, readingLevel?: string): any[] {
  const vocabulary = [];
  
  // Basic vocabulary extraction (in production, use NLP library)
  const difficultWords = [
    { word: 'perseverance', definition: 'continued effort despite difficulties', difficulty: 4 },
    { word: 'compassion', definition: 'sympathy and concern for others', difficulty: 3 },
    { word: 'resilient', definition: 'able to recover quickly from difficulties', difficulty: 4 },
    { word: 'innovative', definition: 'featuring new methods; creative', difficulty: 3 },
    { word: 'collaborative', definition: 'involving working together', difficulty: 3 }
  ];

  // Filter based on reading level
  if (readingLevel === 'Beginner') {
    return difficultWords.filter(w => w.difficulty <= 2);
  } else if (readingLevel === 'Advanced') {
    return difficultWords;
  }
  
  return difficultWords.filter(w => w.difficulty <= 3);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role || 'LEARNER';

    // Check assignment-based access for students
    const accessValidation = await validateAssignmentAccess(userId, id, userRole);
    
    if (!accessValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Access denied', 
          message: accessValidation.message || 'You do not have access to this book'
        },
        { status: 403 }
      );
    }

    // Extract text from book
    const extracted = await extractTextFromBook(id);
    
    // Extract vocabulary
    const vocabulary = extractVocabulary(extracted.text, extracted.readingLevel || undefined);
    
    return NextResponse.json({
      success: true,
      text: extracted.text,
      language: extracted.language,
      readingLevel: extracted.readingLevel,
      vocabulary,
      wordCount: extracted.text.split(/\s+/).length,
      estimatedReadTime: Math.ceil(extracted.text.split(/\s+/).length / 200),
      source: extracted.source,
      pageCount: extracted.pageCount
    });
    
  } catch (error) {
    console.error('Error parsing content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}