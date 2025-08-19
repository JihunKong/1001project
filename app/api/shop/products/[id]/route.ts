import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/shop/products/[id]
 * 
 * Returns detailed product information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const productId = id
    const session = await getServerSession(authOptions)
    
    // Get product with all related data
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        images: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            url: true,
            alt: true,
            position: true
          }
        },
        variants: {
          select: {
            id: true,
            title: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            inventoryQuantity: true,
            weight: true,
            attributes: true,
            position: true
          },
          orderBy: { position: 'asc' }
        },
        inventory: {
          select: {
            id: true,
            quantity: true,
            reserved: true,
            location: true,
            reorderPoint: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true
          }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Calculate inventory totals
    const totalInventory = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
    const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved, 0)
    const availableStock = totalInventory - totalReserved
    
    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0
    
    // Check if user has purchased this product
    let userHasPurchased = false
    if (session?.user?.id) {
      const userPurchase = await prisma.order.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ['DELIVERED', 'PROCESSING'] },
          items: {
            some: {
              productId: product.id
            }
          }
        }
      })
      userHasPurchased = !!userPurchase
    }
    
    // Get related products (same category or creator)
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE',
        OR: [
          { categoryId: product.categoryId },
          { creatorName: product.creatorName }
        ]
      },
      include: {
        images: {
          take: 1,
          orderBy: { position: 'asc' },
          select: { url: true, alt: true }
        },
        _count: {
          select: { reviews: true }
        }
      },
      take: 6,
      orderBy: { createdAt: 'desc' }
    })
    
    // Transform related products
    const transformedRelatedProducts = relatedProducts.map(relatedProduct => ({
      id: relatedProduct.id,
      title: relatedProduct.title,
      price: relatedProduct.price,
      compareAtPrice: relatedProduct.compareAtPrice,
      currency: relatedProduct.currency,
      type: relatedProduct.type.toLowerCase(),
      primaryImage: relatedProduct.images[0]?.url || null,
      featured: relatedProduct.featured,
      creator: {
        name: relatedProduct.creatorName,
        location: relatedProduct.creatorLocation
      },
      reviewCount: relatedProduct._count.reviews
    }))
    
    // Check stock status
    const inStock = product.type === 'DIGITAL_BOOK' || availableStock > 0
    const lowStock = product.type !== 'DIGITAL_BOOK' && availableStock <= 5 && availableStock > 0
    
    // Build response
    const response = {
      id: product.id,
      sku: product.sku,
      type: product.type.toLowerCase(),
      title: product.title,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      cost: product.cost,
      currency: product.currency,
      weight: product.weight,
      featured: product.featured,
      creator: {
        id: product.creatorId,
        name: product.creatorName,
        age: product.creatorAge,
        location: product.creatorLocation,
        story: product.creatorStory
      },
      category: product.category,
      tags: product.tags,
      impact: {
        metric: product.impactMetric,
        value: product.impactValue
      },
      images: product.images,
      variants: product.variants,
      inventory: {
        inStock,
        lowStock,
        availableQuantity: product.type === 'DIGITAL_BOOK' ? null : availableStock,
        totalQuantity: product.type === 'DIGITAL_BOOK' ? null : totalInventory,
        reservedQuantity: product.type === 'DIGITAL_BOOK' ? null : totalReserved,
        isDigital: product.type === 'DIGITAL_BOOK',
        locations: product.inventory.map(inv => ({
          location: inv.location,
          quantity: inv.quantity,
          reserved: inv.reserved,
          available: inv.quantity - inv.reserved
        }))
      },
      digitalFile: product.type === 'DIGITAL_BOOK' ? {
        hasFile: !!product.digitalFileUrl,
        downloadLimit: product.downloadLimit,
        userHasPurchased
      } : null,
      seo: {
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription
      },
      stats: {
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: product._count.reviews,
        soldCount: product._count.orderItems
      },
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt,
        verified: review.verified,
        user: {
          name: review.user.name || 
                `${review.user.profile?.firstName || ''} ${review.user.profile?.lastName || ''}`.trim() ||
                'Anonymous'
        }
      })),
      relatedProducts: transformedRelatedProducts,
      userHasPurchased
    }
    
    // Log product view for analytics
    if (session?.user?.id) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'PRODUCT_VIEWED',
          entity: 'PRODUCT',
          entityId: productId,
          metadata: {
            productTitle: product.title,
            productType: product.type,
            price: product.price,
            userAgent: request.headers.get('user-agent')
          }
        }
      }).catch(() => {}) // Fail silently for analytics
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    )
  }
}