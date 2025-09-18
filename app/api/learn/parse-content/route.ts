import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAssignmentAccess } from '@/lib/assignment-access';
import { pdfParser } from '@/lib/services/education/pdf-parser';
import * as fs from 'fs/promises';
import * as path from 'path';

// Upstage API integration for content parsing and difficulty adaptation
async function parseWithUpstage(text: string, difficulty: string) {
  try {
    const upstageApiKey = process.env.UPSTAGE_API_KEY;
    if (!upstageApiKey) {
      console.warn('UPSTAGE_API_KEY not configured, using fallback parsing');
      return null;
    }

    // Map difficulty levels to reading ages
    const difficultyMap = {
      'under-7': 'simple words for children under 7',
      '7-9': 'vocabulary suitable for ages 7-9',
      '10-12': 'intermediate vocabulary for ages 10-12',
      'adult': 'advanced vocabulary for adult readers'
    };

    const prompt = `Please adapt the following text for ${difficultyMap[difficulty as keyof typeof difficultyMap] || difficulty} reading level. 

Requirements:
1. Maintain the core story and meaning
2. Adjust vocabulary and sentence complexity appropriate for the reading level
3. Keep the text engaging and educational
4. Preserve important concepts but explain them at the appropriate level

Original text:
${text}

Please provide the adapted text only, without additional commentary.`;

    const response = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstageApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'solar-1-mini-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content adapter who helps make texts appropriate for different reading levels while preserving their educational value.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.error('Upstage API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;

  } catch (error) {
    console.error('Error calling Upstage API:', error);
    return null;
  }
}

// Enhanced vocabulary extraction based on difficulty level
function extractVocabularyForLevel(text: string, difficulty: string): any[] {
  const allVocabulary = [
    { word: 'adventure', definition: 'an exciting journey or experience', example: 'They went on a great adventure.', difficulty: 1 },
    { word: 'friendship', definition: 'a close relationship between friends', example: 'Their friendship lasted many years.', difficulty: 2 },
    { word: 'courage', definition: 'bravery in facing danger or difficulty', example: 'She showed great courage.', difficulty: 2 },
    { word: 'perseverance', definition: 'continued effort despite difficulties', example: 'His perseverance paid off.', difficulty: 4 },
    { word: 'compassion', definition: 'sympathy and concern for others', example: 'She showed compassion to the injured animal.', difficulty: 3 },
    { word: 'resilient', definition: 'able to recover quickly from difficulties', example: 'The resilient plant survived the storm.', difficulty: 4 },
    { word: 'innovative', definition: 'featuring new methods; creative', example: 'The innovative solution surprised everyone.', difficulty: 4 },
    { word: 'collaborative', definition: 'involving working together', example: 'The collaborative project was successful.', difficulty: 3 },
    { word: 'mysterious', definition: 'difficult to understand or explain', example: 'The mysterious sound scared them.', difficulty: 2 },
    { word: 'magnificent', definition: 'very beautiful and impressive', example: 'The sunset was magnificent.', difficulty: 3 }
  ];

  // Filter vocabulary based on difficulty level
  const maxDifficulty = {
    'under-7': 1,
    '7-9': 2,
    '10-12': 3,
    'adult': 4
  };

  const limit = maxDifficulty[difficulty as keyof typeof maxDifficulty] || 3;
  return allVocabulary
    .filter(word => word.difficulty <= limit)
    .filter(word => text.toLowerCase().includes(word.word.toLowerCase()))
    .slice(0, 8); // Limit to 8 vocabulary words
}

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

This story is about discovery, friendship, and learning. It teaches us important lessons about working together and helping others. The characters face challenges and grow stronger through their experiences.

[This is a placeholder text. Full content will be available when the teacher sets up the reading assignment.]`,
      language: book.language,
      readingLevel: book.readingLevel,
      source: 'fallback'
    };
    
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId, difficulty = 'intermediate' } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role || 'LEARNER';

    // Check assignment-based access for students
    const accessValidation = await validateAssignmentAccess(userId, bookId, userRole);
    
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
    const extracted = await extractTextFromBook(bookId);
    let adaptedText = extracted.text;

    // Try to adapt text using Upstage API
    const upstageAdapted = await parseWithUpstage(extracted.text, difficulty);
    if (upstageAdapted) {
      adaptedText = upstageAdapted;
    } else {
      // Fallback: Simple text adaptation based on difficulty
      if (difficulty === 'under-7') {
        adaptedText = extracted.text
          .replace(/difficult/g, 'hard')
          .replace(/magnificent/g, 'beautiful')
          .replace(/adventurous/g, 'fun')
          .replace(/discovered/g, 'found')
          .replace(/mysterious/g, 'strange');
      } else if (difficulty === 'adult') {
        adaptedText = `${extracted.text}

This narrative explores complex themes of personal growth, resilience, and the interconnectedness of community relationships. The protagonist's journey represents a universal human experience of facing adversity and emerging transformed through the process.`;
      }
    }
    
    // Extract vocabulary based on difficulty level
    const vocabulary = extractVocabularyForLevel(adaptedText, difficulty);
    
    return NextResponse.json({
      success: true,
      text: adaptedText,
      originalText: extracted.text,
      language: extracted.language,
      readingLevel: extracted.readingLevel,
      difficulty,
      vocabulary,
      wordCount: adaptedText.split(/\s+/).length,
      estimatedReadTime: Math.ceil(adaptedText.split(/\s+/).length / 200),
      source: extracted.source,
      pageCount: extracted.pageCount,
      adaptedBy: upstageAdapted ? 'upstage' : 'fallback'
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