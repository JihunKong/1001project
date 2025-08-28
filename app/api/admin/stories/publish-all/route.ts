import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    console.log(`🚀 Publishing ALL ready stories by admin: ${session.user.email}`);

    // Get current time for consistent publishing timestamp
    const publishDate = new Date();
    
    // Find all unpublished stories that have PDF files (ready to publish)
    const readyStories = await prisma.story.findMany({
      where: {
        isPublished: false,
        fullPdf: { not: null } // Must have PDF file
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        isPremium: true,
        fullPdf: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (readyStories.length === 0) {
      return NextResponse.json(
        { 
          message: 'No unpublished stories with PDF files found',
          publishedCount: 0
        },
        { status: 200 } // Not an error, just no work to do
      );
    }

    // Log which stories are being published
    console.log(`Found ${readyStories.length} stories ready for publication:`);
    readyStories.forEach((story, index) => {
      console.log(`  ${index + 1}. "${story.title}" by ${story.authorName} (${story.isPremium ? 'Premium' : 'Free'})`);
    });

    // Execute bulk update in transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Update all ready stories to published status
      const updateResult = await tx.story.updateMany({
        where: {
          id: { in: readyStories.map(s => s.id) }
        },
        data: {
          isPublished: true,
          publishedDate: publishDate,
          updatedAt: publishDate,
          // Auto-feature free books for better discovery
          featured: true // Business rule: newly published books are featured
        }
      });

      // Get updated total counts
      const totalPublished = await tx.story.count({
        where: { isPublished: true }
      });

      const totalUnpublished = await tx.story.count({
        where: { isPublished: false }
      });

      // Create bulk activity log entry
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'PUBLISH_ALL_READY_STORIES',
          entity: 'STORY',
          entityId: 'bulk_operation',
          metadata: {
            publishedCount: updateResult.count,
            publishedDate: publishDate.toISOString(),
            totalPublished,
            totalUnpublished,
            publishedStories: readyStories.map(s => ({
              id: s.id,
              title: s.title,
              authorName: s.authorName,
              isPremium: s.isPremium
            }))
          }
        }
      });

      // Create individual log entries for each story (for detailed tracking)
      await Promise.all(
        readyStories.map(story =>
          tx.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'PUBLISH_STORY_BULK_ALL',
              entity: 'STORY',
              entityId: story.id,
              metadata: {
                storyTitle: story.title,
                authorName: story.authorName,
                publishedDate: publishDate.toISOString(),
                isPremium: story.isPremium,
                bulkOperation: true
              }
            }
          })
        )
      );

      return {
        publishedCount: updateResult.count,
        totalPublished,
        totalUnpublished,
        publishedStories: readyStories
      };
    });

    console.log(`✅ PUBLISH ALL COMPLETED: Published ${result.publishedCount} stories`);
    console.log(`📚 Library now contains ${result.totalPublished} published books`);
    console.log(`📊 Remaining unpublished: ${result.totalUnpublished}`);

    // Categorize published stories for response
    const freeStories = result.publishedStories.filter(s => !s.isPremium);
    const premiumStories = result.publishedStories.filter(s => s.isPremium);

    // Return comprehensive success response
    return NextResponse.json({
      success: true,
      message: `Successfully published ${result.publishedCount} stories! Library now shows ${result.totalPublished} books.`,
      publishedCount: result.publishedCount,
      totalPublished: result.totalPublished,
      totalUnpublished: result.totalUnpublished,
      breakdown: {
        free: freeStories.length,
        premium: premiumStories.length
      },
      publishedStories: {
        all: result.publishedStories.map(s => ({
          id: s.id,
          title: s.title,
          authorName: s.authorName,
          isPremium: s.isPremium
        })),
        free: freeStories.map(s => s.title),
        premium: premiumStories.map(s => s.title)
      },
      publishedAt: publishDate.toISOString(),
      nextSteps: [
        'Verify library displays all books at /library',
        'Check user access to newly published content',
        'Review publication dates if needed',
        'Test story edit pages for functionality'
      ]
    });

  } catch (error) {
    console.error('❌ Publish all error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to publish all ready stories',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}