import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, ProductType, ProductStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema for conversion request
const conversionSchema = z.object({
  productType: z.enum(['PHYSICAL_BOOK', 'DIGITAL_BOOK']),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  sku: z.string().min(1),
  variants: z.array(z.object({
    title: z.string().min(1),
    price: z.number().min(0),
    sku: z.string().min(1),
    attributes: z.object({
      format: z.string().optional(),
      size: z.string().optional(),
      quality: z.string().optional(),
    }).optional(),
  })).optional(),
  preserveStory: z.boolean().default(true),
  coverImageUrl: z.string().url().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

interface ConversionResult {
  success: boolean;
  message: string;
  product?: {
    id: string;
    title: string;
    type: string;
    price: number;
    sku: string;
    variantCount: number;
  };
  error?: string;
}

// POST /api/admin/stories/[id]/convert-to-product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const storyId = params.id;
    const body = await request.json();
    const validatedData = conversionSchema.parse(body);

    // Verify story exists and get its details
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        language: true,
        category: true,
        authorName: true,
        coverImage: true,
        fullPdf: true,
        tags: true,
        isPremium: true,
        isPublished: true,
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if story is already converted (optional constraint)
    const existingProduct = await prisma.product.findFirst({
      where: {
        title: story.title,
        creatorName: story.authorName,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this title and author already exists' },
        { status: 409 }
      );
    }

    // Handle category mapping - ensure category exists or create it
    let categoryRecord = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: validatedData.category },
          { name: { contains: validatedData.category, mode: 'insensitive' } }
        ]
      }
    });

    if (!categoryRecord) {
      // Create category if it doesn't exist
      const categorySlug = validatedData.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
      categoryRecord = await prisma.category.create({
        data: {
          name: validatedData.category,
          slug: categorySlug,
          description: `Category for ${validatedData.productType.replace('_', ' ').toLowerCase()}`,
          isActive: true,
        },
      });
    }

    // Execute conversion in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          type: validatedData.productType as ProductType,
          price: validatedData.price,
          currency: validatedData.currency,
          sku: validatedData.sku,
          status: ProductStatus.DRAFT, // Start as draft
          featured: story.isPremium, // Featured if story was premium
          
          // Creator information from story
          creatorName: story.authorName,
          creatorStory: story.summary || story.content.substring(0, 500),
          
          // Category and tags
          categoryId: categoryRecord.id,
          tags: validatedData.tags || story.tags || [],
          
          // Digital product fields
          digitalFileUrl: validatedData.productType === 'DIGITAL_BOOK' ? story.fullPdf : undefined,
          
          // SEO fields
          metaTitle: validatedData.title,
          metaDescription: validatedData.description.substring(0, 160),
        },
      });

      // Create product image if cover exists
      if (validatedData.coverImageUrl || story.coverImage) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: validatedData.coverImageUrl || story.coverImage!,
            alt: `Cover image for ${product.title}`,
            position: 0,
          },
        });
      }

      // Create product variants
      if (validatedData.variants && validatedData.variants.length > 0) {
        for (let i = 0; i < validatedData.variants.length; i++) {
          const variant = validatedData.variants[i];
          await tx.productVariant.create({
            data: {
              productId: product.id,
              title: variant.title,
              sku: variant.sku,
              price: variant.price,
              attributes: variant.attributes || {},
              position: i,
            },
          });
        }
      }

      // Create initial inventory record for tracking
      await tx.inventory.create({
        data: {
          productId: product.id,
          quantity: validatedData.productType === 'DIGITAL_BOOK' ? 9999 : 0, // Unlimited for digital
          reserved: 0,
          location: 'main',
          reorderPoint: validatedData.productType === 'PHYSICAL_BOOK' ? 10 : 0,
          reorderQuantity: validatedData.productType === 'PHYSICAL_BOOK' ? 50 : 0,
        },
      });

      // Update story to mark as converted (if we add this field to schema)
      // For now, we'll just log the relationship
      
      // Log the conversion activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'STORY_TO_PRODUCT_CONVERSION',
          entity: 'PRODUCT',
          entityId: product.id,
          metadata: {
            storyId: story.id,
            storyTitle: story.title,
            productType: validatedData.productType,
            productTitle: product.title,
            variantCount: validatedData.variants?.length || 0,
            preserveStory: validatedData.preserveStory,
            basePrice: validatedData.price,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // Ignore logging errors

      return {
        product,
        variantCount: validatedData.variants?.length || 0,
      };
    });

    // Prepare response
    const conversionResult: ConversionResult = {
      success: true,
      message: `Successfully converted "${story.title}" to ${validatedData.productType.replace('_', ' ').toLowerCase()}`,
      product: {
        id: result.product.id,
        title: result.product.title,
        type: result.product.type,
        price: Number(result.product.price),
        sku: result.product.sku,
        variantCount: result.variantCount,
      },
    };

    return NextResponse.json(conversionResult);

  } catch (error) {
    console.error('Story to product conversion error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid conversion data',
          message: 'Please check your input data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate SKU',
          message: 'A product with this SKU already exists. Please use a different SKU.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Conversion failed',
        message: 'An unexpected error occurred during conversion',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/stories/[id]/convert-to-product - Get conversion preview/suggestions
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const storyId = params.id;

    // Get story details
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        language: true,
        category: true,
        authorName: true,
        coverImage: true,
        fullPdf: true,
        tags: true,
        isPremium: true,
        isPublished: true,
        createdAt: true,
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Generate suggestions for conversion
    const suggestions = {
      recommendedType: story.fullPdf ? 'PHYSICAL_BOOK' : 'DIGITAL_BOOK',
      suggestedPrice: story.isPremium ? 15.99 : 9.99,
      suggestedSku: generateSKU(story.title, story.language),
      suggestedCategory: mapStoryCategory(story.category),
      suggestedDescription: story.summary || `${story.content.substring(0, 200)}...`,
      availableFormats: story.fullPdf 
        ? ['Paperback', 'Hardcover', 'PDF', 'EPUB'] 
        : ['PDF', 'EPUB'],
      hasRequiredAssets: {
        pdf: !!story.fullPdf,
        coverImage: !!story.coverImage,
        description: !!(story.summary || story.content),
      },
      conversionWarnings: getConversionWarnings(story),
    };

    return NextResponse.json({
      story: {
        id: story.id,
        title: story.title,
        author: story.authorName,
        language: story.language,
        categories: story.category,
        tags: story.tags,
        isPremium: story.isPremium,
        isPublished: story.isPublished,
        hasFullPdf: !!story.fullPdf,
        hasCoverImage: !!story.coverImage,
      },
      suggestions,
    });

  } catch (error) {
    console.error('Conversion preview error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversion preview' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateSKU(title: string, language: string): string {
  const titlePart = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  const langPart = language.toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  const timestamp = Date.now().toString().slice(-3);
  return `${titlePart}-${langPart}-${randomPart}${timestamp}`;
}

function mapStoryCategory(categories: string[]): string {
  if (!categories || categories.length === 0) return 'childrens-books';
  
  const categoryMap: Record<string, string> = {
    'Adventure': 'childrens-books',
    'Family': 'childrens-books',
    'Friendship': 'childrens-books',
    'Education': 'educational',
    'Fantasy': 'fiction',
    'Real Life': 'non-fiction',
    'Animals': 'childrens-books',
    'Nature': 'educational',
    'Culture': 'art-culture',
    'History': 'educational',
  };

  const firstCategory = categories[0];
  return categoryMap[firstCategory] || 'childrens-books';
}

function getConversionWarnings(story: any): string[] {
  const warnings: string[] = [];
  
  if (!story.fullPdf) {
    warnings.push('Story does not have a PDF file - physical book creation will require file upload');
  }
  
  if (!story.coverImage) {
    warnings.push('No cover image found - product will need a cover image for better sales');
  }
  
  if (!story.isPublished) {
    warnings.push('Story is not published - consider publishing before creating product');
  }
  
  if (!story.summary && story.content.length < 100) {
    warnings.push('Story content is short - consider adding more details for product description');
  }
  
  if (!story.tags || story.tags.length === 0) {
    warnings.push('No tags found - adding tags will improve product discoverability');
  }
  
  return warnings;
}