import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, BookContentType, BookVisibility } from '@prisma/client';
import { z } from 'zod';
import {
  checkRateLimit,
  validateQueryParams,
  buildSecureSearchQuery,
  RATE_LIMITS
} from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Validation schema for book creation
const CreateBookSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  subtitle: z.string()
    .max(200, 'Subtitle must be less than 200 characters')
    .trim()
    .optional(),
  summary: z.string()
    .min(50, 'Summary must be at least 50 characters')
    .max(2000, 'Summary must be less than 2000 characters')
    .trim()
    .optional(),
  content: z.string()
    .min(100, 'Content must be at least 100 characters')
    .max(100000, 'Content must be less than 100,000 characters')
    .optional(),
  contentType: z.enum(['TEXT', 'PDF', 'EPUB', 'AUDIO', 'MULTIMEDIA', 'INTERACTIVE'])
    .default('TEXT'),
  authorName: z.string()
    .min(1, 'Author name is required')
    .max(100, 'Author name must be less than 100 characters')
    .trim(),
  authorAlias: z.string()
    .max(100, 'Author alias must be less than 100 characters')
    .trim()
    .optional(),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code must be less than 5 characters')
    .default('en'),
  ageRange: z.string()
    .max(50, 'Age range must be less than 50 characters')
    .optional(),
  readingLevel: z.string()
    .max(50, 'Reading level must be less than 50 characters')
    .optional(),
  category: z.array(z.string().max(50))
    .max(5, 'Maximum 5 categories allowed')
    .default([]),
  genres: z.array(z.string().max(50))
    .max(5, 'Maximum 5 genres allowed')
    .default([]),
  tags: z.array(z.string().max(30))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
  visibility: z.enum(['PUBLIC', 'RESTRICTED', 'CLASSROOM', 'PRIVATE'])
    .default('PUBLIC'),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).optional(),
});

