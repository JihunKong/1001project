import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const data = await request.json()
    
    // Validate required fields
    if (!data.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Get user agent details
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create or update analytics record
    const analytics = await prisma.userAnalytics.upsert({
      where: {
        sessionId: data.sessionId
      },
      update: {
        sessionEnd: data.sessionEnd ? new Date(data.sessionEnd) : new Date(),
        totalDuration: data.totalDuration || 0,
        pageViews: data.pageViews || 0,
        clickCount: data.clickCount || 0,
        scrollDepth: data.scrollDepth || 0,
        exitPage: data.exitPage,
        pageSequence: data.pageSequence || null,
        featuresUsed: data.featuresUsed || [],
        actionsPerformed: data.actionsPerformed || null,
        errorsEncountered: data.errorsEncountered || [],
        engagementScore: data.engagementScore || 0,
        bounceRate: data.bounceRate !== undefined ? data.bounceRate : true
      },
      create: {
        userId: session?.user?.id,
        sessionId: data.sessionId,
        userRole: data.userRole || session?.user?.role,
        isNewUser: data.isNewUser || false,
        migrationDate: data.migrationDate ? new Date(data.migrationDate) : null,
        sessionStart: data.sessionStart ? new Date(data.sessionStart) : new Date(),
        sessionEnd: data.sessionEnd ? new Date(data.sessionEnd) : new Date(),
        totalDuration: data.totalDuration || 0,
        pageViews: data.pageViews || 0,
        clickCount: data.clickCount || 0,
        scrollDepth: data.scrollDepth || 0,
        landingPage: data.landingPage,
        exitPage: data.exitPage,
        pageSequence: data.pageSequence || null,
        featuresUsed: data.featuresUsed || [],
        actionsPerformed: data.actionsPerformed || null,
        errorsEncountered: data.errorsEncountered || [],
        userAgent,
        deviceType: data.deviceType,
        browserName: data.browserName,
        operatingSystem: data.operatingSystem,
        screenResolution: data.screenResolution,
        engagementScore: data.engagementScore || 0,
        bounceRate: data.bounceRate !== undefined ? data.bounceRate : true,
        returnVisitor: data.returnVisitor || false
      }
    })
    
    return NextResponse.json({ 
      success: true,
      analyticsId: analytics.id
    })
    
  } catch (error) {
    console.error('Error saving session analytics:', error)
    return NextResponse.json(
      { error: 'Failed to save session analytics' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || '7d'
    const role = url.searchParams.get('role')
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeframe) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }
    
    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: now
      }
    }
    
    if (role && role !== 'all') {
      where.userRole = role
    }
    
    // Get analytics data
    const analytics = await prisma.userAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit for performance
    })
    
    // Calculate aggregated metrics
    const totalSessions = analytics.length
    const uniqueUsers = new Set(analytics.map(a => a.userId).filter(Boolean)).size
    const avgEngagementScore = analytics.reduce((sum, a) => sum + a.engagementScore, 0) / totalSessions
    const avgSessionDuration = analytics.reduce((sum, a) => sum + a.totalDuration, 0) / totalSessions
    const bounceRate = analytics.filter(a => a.bounceRate).length / totalSessions
    
    // Feature usage analysis
    const featureUsage = analytics.reduce((acc, session) => {
      session.featuresUsed.forEach(feature => {
        acc[feature] = (acc[feature] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    // Role distribution
    const roleDistribution = analytics.reduce((acc, session) => {
      const role = session.userRole || 'Unknown'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSessions,
          uniqueUsers,
          avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
          avgSessionDuration: Math.round(avgSessionDuration),
          bounceRate: Math.round(bounceRate * 100)
        },
        featureUsage,
        roleDistribution,
        sessions: analytics.slice(0, 100) // Return first 100 sessions for detailed view
      }
    })
    
  } catch (error) {
    console.error('Error fetching session analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session analytics' },
      { status: 500 }
    )
  }
}