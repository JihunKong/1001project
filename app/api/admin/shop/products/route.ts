import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { validateFileSignature, sanitizeFilename, validateFileSize } from '@/lib/file-validation';
import { logAuditEvent } from '@/lib/security/headers';

// GET /api/admin/shop/products - List all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status && status !== '') {
      where.status = status;
    }
    
    if (type && type !== '') {
      where.type = type;
    }

    // Fetch products with category information
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
              position: true,
            },
            orderBy: { position: 'asc' },
          },
          variants: {
            select: {
              id: true,
              title: true,
              price: true,
              sku: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Transform products to match frontend interface
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: Number(product.price),
      currency: product.currency,
      type: product.type,
      status: product.status,
      featured: product.featured,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      variants: product.variants?.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: Number(variant.price),
        sku: variant.sku,
      })),
      images: product.images?.map(image => ({
        id: image.id,
        url: image.url,
        alt: image.alt,
      })),
    }));

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shop/products - Create new product with image upload
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let uploadSuccess = false;
  
  try {
    const session = await getServerSession(authOptions);
    const userIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session?.user?.id,
        action: 'UNAUTHORIZED_PRODUCT_CREATION',
        resource: '/api/admin/shop/products',
        ip: userIp,
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: { reason: 'Not admin user' }
      });
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract product data
    const productData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: formData.get('price') as string,
      category: JSON.parse(formData.get('category') as string || '[]'),
      type: formData.get('type') as string,
      stock: formData.get('stock') as string,
      featured: formData.get('featured') === 'true',
      creatorName: formData.get('creatorName') as string,
      creatorLocation: formData.get('creatorLocation') as string,
      creatorAge: formData.get('creatorAge') as string,
      creatorStory: formData.get('creatorStory') as string,
      impactMetric: formData.get('impactMetric') as string,
      impactValue: formData.get('impactValue') as string,
    };

    // Validate required fields
    if (!productData.title || !productData.description || !productData.price || !productData.type) {
      return NextResponse.json(
        { error: 'Title, description, price, and type are required' },
        { status: 400 }
      );
    }

    if (!productData.creatorName || !productData.creatorLocation || !productData.creatorStory) {
      return NextResponse.json(
        { error: 'Creator information is required' },
        { status: 400 }
      );
    }

    // Extract and validate images
    const imageFiles: File[] = [];
    let imageIndex = 0;
    while (formData.get(`image_${imageIndex}`)) {
      const imageFile = formData.get(`image_${imageIndex}`) as File;
      if (imageFile && imageFile.size > 0) {
        imageFiles.push(imageFile);
      }
      imageIndex++;
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one product image is required' },
        { status: 400 }
      );
    }

    // Validate all images
    for (let i = 0; i < imageFiles.length; i++) {
      const image = imageFiles[i];
      
      // Validate file signature
      const signatureValidation = await validateFileSignature(image, ['png', 'jpg', 'jpeg', 'webp']);
      if (!signatureValidation.isValid) {
        return NextResponse.json(
          { error: `Invalid image file (${i + 1}): ${signatureValidation.error}` },
          { status: 400 }
        );
      }

      // Validate file size (10MB limit)
      const sizeValidation = validateFileSize(image, 10 * 1024 * 1024);
      if (!sizeValidation.isValid) {
        return NextResponse.json(
          { error: `Image ${i + 1}: ${sizeValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Generate unique product ID and SKU
    const productId = `${productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}-${Date.now()}`;
    const sku = `${productData.type.toUpperCase()}-${Date.now()}`;

    // Create product directory
    const productDir = join(process.cwd(), 'public', 'products', productId);
    if (!existsSync(productDir)) {
      await mkdir(productDir, { recursive: true });
    }

    // Save images and collect their paths
    const savedImages = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const image = imageFiles[i];
      const sanitizedName = sanitizeFilename(`image_${i + 1}.${image.name.split('.').pop()}`);
      const imagePath = join(productDir, sanitizedName);
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      
      await writeFile(imagePath, imageBuffer);
      
      savedImages.push({
        url: `/products/${productId}/${sanitizedName}`,
        alt: `${productData.title} - Image ${i + 1}`,
        position: i
      });
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        id: productId,
        sku,
        type: productData.type,
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price),
        currency: 'USD',
        stock: parseInt(productData.stock) || 1,
        featured: productData.featured,
        category: productData.category,
        creator: {
          name: productData.creatorName,
          location: productData.creatorLocation,
          age: productData.creatorAge ? parseInt(productData.creatorAge) : undefined,
          story: productData.creatorStory,
        },
        impact: {
          metric: productData.impactMetric,
          value: productData.impactValue,
        },
        images: savedImages,
      }
    });

    // Log successful creation
    uploadSuccess = true;
    await logAuditEvent({
      timestamp: new Date(),
      userId: session.user.id,
      action: 'PRODUCT_CREATION_SUCCESS',
      resource: '/api/admin/shop/products',
      ip: userIp,
      userAgent: request.headers.get('user-agent') || '',
      success: true,
      metadata: {
        productId: product.id,
        title: product.title,
        type: product.type,
        imageCount: savedImages.length,
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      productId: product.id,
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        price: Number(product.price),
        currency: product.currency,
        type: product.type,
        stock: product.stock,
        featured: product.featured,
        category: product.category,
        creator: product.creator,
        impact: product.impact,
        images: product.images,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Log creation failure
    if (!uploadSuccess) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session?.user?.id,
        action: 'PRODUCT_CREATION_FAILURE',
        resource: '/api/admin/shop/products',
        ip: userIp,
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}