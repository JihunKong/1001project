import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params promise
    const resolvedParams = await params;
    
    // Join the path segments
    const filePath = resolvedParams.path.join('/');
    
    // Construct the full path to the PDF file
    const pdfPath = path.join(process.cwd(), 'public', 'books', filePath);
    
    // Security check - ensure the path is within the books directory
    const publicPdfDir = path.join(process.cwd(), 'public', 'books');
    const resolvedPath = path.resolve(pdfPath);
    const resolvedPublicDir = path.resolve(publicPdfDir);
    
    if (!resolvedPath.startsWith(resolvedPublicDir)) {
      return new NextResponse('Access denied', { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse('PDF not found', { status: 404 });
    }
    
    // Read the PDF file
    const fileBuffer = fs.readFileSync(resolvedPath);
    
    // Return the PDF with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}