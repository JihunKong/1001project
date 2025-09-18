import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/volunteer/submissions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer, teacher, or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['VOLUNTEER', 'TEACHER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {
      authorId: session.user.id
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.textSubmission.count({ where });

    // Get user's text submissions
    const submissions = await prisma.textSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        },
        publishedBook: {
          select: {
            id: true,
            viewCount: true
          }
        }
      }
    });

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: skip + limit < totalCount,
      limit
    };

    return NextResponse.json({
      submissions,
      pagination
    });

  } catch (error) {
    console.error('Error fetching volunteer submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST /api/volunteer/submissions
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer, teacher, or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['VOLUNTEER', 'TEACHER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validation schema
    const submissionSchema = z.object({
      title: z.string().min(1, 'Title is required').max(200),
      summary: z.string().min(1, 'Summary is required').max(500),
      contentMd: z.string().min(1, 'Content is required'),
      category: z.string().optional(),
      language: z.string().default('en'),
      ageRange: z.string().optional(),
      tags: z.array(z.string()).optional(),
      mode: z.enum(['SIMPLE', 'STANDARD']).default('SIMPLE'),
      classId: z.string().optional(),
      isDraft: z.boolean().default(false)
    });

    const validatedData = submissionSchema.parse(data);

    // Create text submission
    const submission = await prisma.textSubmission.create({
      data: {
        ...validatedData,
        authorId: session.user.id,
        status: validatedData.isDraft ? 'DRAFT' : 'PENDING',
        revisionNo: 1,
        submittedAt: validatedData.isDraft ? null : new Date(),
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      submission,
      message: validatedData.isDraft ? 'Draft saved successfully' : 'Story submitted successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating text submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}