// GET /api/books - List books with filters
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.SEARCH_API);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.SEARCH_API.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);

    // Validate and sanitize query parameters
    const rawParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      language: searchParams.get('language'),
      category: searchParams.get('category'),
      educationalCategory: searchParams.get('educationalCategory'),
      country: searchParams.get('country'),
      ageRange: searchParams.get('ageRange'),
      minDifficulty: searchParams.get('minDifficulty'),
      maxDifficulty: searchParams.get('maxDifficulty'),
      vocabularyLevel: searchParams.get('vocabularyLevel'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      published: searchParams.get('published'),
      premium: searchParams.get('premium')
    };

    const params = validateQueryParams(rawParams);

    // Set defaults for validated parameters
    const page = (params.page as number) || 1;
    const limit = Math.min((params.limit as number) || 20, 100);
    const search = (params.search as string) || '';
    const language = (params.language as string) || '';
    const category = (params.category as string) || '';
    const educationalCategory = (params.educationalCategory as string) || '';
    const country = (params.country as string) || '';
    const ageRange = (params.ageRange as string) || '';
    const minDifficulty = params.minDifficulty as number | undefined;
    const maxDifficulty = params.maxDifficulty as number | undefined;
    const vocabularyLevel = (params.vocabularyLevel as string) || '';
    const sortBy = (params.sortBy as string) || 'createdAt';
    const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc';
    const isPublished = params.published as boolean;
    const isPremium = params.premium as boolean;

    // Get session for personalized results
    const session = await getServerSession(authOptions);

    // Build where clause
    const where: any = {};

    // Base visibility filters with Progressive Library Access
    if (!session?.user) {
      // Public users see only published, public books
      where.isPublished = true;
      where.visibility = 'PUBLIC';
    } else if (session.user.role === 'LEARNER') {
      // PROGRESSIVE ACCESS: Students see only assigned books + public books
      const enrolledClasses = await prisma.classEnrollment.findMany({
        where: {
          studentId: session.user.id,
          status: 'ACTIVE'
        },
        select: { classId: true }
      });

      const classIds = enrolledClasses.map(e => e.classId);

      if (classIds.length > 0) {
        // Get books assigned to student's classes
        const assignedBooks = await prisma.assignment.findMany({
          where: {
            classId: { in: classIds },
            resources: { isEmpty: false } // Books referenced in resources
          },
          select: { resources: true }
        });

        // Extract book IDs from assignment resources
        const assignedBookIds: string[] = [];
        assignedBooks.forEach(assignment => {
          if (Array.isArray(assignment.resources)) {
            assignment.resources.forEach(resource => {
              // Assuming resources contain book IDs (format: "book:bookId")
              if (typeof resource === 'string' && resource.startsWith('book:')) {
                assignedBookIds.push(resource.replace('book:', ''));
              }
            });
          }
        });

        // Students can access: PUBLIC books OR books assigned to their classes
        where.isPublished = true;
        where.OR = [
          { visibility: 'PUBLIC' },
          {
            id: { in: assignedBookIds },
            visibility: { in: ['PUBLIC', 'CLASSROOM'] }
          }
        ];
      } else {
        // No enrolled classes, only public books
        where.isPublished = true;
        where.visibility = 'PUBLIC';
      }
    } else if (session.user.role === 'TEACHER' || session.user.role === 'INSTITUTION') {
      // Teachers see published books (PUBLIC, RESTRICTED, CLASSROOM) and their own drafts
      where.OR = [
        { isPublished: true, visibility: { in: ['PUBLIC', 'RESTRICTED', 'CLASSROOM'] } },
        { authorId: session.user.id }
      ];
    } else if (session.user.role === 'WRITER') {
      // Writers see published books (PUBLIC, RESTRICTED) and their own drafts
      where.OR = [
        { isPublished: true, visibility: { in: ['PUBLIC', 'RESTRICTED'] } },
        { authorId: session.user.id }
      ];
    } else if (session.user.role === 'STORY_MANAGER' || session.user.role === 'BOOK_MANAGER' || session.user.role === 'CONTENT_ADMIN') {
      // Content managers see all published books (including RESTRICTED) and their own drafts
      where.OR = [
        { isPublished: true, visibility: { in: ['PUBLIC', 'RESTRICTED', 'CLASSROOM'] } },
        { authorId: session.user.id }
      ];
    }
    // ADMIN users see all books (no additional filters)

    // Filter out deleted books for all roles (including ADMIN)
    where.NOT = {
      title: { startsWith: '[DELETED]' }
    };

    // Apply secure search filter
    if (search) {
      const searchQuery = buildSecureSearchQuery(search);
      if (searchQuery.OR) {
        where.OR = [
          ...(where.OR || []),
          ...searchQuery.OR
        ];
      }
    }

    if (language) {
      where.language = language;
    }

    if (category) {
      where.category = { has: category };
    }

    if (educationalCategory) {
      where.educationalCategories = { has: educationalCategory };
    }

    if (country) {
      where.country = country;
    }

    if (ageRange) {
      where.ageRange = ageRange;
    }

    if (minDifficulty !== undefined || maxDifficulty !== undefined) {
      where.difficultyScore = {};
      if (minDifficulty !== undefined) {
        where.difficultyScore.gte = minDifficulty;
      }
      if (maxDifficulty !== undefined) {
        where.difficultyScore.lte = maxDifficulty;
      }
    }

    if (vocabularyLevel) {
      // Filter by vocabulary distribution (Basic, Intermediate, Advanced)
      // Check if the specified level has >50% distribution
      where.vocabularyDistribution = {
        path: [vocabularyLevel],
        gte: 50
      };
    }

    if (isPublished) {
      where.isPublished = true;
    }

    if (isPremium) {
      where.isPremium = true;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get books with pagination
    const [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          subtitle: true,
          summary: true,
          contentType: true,
          authorName: true,
          authorAlias: true,
          illustratorName: true,
          editorName: true,
          country: true,
          language: true,
          ageRange: true,
          readingLevel: true,
          readingTime: true,
          category: true,
          genres: true,
          tags: true,
          educationalCategories: true,
          difficultyScore: true,
          vocabularyDistribution: true,
          coverImage: true,
          visibility: true,
          isPremium: true,
          isPublished: true,
          featured: true,
          price: true,
          currency: true,
          viewCount: true,
          likeCount: true,
          rating: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          // Include author info if available
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            }
          }
        }
      }),
      prisma.book.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Create response with rate limit headers
    const response = NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        language,
        category,
        educationalCategory,
        country,
        ageRange,
        minDifficulty,
        maxDifficulty,
        vocabularyLevel,
        sortBy,
        sortOrder,
        published: isPublished,
        premium: isPremium
      }
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.SEARCH_API.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return response;

  } catch (error) {
    logger.error('Error fetching books', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/books - Create new book
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can create books
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.WRITER, UserRole.TEACHER];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = CreateBookSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Create book
    // Filter out undefined values for Prisma compatibility
    const createData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const book = await prisma.book.create({
      data: {
        // Required fields
        title: validatedData.title,
        authorName: validatedData.authorName,
        contentType: validatedData.contentType as BookContentType,
        visibility: validatedData.visibility as BookVisibility,
        authorId: session.user.id,
        isPublished: false, // Books start as drafts
        // Optional fields (filtered)
        ...createData,
        ...(validatedData.price && { currency: 'USD' }),
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        contentType: true,
        authorName: true,
        visibility: true,
        isPremium: true,
        isPublished: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      message: 'Book created successfully',
      book
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating book', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}