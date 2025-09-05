import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAuditReport, exportAuditReport } from '@/lib/audit-reporting'

/**
 * Admin API for Audit Report Generation
 * 
 * Generates comprehensive compliance and security reports
 * for GDPR/COPPA auditing purposes.
 */

/**
 * GET /api/admin/audit/reports
 * 
 * Retrieves available audit reports and report templates
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
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list':
        return NextResponse.json({
          success: true,
          reportTypes: [
            {
              type: 'DAILY',
              name: 'Daily Audit Report',
              description: 'Daily summary of deletion activities and compliance status',
              schedule: 'Automated daily at 00:00 UTC'
            },
            {
              type: 'WEEKLY',
              name: 'Weekly Compliance Report',
              description: 'Weekly overview of GDPR/COPPA compliance metrics',
              schedule: 'Automated weekly on Mondays'
            },
            {
              type: 'MONTHLY',
              name: 'Monthly Security Report',
              description: 'Comprehensive monthly security and compliance analysis',
              schedule: 'Automated monthly on 1st day'
            },
            {
              type: 'QUARTERLY',
              name: 'Quarterly Audit Report',
              description: 'Detailed quarterly report for regulatory compliance',
              schedule: 'Manual generation required'
            },
            {
              type: 'ANNUAL',
              name: 'Annual Compliance Report',
              description: 'Complete annual audit for external compliance review',
              schedule: 'Manual generation required'
            }
          ],
          exportFormats: ['JSON', 'CSV', 'PDF'],
          lastGenerated: new Date().toISOString()
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error handling audit reports request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/audit/reports
 * 
 * Generates new audit reports
 */
export async function POST(request: NextRequest) {
  let session = null
  try {
    session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      reportType, 
      startDate, 
      endDate, 
      exportFormat = 'JSON',
      includeRecommendations = true 
    } = body

    // Validate report type
    const validTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']
    if (!validTypes.includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      )
    }

    // Validate date range if provided
    let parsedStartDate: Date | undefined
    let parsedEndDate: Date | undefined
    
    if (startDate) {
      parsedStartDate = new Date(startDate)
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date' },
          { status: 400 }
        )
      }
    }
    
    if (endDate) {
      parsedEndDate = new Date(endDate)
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date' },
          { status: 400 }
        )
      }
    }

    // Generate the audit report
    console.log(`AUDIT_REPORT: Generation started`, {
      reportType,
      requestedBy: session.user.id,
      startDate: parsedStartDate?.toISOString(),
      endDate: parsedEndDate?.toISOString(),
      timestamp: new Date().toISOString()
    })

    const report = await generateAuditReport(
      reportType as any,
      parsedStartDate,
      parsedEndDate,
      'ADMIN'
    )

    // Export in requested format if not JSON
    let exportedContent: string | undefined
    if (exportFormat !== 'JSON') {
      exportedContent = await exportAuditReport(report, exportFormat as any)
    }

    // Log successful generation
    console.log(`AUDIT_REPORT: Generation completed`, {
      reportId: report.id,
      reportType,
      complianceStatus: report.complianceStatus,
      generatedBy: session.user.id,
      totalRequests: report.summary.totalDeletionRequests,
      complianceRate: report.summary.complianceRate,
      timestamp: new Date().toISOString()
    })

    const response = {
      success: true,
      report: {
        id: report.id,
        type: report.reportType,
        period: {
          start: report.period.start.toISOString(),
          end: report.period.end.toISOString()
        },
        generatedAt: report.generatedAt.toISOString(),
        generatedBy: report.generatedBy,
        complianceStatus: report.complianceStatus,
        summary: report.summary,
        ...(includeRecommendations && { 
          recommendations: report.recommendations 
        })
      },
      exportFormat,
      ...(exportedContent && { exportedContent })
    }

    // Set appropriate headers for file downloads
    if (exportFormat === 'CSV') {
      return new NextResponse(exportedContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-report-${report.id}.csv"`
        }
      })
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error generating audit report:', error)
    
    // Log error for audit purposes
    console.log(`AUDIT_REPORT_ERROR: Generation failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestedBy: session?.user?.id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate audit report',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}