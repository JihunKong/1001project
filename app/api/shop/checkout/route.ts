import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * POST /api/shop/checkout
 * 
 * Initialize checkout process and create order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const {
      sessionId = null,
      shippingAddress,
      billingAddress,
      paymentMethod = 'pending',
      promotionCode = null
    } = body
    
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
    
    const cart = await prisma.cart.findFirst({
      where: cartWhere,
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
                creatorId: true,
                creatorName: true,
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
                inventoryQuantity: true
              }
            }
          }
        }
      }
    })
    
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty or not found' },
        { status: 400 }
      )
    }
    
    // Validate all items are still available
    const unavailableItems = []
    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE') {
        unavailableItems.push({
          productId: item.productId,
          reason: 'Product no longer available'
        })
        continue
      }
      
      // Check inventory for physical products
      if (item.product.type !== 'DIGITAL_BOOK') {
        if (item.variantId && item.variant) {
          if (item.variant.inventoryQuantity < item.quantity) {
            unavailableItems.push({
              productId: item.productId,
              variantId: item.variantId,
              reason: 'Insufficient inventory'
            })
          }
        } else {
          const totalInventory = item.product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
          const totalReserved = item.product.inventory.reduce((sum, inv) => sum + inv.reserved, 0)
          const available = totalInventory - totalReserved
          
          if (available < item.quantity) {
            unavailableItems.push({
              productId: item.productId,
              reason: 'Insufficient inventory'
            })
          }
        }
      }
    }
    
    if (unavailableItems.length > 0) {
      return NextResponse.json({
        error: 'Some items are no longer available',
        unavailableItems
      }, { status: 400 })
    }
    
    // Calculate order totals
    let subtotal = 0
    let totalWeight = 0
    const orderItems = []
    
    for (const item of cart.items) {
      const price = item.variant?.price || item.product.price
      const lineTotal = price.toNumber() * item.quantity
      
      subtotal += lineTotal
      totalWeight += (item.product.weight || 0) * item.quantity
      
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        title: item.product.title,
        variantTitle: item.variant?.title || null,
        quantity: item.quantity,
        price: price,
        total: new Decimal(lineTotal),
        product: {
          connect: { id: item.productId }
        }
      })
    }
    
    // Apply promotion if provided
    let discount = 0
    let promotionId = null
    if (promotionCode) {
      // Placeholder for promotion logic
      // const promotion = await applyPromotion(promotionCode, subtotal)
      // discount = promotion.discount
      // promotionId = promotion.id
    }
    
    // Calculate tax and shipping
    const taxRate = 0.08 // 8% - in production, calculate based on shipping address
    const tax = (subtotal - discount) * taxRate
    const shipping = calculateShipping(totalWeight, subtotal - discount)
    const total = subtotal - discount + tax + shipping
    
    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        email: session?.user?.email || 'anonymous@example.com',
        status: 'PENDING',
        total: new Decimal(total),
        subtotal: new Decimal(subtotal),
        tax: new Decimal(tax),
        shipping: new Decimal(shipping),
        discount: new Decimal(discount),
        currency: 'USD',
        paymentMethod,
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : undefined,
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : undefined,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    })
    
    // Reserve inventory for physical products
    for (const item of cart.items) {
      if (item.product.type !== 'DIGITAL_BOOK') {
        // In a real implementation, you would reserve inventory here
        // This prevents overselling during the payment process
        // await reserveInventory(item.productId, item.variantId, item.quantity)
      }
    }
    
    // Log checkout initiation
    if (session?.user?.id) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'CHECKOUT_INITIATED',
          entity: 'ORDER',
          entityId: order.id,
          metadata: {
            orderId: order.id,
            itemCount: cart.items.length,
            totalAmount: total,
            hasShipping: !!shippingAddress
          }
        }
      }).catch(() => {}) // Fail silently for analytics
    }
    
    // In a real implementation, this is where you would:
    // 1. Create Stripe Payment Intent
    // 2. Calculate actual shipping rates
    // 3. Apply real tax calculations
    // 4. Validate addresses
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        currency: order.currency,
        items: order.items,
        createdAt: order.createdAt
      },
      checkout: {
        // In real implementation, include Stripe client secret
        paymentClientSecret: null,
        paymentRequired: total > 0,
        requiresShipping: orderItems.some(item => 
          cart.items.find(cartItem => cartItem.productId === item.productId)?.product.type !== 'DIGITAL_BOOK'
        )
      },
      nextSteps: {
        message: 'Order created successfully. Complete payment to finalize.',
        clearCart: false // Don't clear cart until payment is confirmed
      }
    })
    
  } catch (error) {
    console.error('Error initializing checkout:', error)
    return NextResponse.json(
      { error: 'Failed to initialize checkout' },
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