import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window === 'undefined') {
  // Server-side configuration
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, pdfUrl }: { bookId: string; pdfUrl?: string } = body;

    if (!bookId || !pdfUrl) {
      return NextResponse.json(
        { error: 'Book ID and PDF URL are required' }, 
        { status: 400 }
      );
    }

    // Fetch the PDF file
    let pdfBuffer: ArrayBuffer;
    
    try {
      if (pdfUrl.startsWith('http')) {
        // External URL
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
        }
        pdfBuffer = await pdfResponse.arrayBuffer();
      } else {
        // Internal path - construct full URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const fullUrl = pdfUrl.startsWith('/') ? `${baseUrl}${pdfUrl}` : `${baseUrl}/${pdfUrl}`;
        
        const pdfResponse = await fetch(fullUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
        }
        pdfBuffer = await pdfResponse.arrayBuffer();
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
      return NextResponse.json(
        { error: 'Failed to fetch PDF file' }, 
        { status: 404 }
      );
    }

    // Extract text from PDF
    try {
      const pdfDocument = await pdfjs.getDocument({ 
        data: pdfBuffer,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
      }).promise;

      const numPages = pdfDocument.numPages;
      let fullText = '';

      // Limit to first 20 pages for performance
      const pagesToProcess = Math.min(numPages, 20);

      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (pageText) {
            fullText += pageText + '\n\n';
          }
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          // Continue with next page
        }
      }

      // Clean up the text
      const cleanedText = fullText
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
        .replace(/\s+/g, ' ') // Replace multiple spaces
        .trim();

      if (cleanedText.length < 50) {
        return NextResponse.json({
          text: 'This PDF appears to contain mostly images or non-text content. Text extraction may not work well with this type of document.',
          pageCount: numPages,
          extractedPages: pagesToProcess
        });
      }

      return NextResponse.json({
        text: cleanedText,
        pageCount: numPages,
        extractedPages: pagesToProcess,
        textLength: cleanedText.length
      });

    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      
      if (pdfError instanceof Error) {
        if (pdfError.message.includes('Invalid PDF')) {
          return NextResponse.json(
            { error: 'Invalid or corrupted PDF file' }, 
            { status: 400 }
          );
        }
        if (pdfError.message.includes('password')) {
          return NextResponse.json(
            { error: 'PDF is password protected' }, 
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to extract text from PDF' }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Text extraction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}