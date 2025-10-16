import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, VolunteerSubmissionType, ContentVisibility } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for submission creation
const SubmissionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  authorAlias: z.string()
    .min(1, 'Author alias is required')
    .max(100, 'Author alias must be less than 100 characters')
    .trim(),
  textContent: z.string()
    .min(100, 'Story content must be at least 100 characters')
    .max(50000, 'Story content must be less than 50,000 characters'),
  summary: z.string()
    .min(50, 'Summary must be at least 50 characters')
    .max(1000, 'Summary must be less than 1000 characters')
    .trim(),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code must be less than 5 characters')
    .default('en'),
  ageRange: z.string()
    .max(50, 'Age range must be less than 50 characters')
    .optional(),
  category: z.array(z.string().max(50))
    .max(5, 'Maximum 5 categories allowed')
    .default([]),
  tags: z.array(z.string().max(30))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
  visibility: z.enum(['PUBLIC', 'RESTRICTED'])
    .default('PUBLIC'),
  targetAudience: z.string()
    .max(200, 'Target audience must be less than 200 characters')
    .optional(),
  licenseType: z.string()
    .max(50, 'License type must be less than 50 characters')
    .optional(),
});

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer
    if (session.user.role !== UserRole.WRITER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    // Get volunteer submissions (safely handle missing tables)
    const textSubmissions: any[] = [];
    let legacySubmissions: any[] = [];

    // Note: textSubmission model not available in current schema
    // Will be added in future publishing workflow update

    try {
      // Try to get legacy volunteer submissions
      legacySubmissions = await prisma.volunteerSubmission.findMany({
        where: {
          volunteerId: userId,
          volunteer: {
            id: userId
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          authorAlias: true,
          type: true,
          status: true,
          language: true,
          ageRange: true,
          category: true,
          tags: true,
          summary: true,
          visibility: true,
          textContent: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.warn('VolunteerSubmission table not found, skipping', {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }

    // Combine and normalize submissions
    const submissions = [
      ...textSubmissions.map(submission => ({
        id: submission.id,
        title: submission.title,
        authorAlias: submission.authorAlias,
        type: 'TEXT_STORY',
        status: submission.status,
        language: submission.language,
        ageRange: submission.ageRange,
        category: submission.category || [],
        tags: submission.tags || [],
        summary: submission.summary,
        wordCount: submission.wordCount,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        submissionType: 'text' as const,
      })),
      ...legacySubmissions.map(submission => ({
        id: submission.id,
        title: submission.title,
        authorAlias: submission.authorAlias,
        type: submission.type,
        status: submission.status,
        language: submission.language,
        ageRange: submission.ageRange,
        category: submission.category || [],
        tags: submission.tags || [],
        summary: submission.summary,
        visibility: submission.visibility,
        textContent: submission.textContent,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        submissionType: 'legacy' as const,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ submissions });
  } catch (error) {
    logger.error('Error fetching volunteer submissions', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer
    if (session.user.role !== UserRole.WRITER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = SubmissionSchema.parse(body);
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

    // Create new text submission with validated data
    const submission = await prisma.volunteerSubmission.create({
      data: {
        volunteerId: userId,
        type: VolunteerSubmissionType.TEXT_STORY,
        title: validatedData.title,
        authorAlias: validatedData.authorAlias,
        textContent: validatedData.textContent,
        language: validatedData.language,
        ageRange: validatedData.ageRange || null,
        category: validatedData.category,
        tags: validatedData.tags,
        summary: validatedData.summary,
        visibility: validatedData.visibility as ContentVisibility,
        targetAudience: validatedData.targetAudience || null,
        licenseType: validatedData.licenseType || null,
        copyrightConfirmed: true,
        portraitRightsConfirmed: true,
        originalWork: true,
      },
      select: {
        id: true,
        title: true,
        authorAlias: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Text submission created successfully',
      submission
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating volunteer submission', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}