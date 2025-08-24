import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

/**
 * GET /api/shop/products
 * 
 * Returns list of shop products (physical books, merchandise, digital goods)
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  const prisma = new PrismaClient()
  
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
      // Map frontend types to backend enum values
      const typeMap: Record<string, string> = {
        'book': 'DIGITAL_BOOK',
        'digital_book': 'DIGITAL_BOOK',
        'bundle': 'BOOK_BUNDLE',
        'subscription': 'SUBSCRIPTION',
        'classroom': 'CLASSROOM_LICENSE',
        'donation': 'DONATION_ITEM',
        'merchandise': 'MERCHANDISE'
      }
      whereClause.type = typeMap[type] || 'DIGITAL_BOOK'
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
    
    // Query shop products and books separately (workaround for include issues)
    const [products, totalCount] = await Promise.all([
      prisma.shopProduct.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit
      }),
      prisma.shopProduct.count({ where: whereClause })
    ])
    
    console.log(`Found ${products.length} products:`, products.map(p => ({ id: p.id, bookId: p.bookId, title: p.title })))
    
    // Get related books manually
    const bookIds = products.map(p => p.bookId).filter((id): id is string => Boolean(id))
    console.log('Book IDs to lookup:', bookIds)
    
    const books = bookIds.length > 0 
      ? await prisma.book.findMany({
          where: { id: { in: bookIds } },
          select: {
            id: true,
            title: true,
            subtitle: true,
            summary: true,
            authorName: true,
            authorAlias: true,
            authorAge: true,
            authorLocation: true,
            language: true,
            ageRange: true,
            category: true,
            genres: true,
            subjects: true,
            tags: true,
            coverImage: true,
            pdfKey: true,
            pdfFrontCover: true,
            pdfBackCover: true,
            pageLayout: true,
            pageCount: true,
            previewPages: true,
            isPremium: true,
            rating: true
          }
        })
      : []
    
    console.log(`Found ${books.length} books:`, books.map(b => ({ id: b.id, title: b.title })))
    
    // Create lookup map for books
    const bookMap = new Map(books.map(book => [book.id, book]))
    
    // Transform shop products for response
    const transformedProducts = products.map(product => {
      const book = bookMap.get(product.bookId || '')
      
      // Digital books are always in stock
      const inStock = product.type === 'DIGITAL_BOOK'
      
      // Get primary image from book cover or default
      const primaryImage = book?.coverImage || '/images/placeholder-book.jpg'
      
      return {
        id: product.id,
        sku: product.sku,
        type: product.type.toLowerCase(),
        title: book?.title || product.title,
        description: book?.summary || product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        currency: product.currency,
        featured: product.featured,
        creator: {
          name: book?.authorAlias || product.creatorName,
          age: book?.authorAge || product.creatorAge,
          location: book?.authorLocation || product.creatorLocation,
          story: `A young author from ${book?.authorLocation || 'a local community'} sharing their stories with the world.`
        },
        category: {
          id: 'books',
          name: 'Books',
          slug: 'books'
        },
        tags: book?.tags || product.tags || [],
        impact: {
          metric: product.impactMetric || 'children reached',
          value: product.impactValue || '5+'
        },
        images: [{
          id: '1',
          url: primaryImage,
          alt: book?.title || product.title,
          position: 1
        }],
        primaryImage,
        // Book-specific fields for PDF handling
        bookId: book?.id,
        pdfKey: book?.pdfKey,
        pdfFrontCover: book?.pdfFrontCover,
        pdfBackCover: book?.pdfBackCover,
        pageLayout: book?.pageLayout,
        coverImage: book?.coverImage,
        variants: [],
        inventory: {
          inStock,
          availableQuantity: inStock ? null : 0,
          isDigital: product.type === 'DIGITAL_BOOK'
        },
        stats: {
          rating: book?.rating || 4.5,
          reviewCount: 0, // Placeholder
          soldCount: 0 // Placeholder
        },
        digitalFile: product.type === 'DIGITAL_BOOK' ? {
          downloadLimit: product.downloadLimit || 5,
          hasFile: !!book?.pdfKey
        } : null
      }
    })
    
    // Get available categories for filters (hardcoded for books)
    const categories = [
      { id: 'books', name: 'Books', slug: 'books', count: totalCount }
    ]
    
    // Get price range for filters
    const priceRange = await prisma.shopProduct.aggregate({
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
          { value: 'digital_book', label: 'Digital Books', count: await getProductCountByType('DIGITAL_BOOK') }
        ]
      }
    })
    
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Helper function to get product count by type
 */
async function getProductCountByType(type: string): Promise<number> {
  const prisma = new PrismaClient()
  try {
    return await prisma.shopProduct.count({
      where: {
        type: type as any,
        status: 'ACTIVE'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}