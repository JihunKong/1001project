import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { performMonthlyRotation, shouldSkipRotation } from '@/lib/featured-rotation'

export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

/**
 * POST /api/admin/featured/rotate
 * 
 * Manual trigger for featured book rotation (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { force = false } = await request.json()

    // Check if rotation should be skipped (unless forced)
    if (!force) {
      const skipRotation = await shouldSkipRotation()
      if (skipRotation) {
        return NextResponse.json({
          success: false,
          message: 'Rotation blocked due to global settings. Use force: true to override.',
          blocked: true,
          reason: 'Global public reading is enabled'
        })
      }
    }

    // Perform the rotation
    const result = await performMonthlyRotation()

    if (result.success) {
      // Log the manual rotation for audit
      console.log('Manual featured rotation triggered by admin:', {
        adminId: session.user.id,
        adminEmail: session.user.email,
        forced: force,
        featuredSetId: result.featuredSetId,
        selectedBooks: result.selectedBooks,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: 'Featured books rotated successfully',
        data: {
          featuredSetId: result.featuredSetId,
          selectedBooks: result.selectedBooks,
          previousSetId: result.previousSetId,
          triggeredBy: session.user.email,
          forced: force,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        {
          error: 'Failed to perform rotation',
          details: result.error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in manual featured rotation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute rotation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}