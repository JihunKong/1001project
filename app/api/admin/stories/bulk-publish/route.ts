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
    const { storyIds, publishAll = false } = body;

    let whereClause: any = {
      isPublished: false,
      fullPdf: { not: null } // Only publish stories with PDF files
    };

    // If specific story IDs provided, filter by them
    if (!publishAll && storyIds && Array.isArray(storyIds) && storyIds.length > 0) {
      whereClause.id = { in: storyIds };
    }

    // First, count how many stories will be affected
    const countToPublish = await prisma.story.count({ where: whereClause });

    if (countToPublish === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No unpublished stories found to publish',
        publishedCount: 0,
        stories: []
      });
    }

    // Execute bulk publish in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update stories
      const updatedStories = await tx.story.updateMany({
        where: whereClause,
        data: {
          isPublished: true,
          publishedDate: new Date(),
          updatedAt: new Date()
        }
      });

      // Get the updated stories for response
      const publishedStories = await tx.story.findMany({
        where: {
          ...whereClause,
          isPublished: true,
          publishedDate: { not: null }
        },
        select: {
          id: true,
          title: true,
          authorName: true,
          publishedDate: true,
          isPremium: true
        },
        orderBy: { publishedDate: 'desc' }
      });

      // Log the bulk publish action
      // Note: Only log if ActivityLog model supports these fields
      try {
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'BULK_PUBLISH_STORIES',
            entity: 'STORY',
            entityId: 'bulk-operation',
            metadata: {
              publishedCount: updatedStories.count,
              publishAll,
              storyIds: publishAll ? 'all-unpublished' : storyIds,
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
        publishedStories
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully published ${result.updatedCount} ${result.updatedCount === 1 ? 'story' : 'stories'}`,
      publishedCount: result.updatedCount,
      stories: result.publishedStories
    });

  } catch (error) {
    console.error('Error in bulk publish:', error);
    return NextResponse.json(
      { error: 'Internal server error during bulk publish operation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get publication statistics
    const [totalStories, publishedStories, unpublishedWithPdf, unpublishedWithoutPdf] = await Promise.all([
      prisma.story.count(),
      prisma.story.count({ where: { isPublished: true } }),
      prisma.story.count({ 
        where: { 
          isPublished: false, 
          fullPdf: { not: null } 
        } 
      }),
      prisma.story.count({ 
        where: { 
          isPublished: false, 
          fullPdf: null 
        } 
      })
    ]);

    // Get list of unpublished stories ready for publishing
    const unpublishedReady = await prisma.story.findMany({
      where: {
        isPublished: false,
        fullPdf: { not: null }
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        createdAt: true,
        isPremium: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      statistics: {
        totalStories,
        publishedStories,
        unpublishedWithPdf,
        unpublishedWithoutPdf,
        readyToPublish: unpublishedWithPdf
      },
      unpublishedStories: unpublishedReady
    });

  } catch (error) {
    console.error('Error fetching publication stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}