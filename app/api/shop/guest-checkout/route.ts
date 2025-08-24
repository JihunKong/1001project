import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/shop/guest-checkout
 * 
 * Create guest checkout session and optionally create user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      productId,
      quantity = 1,
      guestInfo
    } = body
    
    if (!productId || !guestInfo?.email || !guestInfo?.firstName || !guestInfo?.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Find the product
    const shopProduct = await prisma.shopProduct.findUnique({
      where: { id: productId },
      include: {
        book: {
          select: {
            title: true,
            summary: true,
            authorAlias: true
          }
        }
      }
    })
    
    if (!shopProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: guestInfo.email }
    })
    
    // Create user if they don't exist and requested account creation
    if (!user && guestInfo.createAccount) {
      user = await prisma.user.create({
        data: {
          email: guestInfo.email,
          name: `${guestInfo.firstName} ${guestInfo.lastName}`,
          role: 'LEARNER',
          emailVerified: null, // Will be verified via magic link
          profile: {
            create: {
              firstName: guestInfo.firstName,
              lastName: guestInfo.lastName,
              language: 'en'
            }
          }
        }
      })
    }
    
    // Calculate totals
    const subtotal = Number(shopProduct.price.toNumber()) * quantity
    const tax = 0 // No tax for digital products
    const total = subtotal + tax
    
    // Generate session ID for guest checkout
    const sessionId = randomBytes(32).toString('hex')
    
    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        email: guestInfo.email,
        status: 'PENDING',
        total: total,
        subtotal: subtotal,
        tax: tax,
        shipping: 0,
        discount: 0,
        currency: 'USD',
        paymentMethod: 'pending',
        items: {
          create: {
            productId: shopProduct.id,
            title: shopProduct.book?.title || shopProduct.title,
            quantity: quantity,
            price: shopProduct.price,
            total: total
          }
        }
      },
      include: {
        items: true
      }
    })
    
    // If user was created, create entitlement for the book
    if (user && shopProduct.bookId) {
      await prisma.entitlement.create({
        data: {
          userId: user.id,
          bookId: shopProduct.bookId,
          orderId: order.id,
          type: 'PURCHASE',
          grantReason: 'purchase',
          scope: 'BOOK',
          expiresAt: null // Permanent access for purchases
        }
      })
    }
    
    // Generate magic link for account access (if account was created)
    let magicLinkToken = null
    if (user) {
      magicLinkToken = randomBytes(32).toString('hex')
      
      // Store magic link token (expires in 24 hours)
      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token: magicLinkToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      })
    }
    
    // Send confirmation email
    const emailData = {
      to: guestInfo.email,
      subject: `Order Confirmation - ${shopProduct.book?.title || shopProduct.title}`,
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Hi ${guestInfo.firstName},</p>
        <p>Your order has been confirmed. Here are the details:</p>
        
        <h3>Order Details</h3>
        <ul>
          <li><strong>Product:</strong> ${shopProduct.book?.title || shopProduct.title}</li>
          <li><strong>Quantity:</strong> ${quantity}</li>
          <li><strong>Total:</strong> $${total.toFixed(2)}</li>
          <li><strong>Order ID:</strong> ${order.id}</li>
        </ul>
        
        ${user && magicLinkToken ? `
        <h3>Access Your Account</h3>
        <p>We've created an account for you. Click the link below to access your library:</p>
        <a href="${process.env.NEXTAUTH_URL}/api/auth/callback/email?token=${magicLinkToken}&email=${encodeURIComponent(user.email)}" 
           style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Access Your Library
        </a>
        ` : `
        <h3>Next Steps</h3>
        <p>Complete your payment to get instant access to your digital book.</p>
        `}
        
        <hr>
        <p style="color: #666; font-size: 14px;">
          This email was sent to ${guestInfo.email}. If you have any questions, please contact our support team.
        </p>
      `
    }
    
    try {
      await sendEmail(emailData)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the whole request if email fails
    }
    
    return NextResponse.json({
      success: true,
      sessionId: user ? null : sessionId,
      orderId: order.id,
      userId: user?.id || null,
      order: {
        id: order.id,
        total: order.total,
        items: order.items
      },
      account: user ? {
        created: true,
        email: user.email,
        magicLinkSent: !!magicLinkToken
      } : {
        created: false,
        guestSession: sessionId
      },
      nextSteps: {
        message: user 
          ? 'Account created! Check your email for access link and complete payment.'
          : 'Complete payment to access your digital book.',
        paymentRequired: true
      }
    })
    
  } catch (error) {
    console.error('Error processing guest checkout:', error)
    return NextResponse.json(
      { error: 'Failed to process guest checkout' },
      { status: 500 }
    )
  }
}