import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Complete order and create corresponding entitlements
async function completeOrderAndCreateEntitlements(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            productId: true,
            title: true,
            quantity: true
          }
        }
      }
    });

    if (!order || !order.userId) {
      throw new Error('Order not found or missing user');
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        paymentStatus: 'PAID'
      }
    });

    // Create entitlements for each item
    for (const item of order.items) {
      // Check if entitlement already exists
      const existingEntitlement = await prisma.entitlement.findFirst({
        where: {
          userId: order.userId,
          OR: [
            { bookId: item.productId },
            { storyId: item.productId }
          ],
          orderId: orderId
        }
      });

      if (!existingEntitlement) {
        await prisma.entitlement.create({
          data: {
            userId: order.userId,
            storyId: item.productId, // Using storyId for legacy compatibility
            orderId: orderId,
            type: 'PURCHASE',
            scope: 'BOOK',
            grantReason: 'purchase',
            grantedAt: new Date(),
            isActive: true
          }
        });
      }
    }

    // Log completion
    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: 'ORDER_COMPLETED',
        entity: 'ORDER',
        entityId: orderId,
        metadata: {
          itemCount: order.items.length,
          totalAmount: order.total,
          entitlementsCreated: true
        }
      }
    }).catch(() => {}); // Fail silently for analytics

  } catch (error) {
    console.error('Error completing order and creating entitlements:', error);
    throw error;
  }
}

/**
 * POST /api/library/stories/[id]/purchase
 * 
 * Handles individual story purchases
 * For now, this creates an order record without payment processing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const storyId = id
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json().catch(() => ({}))
    const { paymentMethod = 'pending' } = body
    
    // Verify story exists and is purchasable
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        isPublished: true,
        isPremium: true,
        author: {
          deletedAt: null
        }
      },
      select: {
        id: true,
        title: true,
        price: true,
        authorId: true,
        authorName: true
      }
    })
    
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found or not available for purchase' },
        { status: 404 }
      )
    }
    
    if (!story.price || Number(story.price.toNumber()) <= 0) {
      return NextResponse.json(
        { error: 'Story price not set' },
        { status: 400 }
      )
    }
    
    // Check if user already has access through entitlements
    const existingEntitlement = await prisma.entitlement.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { bookId: storyId },
          { storyId: storyId }
        ],
        isActive: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      }
    })
    
    if (existingEntitlement) {
      return NextResponse.json({
        success: true,
        alreadyHasAccess: true,
        message: `You already have access to this story: ${existingEntitlement.grantReason}`,
        accessLevel: 'full',
        entitlement: {
          type: existingEntitlement.type,
          reason: existingEntitlement.grantReason,
          expiresAt: existingEntitlement.expiresAt
        }
      })
    }
    
    // Check if user has active subscription that includes this story
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        status: true,
        canAccessPremium: true,
        unlimitedReading: true
      }
    })
    
    if (subscription?.status === 'ACTIVE' && subscription.canAccessPremium) {
      return NextResponse.json({
        success: true,
        alreadyHasAccess: true,
        message: 'You already have access to this story through your subscription',
        accessLevel: 'full'
      })
    }
    
    // Create order for the story purchase
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        email: session.user.email || '',
        status: 'PENDING', // Will be updated when payment is processed
        paymentStatus: 'PENDING',
        subtotal: story.price,
        total: story.price,
        currency: 'USD',
        items: {
          create: {
            productId: storyId,
            title: story.title,
            quantity: 1,
            price: story.price,
            total: story.price
          }
        }
      },
      include: {
        items: true
      }
    })

    // For demo purposes, simulate immediate payment completion
    // In production, this would happen via webhook after real payment
    await completeOrderAndCreateEntitlements(order.id)
    
    // Log the purchase attempt
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'STORY_PURCHASE_INITIATED',
        entity: 'STORY',
        entityId: storyId,
        metadata: {
          orderId: order.id,
          amount: story.price,
          paymentMethod
        }
      }
    }).catch(() => {}) // Fail silently for analytics
    
    // In a real implementation, this is where you would:
    // 1. Create Stripe Payment Intent
    // 2. Return payment client secret
    // 3. Handle webhook for payment completion
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: 'PAID', // Demo: immediate completion
        totalAmount: order.total,
        currency: order.currency,
        items: order.items
      },
      story: {
        id: story.id,
        title: story.title,
        price: story.price
      },
      nextSteps: {
        message: 'Purchase completed successfully! You now have full access to this book.',
        paymentRequired: false,
        accessLevel: 'full',
        redirectTo: `/library/books/${storyId}`
      }
    })
    
  } catch (error) {
    console.error('Error processing story purchase:', error)
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/library/stories/[id]/purchase
 * 
 * Check if user has purchased this story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const storyId = id
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        hasPurchased: false,
        hasAccess: false,
        accessLevel: 'preview'
      })
    }
    
    // Check for purchase
    const purchase = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['DELIVERED', 'PROCESSING'] },
        items: {
          some: {
            product: { type: 'DIGITAL_BOOK' },
            productId: storyId
          }
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        total: true
      }
    })
    
    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        status: true,
        canAccessPremium: true,
        plan: true
      }
    })
    
    const hasPurchased = !!purchase
    const hasSubscriptionAccess = subscription?.status === 'ACTIVE' && subscription.canAccessPremium
    const hasAccess = hasPurchased || hasSubscriptionAccess
    
    return NextResponse.json({
      hasPurchased,
      hasAccess,
      accessLevel: hasAccess ? 'full' : 'preview',
      purchase: purchase || null,
      subscription: subscription || null
    })
    
  } catch (error) {
    console.error('Error checking purchase status:', error)
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    )
  }
}