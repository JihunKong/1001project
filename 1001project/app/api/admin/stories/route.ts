import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { adminApiLimiter } from '@/lib/rate-limiter';

// Input validation schemas
const storyQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().max(100).optional(), // Limit search length
  status: z.enum(['PUBLISHED', 'DRAFT']).optional(),
  isPublished: z.string().optional(), // 'true', 'false', or empty
  language: z.string().regex(/^[a-z]{2,5}$/).optional(), // Validate language format
  isPremium: z.string().optional(), // 'true', 'false', or empty
  featured: z.string().optional(), // 'true', 'false', or empty
  hasFullPdf: z.string().optional(), // 'true', 'false', or empty
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  authorName: z.string().max(100).optional(), // Author name filter
  category: z.string().max(100).optional(), // Category filter
  assignee: z.string().uuid().optional(), // Validate UUID format
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'isPublished', 'featured', 'authorName', 'publishedDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createStorySchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  summary: z.string().optional(),
  language: z.string().min(2).max(5),
  category: z.string().min(1),
  authorName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assigneeId: z.string().optional(),
});

// GET /api/admin/stories - List stories with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await adminApiLimiter.check(request, session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = storyQuerySchema.parse(Object.fromEntries(searchParams));
    
    const page = parseInt(validatedParams.page);
    const limit = parseInt(validatedParams.limit);
    const skip = (page - 1) * limit;

    // Build where clause with advanced filtering
    const where: any = {};
    
    // Text search across multiple fields
    if (validatedParams.search) {
      where.OR = [
        { title: { contains: validatedParams.search, mode: 'insensitive' } },
        { content: { contains: validatedParams.search, mode: 'insensitive' } },
        { authorName: { contains: validatedParams.search, mode: 'insensitive' } },
        { summary: { contains: validatedParams.search, mode: 'insensitive' } },
        { tags: { has: validatedParams.search } }, // Search in tags array
      ];
    }
    
    // Publication status filters
    if (validatedParams.status) {
      // Map submission statuses to Story fields (backward compatibility)
      if (validatedParams.status === 'PUBLISHED') {
        where.isPublished = true;
      } else if (validatedParams.status === 'DRAFT') {
        where.isPublished = false;
      }
    }
    
    // Direct publication status filter (new advanced filter)
    if (validatedParams.isPublished) {
      where.isPublished = validatedParams.isPublished === 'true';
    }
    
    // Language filter
    if (validatedParams.language) {
      where.language = validatedParams.language;
    }
    
    // Premium status filter
    if (validatedParams.isPremium) {
      where.isPremium = validatedParams.isPremium === 'true';
    }
    
    // Featured status filter
    if (validatedParams.featured) {
      where.featured = validatedParams.featured === 'true';
    }
    
    // PDF availability filter
    if (validatedParams.hasFullPdf) {
      if (validatedParams.hasFullPdf === 'true') {
        where.fullPdf = { not: null };
      } else {
        where.fullPdf = null;
      }
    }
    
    // Date range filters
    if (validatedParams.dateFrom || validatedParams.dateTo) {
      where.createdAt = {};
      if (validatedParams.dateFrom) {
        where.createdAt.gte = new Date(validatedParams.dateFrom);
      }
      if (validatedParams.dateTo) {
        // Add 1 day and subtract 1ms to include the entire end date
        const endDate = new Date(validatedParams.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setMilliseconds(endDate.getMilliseconds() - 1);
        where.createdAt.lte = endDate;
      }
    }
    
    // Author name filter
    if (validatedParams.authorName) {
      where.authorName = { contains: validatedParams.authorName, mode: 'insensitive' };
    }
    
    // Category filter (searches in category array)
    if (validatedParams.category) {
      where.category = { has: validatedParams.category };
    }
    
    // Assignee filter (for workflow management)
    if (validatedParams.assignee) {
      where.assigneeId = validatedParams.assignee;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Fetch stories with pagination (using Story table for published books)
    const [stories, totalCount] = await Promise.all([
      prisma.story.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.story.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      stories,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/stories - Create new story
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await adminApiLimiter.check(request, session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const validatedData = createStorySchema.parse(body);

    const story = await prisma.story.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        summary: validatedData.summary,
        language: validatedData.language,
        category: [validatedData.category],
        authorId: validatedData.assigneeId || session.user.id,
        authorName: validatedData.authorName || session.user.name || 'Unknown',
        tags: validatedData.tags || [],
        isPublished: false, // Start as draft
        featured: false,
        viewCount: 0,
        likeCount: 0,
        isPremium: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}