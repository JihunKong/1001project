import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storyIds, unpublishAll = false } = body;

    let whereClause: any = {
      isPublished: true
    };

    // If specific story IDs provided, filter by them
    if (!unpublishAll && storyIds && Array.isArray(storyIds) && storyIds.length > 0) {
      whereClause.id = { in: storyIds };
    }

    // First, count how many stories will be affected
    const countToUnpublish = await prisma.story.count({ where: whereClause });

    if (countToUnpublish === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No published stories found to unpublish',
        unpublishedCount: 0,
        stories: []
      });
    }

    // Execute bulk unpublish in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the stories before unpublishing for response
      const storiesToUnpublish = await tx.story.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          authorName: true,
          publishedDate: true,
          isPremium: true
        },
        orderBy: { publishedDate: 'desc' }
      });

      // Update stories
      const updatedStories = await tx.story.updateMany({
        where: whereClause,
        data: {
          isPublished: false,
          publishedDate: null,
          updatedAt: new Date()
        }
      });

      // Log the bulk unpublish action
      // Note: Only log if ActivityLog model supports these fields
      try {
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'BULK_UNPUBLISH_STORIES',
            entity: 'STORY',
            entityId: 'bulk-operation',
            metadata: {
              unpublishedCount: updatedStories.count,
              unpublishAll,
              storyIds: unpublishAll ? 'all-published' : storyIds,
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (e) {
        // Ignore logging errors, don't fail the main operation
        console.log('ActivityLog creation failed, continuing without logging');
      }

      return {
        updatedCount: updatedStories.count,
        unpublishedStories: storiesToUnpublish
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully unpublished ${result.updatedCount} ${result.updatedCount === 1 ? 'story' : 'stories'}`,
      unpublishedCount: result.updatedCount,
      stories: result.unpublishedStories
    });

  } catch (error) {
    console.error('Error in bulk unpublish:', error);
    return NextResponse.json(
      { error: 'Internal server error during bulk unpublish operation' },
      { status: 500 }
    );
  }
}