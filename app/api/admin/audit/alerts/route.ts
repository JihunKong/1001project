import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getActiveAlerts, 
  resolveAlert, 
  getAlertStatistics,
  initializeAuditMonitoring
} from '@/lib/audit-monitoring'

/**
 * Admin API for Real-time Audit Alert Management
 * 
 * Provides access to security alerts and monitoring capabilities
 * for deletion audit logs.
 */

// Initialize monitoring on server start
initializeAuditMonitoring()

/**
 * GET /api/admin/audit/alerts
 * 
 * Retrieves active security alerts and monitoring statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'active'
    const timeWindow = parseInt(searchParams.get('timeWindow') || '24')

    let responseData: any = {}

    switch (view) {
      case 'active':
        responseData = {
          alerts: getActiveAlerts(),
          statistics: getAlertStatistics(timeWindow)
        }
        break
        
      case 'statistics':
        responseData = {
          statistics: getAlertStatistics(timeWindow),
          timeWindow: `${timeWindow} hours`
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid view parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      view,
      data: responseData,
      generatedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error fetching audit alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/audit/alerts
 * 
 * Handles alert resolution and management actions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, alertId, notes } = body

    switch (action) {
      case 'resolve':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }
        
        const resolved = await resolveAlert(alertId, session.user.id, notes)
        
        if (!resolved) {
          return NextResponse.json(
            { error: 'Alert not found or already resolved' },
            { status: 404 }
          )
        }
        
        // Log admin action
        console.log(`ADMIN_ACTION: Alert resolved`, {
          alertId,
          resolvedBy: session.user.id,
          notes: notes || 'No notes provided',
          timestamp: new Date().toISOString()
        })
        
        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully',
          alertId,
          resolvedBy: session.user.id,
          resolvedAt: new Date().toISOString()
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error processing alert action:', error)
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    )
  }
}