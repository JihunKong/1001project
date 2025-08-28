import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const bulkActionSchema = z.object({
  action: z.enum(['categorize', 'language', 'premium', 'publish', 'delete', 'export', 'convert']),
  storyIds: z.array(z.string().cuid()).min(1, 'At least one story ID is required'),
  payload: z.object({
    categories: z.array(z.string()).optional(),
    language: z.string().min(2).max(5).optional(),
    isPremium: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    productType: z.enum(['PHYSICAL_BOOK', 'DIGITAL_BOOK']).optional(),
  }).optional(),
});

interface BulkActionResult {
  success: boolean;
  message: string;
  affectedCount: number;
  errors?: string[];
}

// POST /api/admin/stories/bulk-actions - Execute bulk operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);
    const { action, storyIds, payload = {} } = validatedData;

    // Verify stories exist and belong to the admin
    const existingStories = await prisma.story.findMany({
      where: {
        id: { in: storyIds }
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
        fullPdf: true
      }
    });

    if (existingStories.length === 0) {
      return NextResponse.json(
        { error: 'No valid stories found' },
        { status: 404 }
      );
    }

    const validStoryIds = existingStories.map(story => story.id);
    let result: BulkActionResult;

    switch (action) {
      case 'categorize':
        result = await handleCategorizeAction(validStoryIds, payload.categories || [], session.user.id);
        break;
      
      case 'language':
        result = await handleLanguageAction(validStoryIds, payload.language || '', session.user.id);
        break;
      
      case 'premium':
        result = await handlePremiumAction(validStoryIds, payload.isPremium!, session.user.id);
        break;
      
      case 'publish':
        result = await handlePublishAction(validStoryIds, payload.isPublished!, session.user.id);
        break;
      
      case 'delete':
        result = await handleDeleteAction(validStoryIds, session.user.id);
        break;
      
      case 'export':
        return await handleExportAction(validStoryIds);
      
      case 'convert':
        result = await handleConvertAction(validStoryIds, payload.productType!, session.user.id);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Bulk action error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Individual action handlers
async function handleCategorizeAction(
  storyIds: string[],
  categories: string[],
  userId: string
): Promise<BulkActionResult> {
  if (categories.length === 0) {
    return {
      success: false,
      message: 'No categories provided',
      affectedCount: 0,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedStories = await tx.story.updateMany({
        where: { id: { in: storyIds } },
        data: {
          category: categories,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          userId,
          action: 'BULK_CATEGORIZE',
          entity: 'STORY',
          entityId: 'bulk-operation',
          metadata: {
            storyCount: updatedStories.count,
            categories,
            storyIds,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // Ignore logging errors

      return updatedStories;
    });

    return {
      success: true,
      message: `Successfully categorized ${result.count} stories`,
      affectedCount: result.count,
    };
  } catch (error) {
    console.error('Categorize action error:', error);
    return {
      success: false,
      message: 'Failed to categorize stories',
      affectedCount: 0,
    };
  }
}

async function handleLanguageAction(
  storyIds: string[],
  language: string,
  userId: string
): Promise<BulkActionResult> {
  if (!language) {
    return {
      success: false,
      message: 'No language provided',
      affectedCount: 0,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedStories = await tx.story.updateMany({
        where: { id: { in: storyIds } },
        data: {
          language,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          userId,
          action: 'BULK_LANGUAGE_UPDATE',
          entity: 'STORY',
          entityId: 'bulk-operation',
          metadata: {
            storyCount: updatedStories.count,
            language,
            storyIds,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // Ignore logging errors

      return updatedStories;
    });

    return {
      success: true,
      message: `Successfully updated language for ${result.count} stories`,
      affectedCount: result.count,
    };
  } catch (error) {
    console.error('Language action error:', error);
    return {
      success: false,
      message: 'Failed to update language',
      affectedCount: 0,
    };
  }
}

async function handlePremiumAction(
  storyIds: string[],
  isPremium: boolean,
  userId: string
): Promise<BulkActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedStories = await tx.story.updateMany({
        where: { id: { in: storyIds } },
        data: {
          isPremium,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          userId,
          action: 'BULK_PREMIUM_UPDATE',
          entity: 'STORY',
          entityId: 'bulk-operation',
          metadata: {
            storyCount: updatedStories.count,
            isPremium,
            storyIds,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // Ignore logging errors

      return updatedStories;
    });

    return {
      success: true,
      message: `Successfully updated premium status for ${result.count} stories`,
      affectedCount: result.count,
    };
  } catch (error) {
    console.error('Premium action error:', error);
    return {
      success: false,
      message: 'Failed to update premium status',
      affectedCount: 0,
    };
  }
}

async function handlePublishAction(
  storyIds: string[],
  isPublished: boolean,
  userId: string
): Promise<BulkActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // For publishing, ensure stories have PDFs
      const whereClause: any = { id: { in: storyIds } };
      if (isPublished) {
        whereClause.fullPdf = { not: null };
      }

      const updatedStories = await tx.story.updateMany({
        where: whereClause,
        data: {
          isPublished,
          publishedDate: isPublished ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          userId,
          action: isPublished ? 'BULK_PUBLISH' : 'BULK_UNPUBLISH',
          entity: 'STORY',
          entityId: 'bulk-operation',
          metadata: {
            storyCount: updatedStories.count,
            isPublished,
            storyIds,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // Ignore logging errors

      return updatedStories;
    });

    const action = isPublished ? 'published' : 'unpublished';
    return {
      success: true,
      message: `Successfully ${action} ${result.count} stories`,
      affectedCount: result.count,
    };
  } catch (error) {
    console.error('Publish action error:', error);
    return {
      success: false,
      message: 'Failed to update publication status',
      affectedCount: 0,
    };
  }
}

async function handleDeleteAction(
  storyIds: string[],
  userId: string
): Promise<BulkActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get story titles for logging
      const storiesToDelete = await tx.story.findMany({
        where: { id: { in: storyIds } },
        select: { id: true, title: true },
      });

      // Soft delete by updating status or use hard delete
      const deletedStories = await tx.story.deleteMany({
        where: { id: { in: storyIds } },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          userId,
          action: 'BULK_DELETE',
          entity: 'STORY',
          entityId: 'bulk-operation',
          metadata: {
            storyCount: deletedStories.count,
            storyTitles: storiesToDelete.map(s => s.title),
            storyIds,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // Ignore logging errors

      return deletedStories;
    });

    return {
      success: true,
      message: `Successfully deleted ${result.count} stories`,
      affectedCount: result.count,
    };
  } catch (error) {
    console.error('Delete action error:', error);
    return {
      success: false,
      message: 'Failed to delete stories',
      affectedCount: 0,
    };
  }
}

async function handleExportAction(storyIds: string[]): Promise<NextResponse> {
  try {
    const stories = await prisma.story.findMany({
      where: { id: { in: storyIds } },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        language: true,
        category: true,
        authorName: true,
        isPublished: true,
        featured: true,
        isPremium: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        publishedDate: true,
        viewCount: true,
        likeCount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Title',
      'Author',
      'Language',
      'Categories',
      'Tags',
      'Published',
      'Premium',
      'Featured',
      'Views',
      'Likes',
      'Created',
      'Summary',
      'Content'
    ];

    const csvRows = stories.map(story => [
      story.id,
      `"${story.title?.replace(/"/g, '""') || ''}"`,
      `"${story.authorName?.replace(/"/g, '""') || ''}"`,
      story.language || '',
      `"${story.category?.join(', ') || ''}"`,
      `"${story.tags?.join(', ') || ''}"`,
      story.isPublished ? 'Yes' : 'No',
      story.isPremium ? 'Yes' : 'No',
      story.featured ? 'Yes' : 'No',
      story.viewCount || 0,
      story.likeCount || 0,
      story.createdAt?.toISOString().split('T')[0] || '',
      `"${story.summary?.replace(/"/g, '""') || ''}"`,
      `"${story.content?.replace(/"/g, '""').substring(0, 500) || ''}..."`,
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const filename = `stories-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export action error:', error);
    return NextResponse.json(
      { error: 'Failed to export stories' },
      { status: 500 }
    );
  }
}

async function handleConvertAction(
  storyIds: string[],
  productType: string,
  userId: string
): Promise<BulkActionResult> {
  // This is a placeholder for the conversion logic
  // The actual conversion will be implemented in the dedicated convert-to-product endpoint
  return {
    success: false,
    message: 'Conversion functionality will be available in the dedicated conversion workflow',
    affectedCount: 0,
  };
}