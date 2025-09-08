import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pdfParser } from '@/lib/services/education/pdf-parser';
import { upstageAdapter } from '@/lib/services/education/upstage-adapter';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const processType = formData.get('processType') as string || 'parse';
    const targetAge = formData.get('targetAge') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedPDF = await pdfParser.parseBuffer(buffer, file.name);
    
    // If adaptation is requested
    if (processType === 'adapt' && targetAge) {
      const adaptedResult = await upstageAdapter.adaptText({
        originalText: parsedPDF.content,
        targetAge: targetAge as any,
        title: parsedPDF.title
      });
      
      return NextResponse.json({
        ...parsedPDF,
        adaptedText: adaptedResult.adaptedText,
        readingLevel: adaptedResult.readingLevel,
        vocabulary: adaptedResult.vocabulary,
        estimatedReadingTime: adaptedResult.estimatedReadingTime
      });
    }
    
    // Split content into chapters for better organization
    const chapters = pdfParser.splitIntoChapters(parsedPDF.content);
    
    return NextResponse.json({
      ...parsedPDF,
      chapters
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}

// Load existing PDFs from the server
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const bookName = searchParams.get('book');
    
    if (bookName) {
      // Load specific book
      const pdfPath = path.join(process.cwd(), 'public/books', bookName, 'main.pdf');
      
      try {
        await fs.access(pdfPath);
        const parsedPDF = await pdfParser.parseFile(pdfPath);
        
        // Get chapters
        const chapters = pdfParser.splitIntoChapters(parsedPDF.content);
        
        return NextResponse.json({
          ...parsedPDF,
          bookName,
          chapters
        });
      } catch (error) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
    }
    
    // List available books
    const booksDir = path.join(process.cwd(), 'public/books');
    const books = [];
    
    try {
      const dirs = await fs.readdir(booksDir);
      
      for (const dir of dirs) {
        const mainPdfPath = path.join(booksDir, dir, 'main.pdf');
        try {
          await fs.access(mainPdfPath);
          books.push({
            id: dir,
            name: dir.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            path: `/books/${dir}/main.pdf`
          });
        } catch {
          // Skip directories without main.pdf
        }
      }
    } catch (error) {
      console.error('Error listing books:', error);
    }
    
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Failed to load PDFs' }, { status: 500 });
  }
}