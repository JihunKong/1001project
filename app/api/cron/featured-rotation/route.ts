import { NextRequest, NextResponse } from 'next/server'
import { performMonthlyRotation, shouldSkipRotation } from '@/lib/featured-rotation'

export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

/**
 * POST /api/cron/featured-rotation
 * 
 * Endpoint for monthly featured book rotation
 * This should be called by a cron job service (e.g., Vercel Cron, GitHub Actions, or server cron)
 */
export async function POST(request: NextRequest) {
  try {
    // Basic security check - in production, you'd want a proper cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    // Check if rotation should be skipped
    const skipRotation = await shouldSkipRotation()
    if (skipRotation) {
      return NextResponse.json({
        success: true,
        message: 'Rotation skipped due to global settings',
        skipped: true
      })
    }

    // Perform the rotation
    const result = await performMonthlyRotation()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Monthly featured rotation completed successfully',
        data: {
          featuredSetId: result.featuredSetId,
          selectedBooks: result.selectedBooks,
          previousSetId: result.previousSetId,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        {
          error: 'Failed to perform monthly rotation',
          details: result.error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in featured rotation cron job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute rotation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/featured-rotation
 * 
 * Health check endpoint for the cron job
 */
export async function GET(request: NextRequest) {
  try {
    // Basic info about the rotation system
    const skipRotation = await shouldSkipRotation()
    
    return NextResponse.json({
      success: true,
      message: 'Featured rotation cron endpoint is healthy',
      rotationEnabled: !skipRotation,
      nextScheduledRotation: getNextRotationDate(),
      endpoint: '/api/cron/featured-rotation',
      method: 'POST',
      schedule: '0 0 1 * *', // First day of every month at midnight
      description: 'Monthly featured book rotation system'
    })

  } catch (error) {
    console.error('Error in rotation health check:', error)
    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate the next rotation date (first day of next month)
 */
function getNextRotationDate(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toISOString()
}