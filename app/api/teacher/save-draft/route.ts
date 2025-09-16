import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, StorySubmissionStatus } from '@prisma/client';
import { z } from 'zod';

const saveDraftSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  summary: z.string().max(1000).optional(),
  language: z.string().max(5).optional(),
  category: z.string().max(50).optional(),
  ageGroup: z.string().max(20).optional(),
  tags: z.string().max(200).optional(),
  studentName: z.string().max(100).optional(),
  source: z.literal('classroom').optional(),
});

// POST: Save a draft story submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only teachers can save drafts through this endpoint
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: 'Only teachers can save drafts through this endpoint' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = saveDraftSchema.parse(body);

    // Check if there's already a draft for this teacher
    const existingDraft = await prisma.storySubmission.findFirst({
      where: {
        authorId: session.user.id,
        status: StorySubmissionStatus.DRAFT,
        editorialNotes: {
          contains: '"source":"classroom"',
        }
      }
    });

    // Process tags
    const tagsArray = validatedData.tags 
      ? validatedData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    let draft;

    if (existingDraft) {
      // Update existing draft
      draft = await prisma.storySubmission.update({
        where: { id: existingDraft.id },
        data: {
          title: validatedData.title || existingDraft.title,
          content: validatedData.content || existingDraft.content,
          summary: validatedData.summary || existingDraft.summary,
          language: validatedData.language || existingDraft.language,
          category: validatedData.category || existingDraft.category,
          ageGroup: validatedData.ageGroup || existingDraft.ageGroup,
          tags: tagsArray.length > 0 ? tagsArray : existingDraft.tags,
          editorialNotes: JSON.stringify({
            source: 'classroom',
            teacherId: session.user.id,
            teacherName: session.user.name,
            studentName: validatedData.studentName,
            lastSaved: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new draft
      draft = await prisma.storySubmission.create({
        data: {
          title: validatedData.title || 'Untitled Draft',
          content: validatedData.content || '',
          summary: validatedData.summary || '',
          language: validatedData.language || 'en',
          category: validatedData.category || 'Classroom Story',
          ageGroup: validatedData.ageGroup || 'Not Specified',
          status: StorySubmissionStatus.DRAFT,
          tags: tagsArray,
          authorId: session.user.id,
          editorialNotes: JSON.stringify({
            source: 'classroom',
            teacherId: session.user.id,
            teacherName: session.user.name,
            studentName: validatedData.studentName,
            lastSaved: new Date().toISOString(),
          }),
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      draftId: draft.id,
      lastSaved: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid draft data', 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save draft. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: Get teacher's draft
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only teachers can access this endpoint
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get the teacher's draft
    const draft = await prisma.storySubmission.findFirst({
      where: {
        authorId: session.user.id,
        status: StorySubmissionStatus.DRAFT,
        editorialNotes: {
          contains: '"source":"classroom"',
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!draft) {
      return NextResponse.json({
        success: true,
        draft: null,
      });
    }

    const metadata = draft.editorialNotes 
      ? JSON.parse(draft.editorialNotes) 
      : {};

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        title: draft.title,
        content: draft.content,
        summary: draft.summary,
        language: draft.language,
        category: draft.category,
        ageGroup: draft.ageGroup,
        tags: draft.tags.join(', '),
        studentName: metadata.studentName || '',
        lastSaved: metadata.lastSaved || draft.updatedAt.toISOString(),
        updatedAt: draft.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error fetching draft:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}