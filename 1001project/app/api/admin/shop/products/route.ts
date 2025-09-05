import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

// POST /api/admin/shop/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      currency = 'USD',
      type,
      status = 'DRAFT',
      categoryId,
      tags = [],
      featured = false,
      // Generate SKU from title if not provided
      sku = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now(),
    } = body;

    // Validate required fields
    if (!title || !description || !price || !type || !categoryId) {
      return NextResponse.json(
        { error: 'Title, description, price, type, and category are required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    // Create new product
    const product = await prisma.product.create({
      data: {
        sku,
        type,
        title,
        description,
        price,
        currency,
        status,
        featured,
        categoryId,
        tags,
      },
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
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: {
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
        category: product.category,
        images: product.images?.map(image => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
        })),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}