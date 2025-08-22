import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/shop/products/[id]
 * 
 * Returns detailed shop product information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const prisma = new PrismaClient()
  
  try {
    const productId = id
    const session = await getServerSession(authOptions)
    
    console.log(`[Shop Product API] Looking for product with ID: ${productId}`)
    
    // Use the same approach as the list API - findMany then filter
    const products = await prisma.shopProduct.findMany({
      where: {
        id: productId,
        status: 'ACTIVE'
      }
    })
    
    console.log(`[Shop Product API] Found products:`, products)
    const product = products.length > 0 ? products[0] : null
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Get the linked book manually
    const book = product.bookId 
      ? await prisma.book.findFirst({
          where: { id: product.bookId },
          select: {
            id: true,
            title: true,
            pdfKey: true,
            coverImage: true,
            pageCount: true,
            isPremium: true,
            rating: true,
            tags: true,
            summary: true,
            authorName: true,
            authorAlias: true,
            authorAge: true,
            authorLocation: true,
            language: true,
            ageRange: true
          }
        })
      : null
    
    // Use the book data we fetched manually
    
    // Determine stock status - digital books are always in stock
    const inStock = product.type === 'DIGITAL_BOOK' || product.status === 'ACTIVE'
    
    // Calculate primary image
    const primaryImage = book?.coverImage || `/images/book-covers/${book?.title || product.title}.jpg`
    
    // Get related products (same creator or similar tags)
    const relatedProducts = await prisma.shopProduct.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE',
        OR: [
          { creatorName: product.creatorName },
          { tags: { hasSome: product.tags } }
        ]
      },
      take: 6,
      orderBy: { createdAt: 'desc' }
    })
    
    // Get books for related products
    const relatedBookIds = relatedProducts.map(p => p.bookId).filter((id): id is string => Boolean(id))
    const relatedBooks = relatedBookIds.length > 0
      ? await prisma.book.findMany({
          where: { id: { in: relatedBookIds } },
          select: {
            id: true,
            title: true,
            coverImage: true,
            rating: true,
            pdfKey: true
          }
        })
      : []
    
    const relatedBookMap = new Map(relatedBooks.map(book => [book.id, book]))
    
    // Transform related products to match expected format
    const transformedRelatedProducts = relatedProducts.map(relatedProduct => {
      const relatedBook = relatedBookMap.get(relatedProduct.bookId || '')
      const relatedPrimaryImage = relatedBook?.coverImage || `/images/book-covers/${relatedBook?.title || relatedProduct.title}.jpg`
      
      return {
        id: relatedProduct.id,
        sku: relatedProduct.sku,
        type: relatedProduct.type.toLowerCase(),
        title: relatedBook?.title || relatedProduct.title,
        price: relatedProduct.price,
        compareAtPrice: relatedProduct.compareAtPrice,
        currency: relatedProduct.currency,
        featured: relatedProduct.featured,
        creator: {
          name: relatedProduct.creatorName,
          age: relatedProduct.creatorAge,
          location: relatedProduct.creatorLocation
        },
        category: {
          id: 'books',
          name: 'Books', 
          slug: 'books'
        },
        tags: relatedProduct.tags || [],
        impact: {
          metric: relatedProduct.impactMetric || 'Children reached',
          value: relatedProduct.impactValue || '5+'
        },
        images: [{
          id: '1',
          url: relatedPrimaryImage,
          alt: relatedBook?.title || relatedProduct.title,
          position: 1
        }],
        primaryImage: relatedPrimaryImage,
        bookId: relatedBook?.id,
        pdfKey: relatedBook?.pdfKey,
        inventory: {
          inStock: relatedProduct.type === 'DIGITAL_BOOK' || relatedProduct.status === 'ACTIVE',
          isDigital: relatedProduct.type === 'DIGITAL_BOOK'
        },
        stats: {
          rating: relatedBook?.rating || (4 + Math.random()),
          reviewCount: 0,
          soldCount: 0
        }
      }
    })
    
    // Build detailed response in same format as list API
    const response = {
      id: product.id,
      sku: product.sku,
      type: product.type.toLowerCase(),
      title: book?.title || product.title,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      currency: product.currency,
      featured: product.featured,
      creator: {
        name: book?.authorAlias || product.creatorName,
        age: book?.authorAge || product.creatorAge,
        location: book?.authorLocation || product.creatorLocation,
        story: `A young author from ${book?.authorLocation || product.creatorLocation || 'a local community'} sharing their stories with the world.`
      },
      category: {
        id: 'books',
        name: 'Books',
        slug: 'books'
      },
      tags: book?.tags || product.tags || [],
      impact: {
        metric: product.impactMetric || 'Children reached',
        value: product.impactValue || '5+'
      },
      images: [{
        id: '1',
        url: primaryImage,
        alt: book?.title || product.title,
        position: 1
      }],
      primaryImage,
      
      // Book-specific fields for PDF handling and library navigation
      bookId: book?.id,
      pdfKey: book?.pdfKey,
      coverImage: book?.coverImage,
      
      // Product variants and inventory
      variants: [],
      inventory: {
        inStock,
        availableQuantity: inStock ? (product.type === 'DIGITAL_BOOK' ? null : product.maxQuantity) : 0,
        isDigital: product.type === 'DIGITAL_BOOK'
      },
      
      // Stats and ratings
      stats: {
        rating: book?.rating || (4 + Math.random()),
        reviewCount: 0,
        soldCount: 0
      },
      
      // Digital file information
      digitalFile: product.type === 'DIGITAL_BOOK' ? {
        downloadLimit: product.downloadLimit || 5,
        hasFile: !!book?.pdfKey
      } : null,
      
      // Additional detail page fields
      bundleItems: product.bundleItems || [],
      bundleDiscount: product.bundleDiscount,
      accessDuration: product.accessDuration,
      
      // Technical specifications
      specifications: {
        'Type': product.type === 'DIGITAL_BOOK' ? 'Digital Book' : 'Physical Product',
        'Format': 'PDF',
        'Pages': book?.pageCount?.toString() || 'N/A',
        'Language': book?.language || 'English',
        'Age Range': book?.ageRange || 'All Ages',
        'Download Limit': product.downloadLimit?.toString() || 'Unlimited',
        'Access Duration': product.accessDuration ? `${product.accessDuration} days` : 'Permanent'
      },
      
      // Related products
      relatedProducts: transformedRelatedProducts
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching shop product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}