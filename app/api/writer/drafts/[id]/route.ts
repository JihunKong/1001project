import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/writer/drafts/[id]
 * 
 * Returns a specific draft session
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;

    // Try to find by sessionId first, then by database id
    const draft = await prisma.draftSession.findFirst({
      where: {
        OR: [
          { sessionId: id, userId: userId },
          { id: id, userId: userId }
        ]
      }
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: draft.id,
        sessionId: draft.sessionId,
        title: draft.title,
        content: draft.content,
        lastSaved: draft.lastSaved.toISOString(),
        wordCount: draft.content.trim().split(/\s+/).filter(word => word.length > 0).length
      }
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/writer/drafts/[id]
 * 
 * Updates a specific draft session
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;
    const body = await request.json();
    
    const { title, content } = body;

    // Find the draft to update
    const existingDraft = await prisma.draftSession.findFirst({
      where: {
        OR: [
          { sessionId: id, userId: userId },
          { id: id, userId: userId }
        ]
      }
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Update the draft
    const updatedDraft = await prisma.draftSession.update({
      where: {
        id: existingDraft.id
      },
      data: {
        title: title !== undefined ? title : existingDraft.title,
        content: content !== undefined ? content : existingDraft.content,
        lastSaved: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDraft.id,
        sessionId: updatedDraft.sessionId,
        title: updatedDraft.title,
        content: updatedDraft.content,
        lastSaved: updatedDraft.lastSaved.toISOString()
      },
      message: 'Draft updated successfully'
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/writer/drafts/[id]
 * 
 * Deletes a specific draft session
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;

    // Find and delete the draft
    const draft = await prisma.draftSession.findFirst({
      where: {
        OR: [
          { sessionId: id, userId: userId },
          { id: id, userId: userId }
        ]
      }
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    await prisma.draftSession.delete({
      where: {
        id: draft.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}