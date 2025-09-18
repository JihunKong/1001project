import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/writer/drafts
 * 
 * Returns draft sessions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's draft sessions
    const drafts = await prisma.draftSession.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        lastSaved: 'desc'
      }
    });

    // Also get user's story submissions with DRAFT status
    const draftSubmissions = await prisma.storySubmission.findMany({
      where: {
        authorId: userId,
        status: 'DRAFT'
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        ageGroup: true,
        language: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: drafts.map(draft => ({
          id: draft.id,
          sessionId: draft.sessionId,
          title: draft.title,
          content: draft.content,
          lastSaved: draft.lastSaved.toISOString(),
          wordCount: draft.content.trim().split(/\s+/).filter(word => word.length > 0).length
        })),
        submissions: draftSubmissions.map(submission => ({
          id: submission.id,
          title: submission.title,
          content: submission.content,
          category: submission.category,
          ageGroup: submission.ageGroup,
          language: submission.language,
          createdAt: submission.createdAt.toISOString(),
          updatedAt: submission.updatedAt.toISOString(),
          wordCount: submission.content.trim().split(/\s+/).filter(word => word.length > 0).length
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch drafts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/writer/drafts
 * 
 * Creates or updates a draft session (auto-save functionality)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const { sessionId, title, content } = body;

    if (!content && !title) {
      return NextResponse.json(
        { error: 'Title or content is required' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || uuidv4();

    // Upsert draft session
    const draft = await prisma.draftSession.upsert({
      where: {
        sessionId: finalSessionId
      },
      update: {
        title: title || null,
        content: content || '',
        lastSaved: new Date()
      },
      create: {
        userId: userId,
        sessionId: finalSessionId,
        title: title || null,
        content: content || '',
        lastSaved: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: draft.id,
        sessionId: draft.sessionId,
        title: draft.title,
        content: draft.content,
        lastSaved: draft.lastSaved.toISOString()
      },
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}