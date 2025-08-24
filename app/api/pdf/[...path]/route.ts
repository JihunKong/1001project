import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    
    // Check if this is a book access request
    const pathSegments = resolvedParams.path;
    if (pathSegments.length >= 2 && pathSegments[0] === 'books') {
      const bookId = pathSegments[1];
      const filename = pathSegments[2] || 'main.pdf';
      
      // Get user session first
      const session = await getServerSession(authOptions);
      
      // Get the book details to check if it's premium
      const book = await prisma.story.findFirst({
        where: {
          id: bookId,
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          isPremium: true
        }
      });
      
      if (!book) {
        return new NextResponse(JSON.stringify({
          error: 'Book not found',
          message: 'The requested book does not exist or is not published.',
          requiresAuth: !session?.user?.id,
          redirectTo: !session?.user?.id ? '/login' : '/library'
        }), { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Admin users have access to all books
      if (session?.user?.role === 'ADMIN') {
        // Allow admin access - continue to serve the file
      }
      // If the book is premium, check user access
      else if (book.isPremium) {
        let hasAccess = false;
        
        if (session?.user?.id) {
          // Check subscription
          const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
            select: {
              status: true,
              canAccessPremium: true
            }
          });
          
          if (subscription?.canAccessPremium && subscription.status === 'ACTIVE') {
            hasAccess = true;
          }
          
          // For now, individual purchases are handled via subscription
          // TODO: Implement individual book purchase checking when product-story linking is available
        }
        
        // Free books (preview books 1-3) are accessible to everyone when logged in
        const freeBooks = ['neema-01', 'neema-02', 'neema-03'];
        if (!freeBooks.includes(bookId) && !hasAccess) {
          return new NextResponse(JSON.stringify({
            error: 'Premium content access required',
            message: 'This book requires a subscription or purchase to access. You can preview the first few pages or purchase full access.',
            bookId: bookId,
            isPremium: true,
            requiresAuth: !session?.user?.id,
            redirectTo: !session?.user?.id ? '/login' : '/shop',
            purchaseUrl: `/shop/books/${bookId}`,
            subscriptionUrl: '/shop/subscription'
          }), { 
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }
      // For free books, require authentication but allow access
      else if (!session?.user?.id) {
        return new NextResponse(JSON.stringify({
          error: 'Authentication required',
          message: 'Please sign in to access this content.',
          bookId: bookId,
          isPremium: false,
          requiresAuth: true,
          redirectTo: '/login'
        }), { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
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