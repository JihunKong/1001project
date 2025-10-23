import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TextSubmissionStatus, UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { validateSubmission } from '@/lib/validation/submission.schema';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { notifyNewSubmission } from '@/lib/sse-notifications';
import { logger } from '@/lib/logger';

// Initialize DOMPurify for server-side HTML sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Shared sanitization configuration for security consistency
const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true
};

// Helper function to normalize author alias with fallbacks
const normalizeAuthorAlias = (alias: string | null | undefined, session: any): string => {
  // Remove HTML/scripts and trim using consistent sanitization
  const sanitized = purify.sanitize(alias?.trim() || '', { ALLOWED_TAGS: [] }).trim();

  // If empty, use session name as fallback
  if (!sanitized) {
    return session.user.name?.trim() || 'Anonymous Author';
  }

  // Ensure length limit
  return sanitized.substring(0, 100);
};

// Helper function to map Prisma errors to user-friendly messages (sanitized for security)
const mapPrismaError = (error: unknown): { status: number; message: string } => {
  if (!(error instanceof PrismaClientKnownRequestError)) {
    logger.error('Non-Prisma error in submission', error);
    return { status: 500, message: 'Something went wrong while saving your story. Please try again.' };
  }

  const requestId = crypto.randomUUID();
  logger.error('Prisma error in submission', error, {
    requestId,
    code: error.code,
    meta: error.meta
  });

  switch (error.code) {
    case 'P2002':
      return {
        status: 409,
        message: 'A story with similar information already exists. Please make some changes and try again.'
      };
    case 'P2011':
      return {
        status: 400,
        message: 'Please fill in all required fields before submitting your story.'
      };
    case 'P2000':
      return {
        status: 400,
        message: 'Some of your text is too long. Please make it shorter and try again.'
      };
    case 'P2003':
      return {
        status: 400,
        message: 'There was a problem with your submission. Please try logging in again.'
      };
    case 'P2025':
      return {
        status: 404,
        message: 'We couldn\'t find the story you\'re trying to update.'
      };
    default:
      return {
        status: 500,
        message: 'We encountered an unexpected problem. Please try again or contact support if this continues.'
      };
  }
};

// GET /api/text-submissions - List submissions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusParam = searchParams.get('status');

    // Validate status parameter is a valid enum value
    const validStatuses = Object.values(TextSubmissionStatus);
    const status = (statusParam && statusParam !== 'all' && validStatuses.includes(statusParam as TextSubmissionStatus))
      ? statusParam as TextSubmissionStatus
      : null;

    const authorId = searchParams.get('authorId');

    const skip = (page - 1) * limit;

    // Build filter based on user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where: any = {};

    // Role-based filtering for text submissions
    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.CONTENT_ADMIN:
        // Can see all submissions
        if (authorId) where.authorId = authorId;
        // Apply status filter if provided
        if (status) where.status = status;
        break;

      case UserRole.STORY_MANAGER:
        // Can see submissions ready for story review
        const storyManagerStatuses: TextSubmissionStatus[] = [TextSubmissionStatus.PENDING, TextSubmissionStatus.STORY_REVIEW];
        if (status && (storyManagerStatuses as TextSubmissionStatus[]).includes(status)) {
          // Filter by specific status within allowed range
          where.status = status;
        } else {
          // Show all submissions in their scope
          where.status = { in: storyManagerStatuses };
        }
        break;

      case UserRole.BOOK_MANAGER:
        // Can see submissions ready for format review
        const bookManagerStatuses: TextSubmissionStatus[] = [TextSubmissionStatus.STORY_APPROVED, TextSubmissionStatus.FORMAT_REVIEW];
        if (status && (bookManagerStatuses as TextSubmissionStatus[]).includes(status)) {
          // Filter by specific status within allowed range
          where.status = status;
        } else {
          // Show all submissions in their scope
          where.status = { in: bookManagerStatuses };
        }
        break;

      default:
        // Regular users can only see their own submissions
        where.authorId = user.id;
        // Apply status filter if provided
        if (status) where.status = status;
        break;
    }

    const submissions = await prisma.textSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        storyManager: {
          select: { id: true, name: true, email: true }
        },
        bookManager: {
          select: { id: true, name: true, email: true }
        },
        contentAdmin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const total = await prisma.textSubmission.count({ where });

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    const mappedError = mapPrismaError(error);
    return NextResponse.json(
      { error: mappedError.message },
      { status: mappedError.status }
    );
  }
}

// POST /api/text-submissions - Create new submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input using shared schema (Critical Security Fix)
    const validation = validateSubmission(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Please check your submission and fix any errors',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data!;

    // Sanitize HTML content with consistent configuration
    const sanitizedContent = purify.sanitize(validatedData.content, SANITIZATION_CONFIG);

    // Sanitized content ready for storage

    // Normalize author alias with fallbacks
    const normalizedAuthorAlias = normalizeAuthorAlias(validatedData.authorAlias, session);

    // Calculate word count
    const textContent = sanitizedContent.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

    // Create text submission using validated data
    const submission = await prisma.textSubmission.create({
      data: {
        authorId: session.user.id,
        title: validatedData.title,
        content: sanitizedContent,
        summary: validatedData.summary ?? null,
        language: validatedData.language,
        authorAlias: normalizedAuthorAlias,
        ageRange: validatedData.ageRange ?? null,
        category: validatedData.category,
        tags: validatedData.tags,
        wordCount: wordCount,
        readingLevel: validatedData.readingLevel ?? null,
        copyrightConfirmed: validatedData.copyrightConfirmed ?? false,
        originalWork: validatedData.originalWork ?? true,
        licenseType: validatedData.licenseType ?? null,
        status: TextSubmissionStatus.DRAFT
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send real-time notification for new submission
    try {
      await notifyNewSubmission(submission.id);
    } catch (notificationError) {
      logger.error('Error sending new submission notification', notificationError, {
        submissionId: submission.id
      });
    }

    return NextResponse.json({ submission }, { status: 201 });

  } catch (error) {
    const mappedError = mapPrismaError(error);

    const session = await getServerSession(authOptions);
    logger.error('Text submission creation failed', error, {
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: mappedError.message,
        meta: {
          storageModel: 'TextSubmission',
          apiVersion: '2.0'
        }
      },
      { status: mappedError.status }
    );
  }
}