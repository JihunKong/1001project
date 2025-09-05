import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, Priority } from '@prisma/client';
import { z } from 'zod';

const updateStorySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
  category: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  authorName: z.string().optional(),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().optional(),
  coverImage: z.string().nullable().optional(),
  fullPdf: z.string().nullable().optional(),
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
    
    const story = await prisma.story.findUnique({
      where: { id },
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

    // Get current story to verify it exists
    const currentStory = await prisma.story.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!currentStory) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Update story
    const updatedStory = await prisma.story.update({
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
      },
    });

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
    const story = await prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Hard delete the story (since this is published content)
    await prisma.story.delete({
      where: { id },
    });

    // Log the deletion
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'DELETE_STORY',
          entity: 'STORY',
          entityId: id,
          metadata: {
            title: story.title,
            authorName: story.authorName,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    } catch (e) {
      console.log('ActivityLog creation failed, continuing without logging');
    }

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}