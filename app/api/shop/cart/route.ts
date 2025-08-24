import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/shop/cart
 * 
 * Returns user's cart contents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') // For anonymous users
    
    let cart = null
    
    if (session?.user?.id) {
      // Get cart for authenticated user
      cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  currency: true,
                  type: true,
                  status: true,
                  weight: true,
                  images: {
                    take: 1,
                    orderBy: { position: 'asc' },
                    select: { url: true, alt: true }
                  },
                  inventory: {
                    select: {
                      quantity: true,
                      reserved: true
                    }
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  inventoryQuantity: true,
                  attributes: true
                }
              }
            }
          }
        }
      })
    } else if (sessionId) {
      // Get cart for anonymous user
      cart = await prisma.cart.findFirst({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  currency: true,
                  type: true,
                  status: true,
                  weight: true,
                  images: {
                    take: 1,
                    orderBy: { position: 'asc' },
                    select: { url: true, alt: true }
                  },
                  inventory: {
                    select: {
                      quantity: true,
                      reserved: true
                    }
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  inventoryQuantity: true,
                  attributes: true
                }
              }
            }
          }
        }
      })
    }
    
    if (!cart) {
      return NextResponse.json({
        items: [],
        totals: {
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          itemCount: 0,
          totalWeight: 0
        },
        currency: 'USD',
        isEmpty: true
      })
    }
    
    // Filter out unavailable items and calculate totals
    const availableItems = cart.items.filter(item => {
      if (item.product.status !== 'ACTIVE') return false
      
      // Check inventory for physical products
      if (item.product.type !== 'DIGITAL_BOOK') {
        const totalInventory = item.product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
        const totalReserved = item.product.inventory.reduce((sum, inv) => sum + inv.reserved, 0)
        const available = totalInventory - totalReserved
        
        if (item.variant) {
          return item.variant.inventoryQuantity >= item.quantity
        }
        
        return available >= item.quantity
      }
      
      return true
    })
    
    // Calculate totals
    let subtotal = 0
    let totalWeight = 0
    let itemCount = 0
    
    const transformedItems = availableItems.map(item => {
      const price = item.variant?.price || item.product.price
      const lineTotal = Number(price.toNumber()) * item.quantity
      
      subtotal += lineTotal
      totalWeight += (item.product.weight || 0) * item.quantity
      itemCount += item.quantity
      
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: Number(price.toNumber()),
        lineTotal: lineTotal,
        product: {
          id: item.product.id,
          title: item.product.title,
          type: item.product.type.toLowerCase(),
          primaryImage: item.product.images[0]?.url || null,
          weight: item.product.weight
        },
        variant: item.variant ? {
          id: item.variant.id,
          title: item.variant.title,
          attributes: item.variant.attributes
        } : null,
        addedAt: item.createdAt
      }
    })
    
    // Calculate tax (placeholder - implement actual tax calculation)
    const taxRate = 0.08 // 8% tax rate
    const tax = subtotal * taxRate
    
    // Calculate shipping (placeholder - implement actual shipping calculation)
    const shipping = calculateShipping(totalWeight, subtotal)
    
    const total = subtotal + tax + shipping
    
    return NextResponse.json({
      id: cart.id,
      items: transformedItems,
      totals: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
        itemCount,
        totalWeight
      },
      currency: 'USD',
      isEmpty: transformedItems.length === 0,
      expiresAt: cart.expiresAt
    })
    
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shop/cart
 * 
 * Add item to cart or update existing item quantity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const {
      productId,
      variantId = null,
      quantity = 1,
      sessionId = null
    } = body
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }
    
    // Verify product exists and is available
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE'
      },
      include: {
        variants: variantId ? {
          where: { id: variantId },
          select: {
            id: true,
            price: true,
            inventoryQuantity: true
          }
        } : false,
        inventory: {
          select: {
            quantity: true,
            reserved: true
          }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      )
    }
    
    // Check inventory for physical products
    if (product.type !== 'DIGITAL_BOOK') {
      if (variantId) {
        const variant = product.variants?.[0]
        if (!variant || variant.inventoryQuantity < quantity) {
          return NextResponse.json(
            { error: 'Insufficient inventory for selected variant' },
            { status: 400 }
          )
        }
      } else {
        const totalInventory = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
        const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved, 0)
        const available = totalInventory - totalReserved
        
        if (available < quantity) {
          return NextResponse.json(
            { error: 'Insufficient inventory' },
            { status: 400 }
          )
        }
      }
    }
    
    // Find or create cart
    let cart
    if (session?.user?.id) {
      cart = await prisma.cart.upsert({
        where: { userId: session.user.id },
        update: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Extend expiry
        },
        create: {
          userId: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
    } else if (sessionId) {
      // Find existing cart by sessionId
      cart = await prisma.cart.findFirst({
        where: { sessionId }
      })
      
      if (!cart) {
        // Create new cart for session
        cart = await prisma.cart.create({
          data: {
            sessionId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      } else {
        // Update expiry
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: {
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Session ID required for anonymous users' },
        { status: 400 }
      )
    }
    
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId
      }
    })
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      
      // Re-check inventory for new quantity
      if (product.type !== 'DIGITAL_BOOK') {
        if (variantId) {
          const variant = product.variants?.[0]
          if (!variant || variant.inventoryQuantity < newQuantity) {
            return NextResponse.json(
              { error: 'Insufficient inventory for requested quantity' },
              { status: 400 }
            )
          }
        } else {
          const totalInventory = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
          const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved, 0)
          const available = totalInventory - totalReserved
          
          if (available < newQuantity) {
            return NextResponse.json(
              { error: 'Insufficient inventory for requested quantity' },
              { status: 400 }
            )
          }
        }
      }
      
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      })
    } else {
      // Create new cart item
      const itemPrice = variantId 
        ? product.variants?.find(v => v.id === variantId)?.price || product.price
        : product.price
      
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          price: itemPrice
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      cartId: cart.id
    })
    
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shop/cart
 * 
 * Remove item from cart or clear entire cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const clearAll = searchParams.get('clearAll') === 'true'
    const sessionId = searchParams.get('sessionId')
    
    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        { error: 'Authentication or session ID required' },
        { status: 401 }
      )
    }
    
    // Find cart
    const cartWhere = session?.user?.id 
      ? { userId: session.user.id }
      : { sessionId }
    
    const cart = await prisma.cart.findFirst({ where: cartWhere })
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }
    
    if (clearAll) {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    } else if (itemId) {
      // Remove specific item
      await prisma.cartItem.deleteMany({
        where: {
          id: itemId,
          cartId: cart.id
        }
      })
    } else {
      return NextResponse.json(
        { error: 'itemId or clearAll parameter required' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: clearAll ? 'Cart cleared successfully' : 'Item removed from cart'
    })
    
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to calculate shipping cost
 */
function calculateShipping(totalWeight: number, subtotal: number): number {
  // Free shipping over $50
  if (subtotal >= 50) return 0
  
  // Weight-based shipping
  if (totalWeight <= 1) return 5.99
  if (totalWeight <= 5) return 8.99
  if (totalWeight <= 10) return 12.99
  
  return 15.99
}