import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/shop/products
 * 
 * Returns list of shop products (physical books, merchandise, digital goods)
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const type = searchParams.get('type') // 'book', 'goods', 'digital'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const sort = searchParams.get('sort') || 'newest' // 'newest', 'popular', 'price_low', 'price_high'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const whereClause: any = {
      status: 'ACTIVE'
    }
    
    // Apply filters
    if (type && type !== 'all') {
      whereClause.type = type.toUpperCase()
    }
    
    if (category && category !== 'all') {
      whereClause.categoryId = category
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { creatorName: { contains: search, mode: 'insensitive' } },
        { creatorLocation: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }
    
    if (featured === 'true') {
      whereClause.featured = true
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice) whereClause.price.gte = parseFloat(minPrice)
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice)
    }
    
    // Build order by clause
    let orderBy: any = []
    switch (sort) {
      case 'price_low':
        orderBy = [{ price: 'asc' }]
        break
      case 'price_high':
        orderBy = [{ price: 'desc' }]
        break
      case 'popular':
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }]
        break
      case 'newest':
      default:
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }]
        break
    }
    
    // Query products
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
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
              price: true,
              compareAtPrice: true,
              inventoryQuantity: true,
              attributes: true
            }
          },
          inventory: {
            select: {
              quantity: true,
              reserved: true,
              location: true
            }
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where: whereClause })
    ])
    
    // Transform products for response
    const transformedProducts = products.map(product => {
      // Calculate total inventory
      const totalInventory = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved, 0)
      const availableStock = totalInventory - totalReserved
      
      // Get primary image
      const primaryImage = product.images[0]?.url || null
      
      // Calculate average rating (placeholder - will implement with actual reviews)
      const averageRating = 4.5 // Placeholder
      
      // Determine if product is in stock
      const inStock = product.type === 'DIGITAL_BOOK' || availableStock > 0
      
      return {
        id: product.id,
        sku: product.sku,
        type: product.type.toLowerCase(),
        title: product.title,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        currency: product.currency,
        featured: product.featured,
        creator: {
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
        primaryImage,
        variants: product.variants,
        inventory: {
          inStock,
          availableQuantity: product.type === 'DIGITAL_BOOK' ? null : availableStock,
          isDigital: product.type === 'DIGITAL_BOOK'
        },
        stats: {
          rating: averageRating,
          reviewCount: product._count.reviews,
          soldCount: product._count.orderItems
        },
        digitalFile: product.type === 'DIGITAL_BOOK' ? {
          downloadLimit: product.downloadLimit,
          hasFile: !!product.digitalFileUrl
        } : null
      }
    })
    
    // Get available categories for filters
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    // Get price range for filters
    const priceRange = await prisma.product.aggregate({
      where: { status: 'ACTIVE' },
      _min: { price: true },
      _max: { price: true }
    })
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        categories,
        priceRange: {
          min: priceRange._min.price || 0,
          max: priceRange._max.price || 100
        },
        types: [
          { value: 'book', label: 'Books', count: await getProductCountByType('BOOK') },
          { value: 'goods', label: 'Merchandise', count: await getProductCountByType('GOODS') },
          { value: 'digital', label: 'Digital', count: await getProductCountByType('DIGITAL') }
        ]
      }
    })
    
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get product count by type
 */
async function getProductCountByType(type: string): Promise<number> {
  return await prisma.product.count({
    where: {
      type: type as any,
      status: 'ACTIVE'
    }
  })
}