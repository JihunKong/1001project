import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, StorySubmissionStatus, Priority } from '@prisma/client';
import { z } from 'zod';

const updateStorySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
  category: z.string().min(1).optional(),
  ageGroup: z.string().min(1).optional(),
  status: z.nativeEnum(StorySubmissionStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  reviewNotes: z.string().optional(),
  editorialNotes: z.string().optional(),
  coverImageId: z.string().nullable().optional(),
});

// GET /api/admin/stories/[id] - Get single story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const story = await prisma.storySubmission.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        coverImage: true,
        workflowHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/stories/[id] - Update story
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStorySchema.parse(body);

    // Get current story to check for status changes
    const currentStory = await prisma.storySubmission.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentStory) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }

    // Update story
    const updatedStory = await prisma.storySubmission.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        coverImage: true,
      },
    });

    // Create workflow history entry if status changed
    if (validatedData.status && validatedData.status !== currentStory.status) {
      await prisma.workflowHistory.create({
        data: {
          storySubmissionId: id,
          fromStatus: currentStory.status,
          toStatus: validatedData.status,
          comment: validatedData.reviewNotes || `Status changed to ${validatedData.status}`,
          performedById: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error('Error updating story:', error);
    
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

// DELETE /api/admin/stories/[id] - Soft delete story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if story exists
    const story = await prisma.storySubmission.findUnique({
      where: { id },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Soft delete by updating status to REJECTED (or create a DELETED status)
    await prisma.storySubmission.update({
      where: { id },
      data: {
        status: StorySubmissionStatus.REJECTED,
        reviewNotes: 'Story deleted by admin',
      },
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        storySubmissionId: id,
        fromStatus: story.status,
        toStatus: StorySubmissionStatus.REJECTED,
        comment: 'Story deleted by admin',
        performedById: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}