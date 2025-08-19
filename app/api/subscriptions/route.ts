import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/subscriptions
 * 
 * Returns user's current subscription status and available plans
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Get available subscription plans (could be stored in database or config)
    const availablePlans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Access to free stories',
          'Basic reading features',
          'Community access'
        ],
        limits: {
          maxStudents: 0,
          maxDownloads: 3,
          canAccessPremium: false,
          canDownloadPDF: false,
          canCreateClasses: false,
          unlimitedReading: false
        }
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_basic_monthly', // Placeholder
        features: [
          'Access to all premium stories',
          'Offline reading capability',
          'No advertisements',
          'Reading progress sync'
        ],
        limits: {
          maxStudents: 30,
          maxDownloads: 20,
          canAccessPremium: true,
          canDownloadPDF: true,
          canCreateClasses: false,
          unlimitedReading: true
        }
      },
      {
        id: 'educator',
        name: 'Educator',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_educator_monthly', // Placeholder
        features: [
          'All Basic features',
          'Create unlimited classes',
          'Student progress tracking',
          'Curriculum tools',
          'Priority support'
        ],
        limits: {
          maxStudents: 100,
          maxDownloads: 50,
          canAccessPremium: true,
          canDownloadPDF: true,
          canCreateClasses: true,
          unlimitedReading: true
        }
      },
      {
        id: 'institution',
        name: 'Institution',
        price: 99.99,
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_institution_monthly', // Placeholder
        features: [
          'All Educator features',
          'Unlimited students',
          'Administrative dashboard',
          'Bulk management tools',
          'Custom reporting',
          'Dedicated support'
        ],
        limits: {
          maxStudents: -1, // Unlimited
          maxDownloads: -1, // Unlimited
          canAccessPremium: true,
          canDownloadPDF: true,
          canCreateClasses: true,
          unlimitedReading: true
        }
      }
    ]
    
    let currentSubscription = null
    
    if (session?.user?.id) {
      // Get user's current subscription
      currentSubscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          plan: true,
          status: true,
          startDate: true,
          endDate: true,
          cancelledAt: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          maxStudents: true,
          maxDownloads: true,
          canAccessPremium: true,
          canDownloadPDF: true,
          canCreateClasses: true,
          unlimitedReading: true,
          createdAt: true,
          updatedAt: true
        }
      })
      
      // Add usage statistics if subscription exists
      if (currentSubscription) {
        const usage = await getUserUsageStats(session.user.id)
        currentSubscription = {
          ...currentSubscription,
          usage
        }
      }
    }
    
    return NextResponse.json({
      currentSubscription,
      availablePlans,
      hasActiveSubscription: currentSubscription?.status === 'ACTIVE',
      canUpgrade: !currentSubscription || currentSubscription.plan !== 'ENTERPRISE'
    })
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription information' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions
 * 
 * Create or update subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { planId, paymentMethod = 'pending' } = body
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }
    
    // Validate plan exists
    const validPlans = ['free', 'basic', 'educator', 'institution']
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }
    
    // Get current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })
    
    // Define plan features
    const planFeatures = {
      free: {
        maxStudents: 0,
        maxDownloads: 3,
        canAccessPremium: false,
        canDownloadPDF: false,
        canCreateClasses: false,
        unlimitedReading: false
      },
      basic: {
        maxStudents: 30,
        maxDownloads: 20,
        canAccessPremium: true,
        canDownloadPDF: true,
        canCreateClasses: false,
        unlimitedReading: true
      },
      educator: {
        maxStudents: 100,
        maxDownloads: 50,
        canAccessPremium: true,
        canDownloadPDF: true,
        canCreateClasses: true,
        unlimitedReading: true
      },
      institution: {
        maxStudents: -1,
        maxDownloads: -1,
        canAccessPremium: true,
        canDownloadPDF: true,
        canCreateClasses: true,
        unlimitedReading: true
      }
    }
    
    const features = planFeatures[planId as keyof typeof planFeatures]
    
    let subscription
    
    if (currentSubscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          plan: planId.toUpperCase() as any,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelledAt: null,
          ...features
        }
      })
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: planId.toUpperCase() as any,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          ...features
        }
      })
    }
    
    // Log subscription change
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: currentSubscription ? 'SUBSCRIPTION_UPDATED' : 'SUBSCRIPTION_CREATED',
        entity: 'SUBSCRIPTION',
        entityId: subscription.id,
        metadata: {
          newPlan: planId,
          previousPlan: currentSubscription?.plan || null,
          paymentMethod
        }
      }
    }).catch(() => {}) // Fail silently for analytics
    
    // In a real implementation, this is where you would:
    // 1. Create or update Stripe subscription
    // 2. Handle payment processing
    // 3. Set up webhooks for subscription changes
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        features: features
      },
      message: `Successfully ${currentSubscription ? 'updated' : 'created'} ${planId} subscription`,
      nextSteps: {
        message: planId === 'free' 
          ? 'You now have access to free stories!' 
          : 'Payment processing required to activate premium features',
        paymentRequired: planId !== 'free'
      }
    })
    
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subscriptions
 * 
 * Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }
    
    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      )
    }
    
    // Cancel subscription (downgrade to free)
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        plan: 'FREE',
        status: 'CANCELLED',
        cancelledAt: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Grace period
        maxStudents: 0,
        maxDownloads: 3,
        canAccessPremium: false,
        canDownloadPDF: false,
        canCreateClasses: false,
        unlimitedReading: false
      }
    })
    
    // Log cancellation
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'SUBSCRIPTION_CANCELLED',
        entity: 'SUBSCRIPTION',
        entityId: subscription.id,
        metadata: {
          previousPlan: subscription.plan,
          cancelledAt: new Date()
        }
      }
    }).catch(() => {}) // Fail silently for analytics
    
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: updatedSubscription.id,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        cancelledAt: updatedSubscription.cancelledAt,
        endDate: updatedSubscription.endDate
      },
      gracePeriod: {
        message: 'You will retain access to premium features until your billing period ends',
        accessUntil: updatedSubscription.endDate
      }
    })
    
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get user usage statistics
 */
async function getUserUsageStats(userId: string) {
  const [studentCount, downloadCount, classCount] = await Promise.all([
    // Count students in user's classes
    prisma.classEnrollment.count({
      where: {
        class: {
          teacherId: userId
        }
      }
    }),
    // Count downloads this month (placeholder - would need to track actual downloads)
    0, // await getDownloadCount(userId)
    // Count active classes
    prisma.class.count({
      where: {
        teacherId: userId,
        isActive: true
      }
    })
  ])
  
  return {
    studentsEnrolled: studentCount,
    downloadsThisMonth: downloadCount,
    activeClasses: classCount
  }
}