import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const book = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        language: true,
        category: true,
        tags: true,
        readingLevel: true,
        pdfKey: true,
        coverImage: true,
        pageCount: true,
        viewCount: true,
        rating: true,
        createdAt: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.book.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}
