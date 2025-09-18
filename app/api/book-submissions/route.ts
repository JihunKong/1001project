import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BookSubmissionStatus } from '@prisma/client';

// GET: List book submissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as BookSubmissionStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Filter based on user role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If volunteer, only show their submissions or ones they can review
    if (user.role === 'VOLUNTEER') {
      where.OR = [
        { submittedById: user.id },
        { status: 'PENDING_REVIEW' },
        { reviewedById: user.id }
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.bookSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true }
          },
          reviewedBy: {
            select: { id: true, name: true, email: true }
          },
          coordinator: {
            select: { id: true, name: true, email: true }
          },
          admin: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.bookSubmission.count({ where })
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST: Submit a new book
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || !['VOLUNTEER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only volunteers and admins can submit books' },
        { status: 403 }
      );
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['title', 'authorName', 'format', 'filePath'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate format
    const validFormats = ['pdf', 'md', 'html', 'txt'];
    if (!validFormats.includes(data.format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf, md, html, or txt' },
        { status: 400 }
      );
    }

    const submission = await prisma.bookSubmission.create({
      data: {
        title: data.title,
        authorName: data.authorName,
        authorAge: data.authorAge,
        authorLocation: data.authorLocation,
        summary: data.summary,
        language: data.language || 'en',
        ageRange: data.ageRange,
        readingLevel: data.readingLevel,
        categories: data.categories || [],
        tags: data.tags || [],
        format: data.format,
        filePath: data.filePath,
        coverImagePath: data.coverImagePath,
        pageCount: data.pageCount,
        wordCount: data.wordCount,
        submittedById: user.id,
        status: 'DRAFT'
      }
    });

    // Auto-submit for review if requested
    if (data.submitForReview) {
      const updatedSubmission = await prisma.bookSubmission.update({
        where: { id: submission.id },
        data: { status: 'PENDING_REVIEW' }
      });
      return NextResponse.json(updatedSubmission, { status: 201 });
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}