import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  initiateDeletionRequest, 
  validateDeletionRequest,
  getDeletionStatus 
} from '@/lib/gdpr-deletion'
import { headers } from 'next/headers'

/**
 * GDPR Article 17 (Right to Erasure) API Endpoint
 * 
 * Handles user account deletion requests with full COPPA compliance
 * and comprehensive audit logging.
 */

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string, limit: number = 3, windowMs: number = 3600000): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

/**
 * GET /api/user/delete-account
 * 
 * Returns the current deletion status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const status = await getDeletionStatus(session.user.id)
    
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error getting deletion status:', error)
    return NextResponse.json(
      { error: 'Failed to get deletion status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/delete-account
 * 
 * Initiates account deletion request with validation and rate limiting
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

    // Rate limiting
    const headersList = await headers()
    const clientIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const rateLimitKey = `delete_${session.user.id}_${clientIP}`
    
    if (!checkRateLimit(rateLimitKey, 3, 3600000)) { // 3 requests per hour
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many deletion requests. Please try again in 1 hour.'
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { reason, confirmationPhrase } = body

    // Validate confirmation phrase (optional additional security)
    if (process.env.NODE_ENV === 'production' && confirmationPhrase !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { 
          error: 'Invalid confirmation',
          message: 'Please type "DELETE MY ACCOUNT" to confirm deletion request'
        },
        { status: 400 }
      )
    }

    // Validate deletion request
    const validation = await validateDeletionRequest(session.user.id)
    
    if (!validation.canDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete account',
          blockers: validation.blockers,
          warnings: validation.warnings
        },
        { status: 400 }
      )
    }

    // Get enhanced request metadata for audit trail
    const userAgent = headersList.get('user-agent')
    const ipAddress = clientIP
    const sessionToken = headersList.get('authorization') || headersList.get('cookie')
    const sessionId = sessionToken ? sessionToken.substring(0, 16) + '...' : undefined
    const referer = headersList.get('referer')
    const acceptLanguage = headersList.get('accept-language')

    // Initiate deletion request with enhanced audit context
    const result = await initiateDeletionRequest({
      userId: session.user.id,
      reason: reason || 'User requested account deletion',
      requestSource: 'self_service',
      ipAddress,
      userAgent: userAgent || undefined,
      sessionId,
      performedBy: session.user.id,
      performedByRole: session.user.role
    })

    // Enhanced security logging for deletion request initiation
    console.log(`SECURITY_AUDIT: Deletion request initiated`, {
      userId: session.user.id,
      requestId: result.deletionRequest.id,
      status: result.deletionRequest.status,
      requiresParentalConsent: validation.requiresParentalConsent,
      requiresReview: validation.requiresReview,
      ipAddress: ipAddress.substring(0, 8) + '...', // Partial IP for privacy
      userAgent: userAgent?.substring(0, 50) + '...',
      timestamp: new Date().toISOString(),
      sessionId
    })

    return NextResponse.json({
      success: true,
      requestId: result.deletionRequest.id,
      status: result.deletionRequest.status,
      message: getDeletionMessage(result.deletionRequest.status, validation),
      nextSteps: result.nextSteps,
      validation: {
        requiresParentalConsent: validation.requiresParentalConsent,
        requiresReview: validation.requiresReview,
        warnings: validation.warnings
      },
      timeline: getDeletionTimeline(validation)
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error initiating deletion request:', error)
    
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === 'development' 
      ? (error as Error).message 
      : 'Failed to process deletion request'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/delete-account
 * 
 * Handles deletion confirmation and other post-initiation actions
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
    const { action, token } = body

    switch (action) {
      case 'confirm':
        // Handle final confirmation (implementation depends on token validation)
        return NextResponse.json({
          message: 'Confirmation processing not yet implemented'
        })
        
      case 'cancel':
        // Handle deletion request cancellation
        return NextResponse.json({
          message: 'Cancellation processing not yet implemented'
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error processing deletion action:', error)
    return NextResponse.json(
      { error: 'Failed to process deletion action' },
      { status: 500 }
    )
  }
}

/**
 * Generate user-friendly deletion status message
 */
function getDeletionMessage(status: string, validation: any): string {
  switch (status) {
    case 'PENDING':
      return 'Your deletion request has been received and is being processed.'
      
    case 'PARENTAL_CONSENT_REQUIRED':
      return 'Parental consent is required for account deletion. A confirmation email has been sent to your parent/guardian.'
      
    case 'REVIEW_REQUIRED':
      return 'Your account requires manual review due to active commitments. Our team will process your request within 5 business days.'
      
    case 'CONFIRMED':
      return 'Your deletion request has been confirmed. Your account will be deactivated shortly.'
      
    case 'SOFT_DELETED':
      return 'Your account has been deactivated. You have 7 days to recover it if you change your mind.'
      
    case 'HARD_DELETED':
      return 'Your account has been permanently deleted.'
      
    default:
      return 'Your deletion request is being processed.'
  }
}

/**
 * Generate deletion timeline based on validation requirements
 */
function getDeletionTimeline(validation: any): string[] {
  const timeline: string[] = []
  
  if (validation.requiresParentalConsent) {
    timeline.push('Day 1: Parental consent email sent')
    timeline.push('Day 1-7: Awaiting parental approval')
  }
  
  if (validation.requiresReview) {
    timeline.push('Day 1-5: Manual review of active commitments')
  }
  
  if (!validation.requiresParentalConsent && !validation.requiresReview) {
    timeline.push('Day 1: Final confirmation email sent')
    timeline.push('Day 1: Account deactivated (soft delete)')
  }
  
  timeline.push('Day 7-8: Account permanently deleted (hard delete)')
  
  return timeline
}