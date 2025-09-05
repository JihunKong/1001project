import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET /api/admin/shop/products/[id] - Get single product
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          select: {
            id: true,
            title: true,
            price: true,
            sku: true,
            inventoryQuantity: true,
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
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product: {
        id: product.id,
        sku: product.sku,
        title: product.title,
        description: product.description,
        price: Number(product.price),
        currency: product.currency,
        type: product.type,
        status: product.status,
        featured: product.featured,
        tags: product.tags,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        category: product.category,
        variants: product.variants?.map(variant => ({
          id: variant.id,
          title: variant.title,
          price: Number(variant.price),
          sku: variant.sku,
          inventoryQuantity: variant.inventoryQuantity,
        })),
        images: product.images?.map(image => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
        })),
        stats: {
          totalReviews: product._count.reviews,
          totalOrders: product._count.orderItems,
        },
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/shop/products/[id] - Update product
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const {
      title,
      description,
      price,
      currency,
      type,
      status,
      categoryId,
      tags,
      featured,
    } = body;

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) {
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
      updateData.categoryId = categoryId;
    }
    if (tags !== undefined) updateData.tags = tags;
    if (featured !== undefined) updateData.featured = featured;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
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
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        title: updatedProduct.title,
        description: updatedProduct.description,
        price: Number(updatedProduct.price),
        currency: updatedProduct.currency,
        type: updatedProduct.type,
        status: updatedProduct.status,
        featured: updatedProduct.featured,
        createdAt: updatedProduct.createdAt.toISOString(),
        updatedAt: updatedProduct.updatedAt.toISOString(),
        category: updatedProduct.category,
        images: updatedProduct.images?.map(image => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
        })),
      }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shop/products/[id] - Delete product
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has orders (prevent deletion if it has orders)
    if (existingProduct._count.orderItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has been ordered. Consider archiving instead.' },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.$transaction(async (tx) => {
      // Delete cart items
      await tx.cartItem.deleteMany({
        where: { productId: id }
      });

      // Delete product images
      await tx.productImage.deleteMany({
        where: { productId: id }
      });

      // Delete product variants and their inventory
      const variants = await tx.productVariant.findMany({
        where: { productId: id }
      });

      for (const variant of variants) {
        await tx.inventory.deleteMany({
          where: { variantId: variant.id }
        });
      }

      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // Delete inventory records
      await tx.inventory.deleteMany({
        where: { productId: id }
      });

      // Delete reviews
      await tx.review.deleteMany({
        where: { 
          contentType: 'PRODUCT',
          contentId: id 
        }
      });

      // Finally delete the product
      await tx.product.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}