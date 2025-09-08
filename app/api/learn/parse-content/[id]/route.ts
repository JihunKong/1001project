import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

// Simple text extraction from book data
async function extractTextFromBook(bookId: string) {
  try {
    // First try to get book from database
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        title: true,
        authorName: true,
        summary: true,
        language: true,
        readingLevel: true
      }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // If book has summary, use it as initial content
    if (book.summary) {
      return {
        text: book.summary,
        language: book.language,
        readingLevel: book.readingLevel
      };
    }

    // Otherwise, try to read from text file if exists
    const bookDir = path.join(process.cwd(), 'public', 'books', bookId);
    const textFile = path.join(bookDir, 'content.txt');
    
    try {
      const content = await fs.readFile(textFile, 'utf-8');
      return {
        text: content,
        language: book.language,
        readingLevel: book.readingLevel
      };
    } catch {
      // If no text file, return a default structure with book info
      return {
        text: `${book.title}

by ${book.authorName}

${book.summary || 'A wonderful story for learning English.'}

[Content not available for parsing. Please view the PDF version in the library.]`,
        language: book.language,
        readingLevel: book.readingLevel
      };
    }
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

    // Extract text from book
    const extracted = await extractTextFromBook(id);
    
    // Extract vocabulary
    const vocabulary = extractVocabulary(extracted.text, extracted.readingLevel);
    
    return NextResponse.json({
      success: true,
      text: extracted.text,
      language: extracted.language,
      readingLevel: extracted.readingLevel,
      vocabulary,
      wordCount: extracted.text.split(/\s+/).length,
      estimatedReadTime: Math.ceil(extracted.text.split(/\s+/).length / 200)
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