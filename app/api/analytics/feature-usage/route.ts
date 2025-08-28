import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const data = await request.json()
    
    // Validate required fields
    if (!data.featureName) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      )
    }
    
    // Generate unique key for feature usage tracking
    const uniqueKey = `${data.userId || 'anonymous'}_${data.sessionId || 'no-session'}_${data.featureName}`
    
    // Create or update feature usage record
    const featureUsage = await prisma.featureUsage.upsert({
      where: {
        userId_sessionId_featureName: {
          userId: data.userId || null,
          sessionId: data.sessionId || null,
          featureName: data.featureName
        }
      },
      update: {
        accessCount: { increment: 1 },
        lastAccessed: new Date(),
        taskCompleted: data.taskCompleted || false,
        errorEncountered: data.errorEncountered || false,
        helpSought: data.helpSought || false
      },
      create: {
        userId: data.userId || null,
        sessionId: data.sessionId || null,
        featureName: data.featureName,
        featureCategory: data.featureCategory,
        accessCount: 1,
        totalTimeSpent: data.timeSpent || 0,
        avgTimePerAccess: data.timeSpent || 0,
        lastAccessed: new Date(),
        userRole: data.userRole || session?.user?.role,
        deviceType: data.deviceType,
        taskCompleted: data.taskCompleted || false,
        errorEncountered: data.errorEncountered || false,
        helpSought: data.helpSought || false
      }
    })
    
    return NextResponse.json({ 
      success: true,
      usageId: featureUsage.id
    })
    
  } catch (error) {
    console.error('Error tracking feature usage:', error)
    return NextResponse.json(
      { error: 'Failed to track feature usage' },
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
    const feature = url.searchParams.get('feature')
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
      default:
        startDate.setDate(now.getDate() - 7)
    }
    
    // Build where clause
    const where: any = {
      lastAccessed: {
        gte: startDate,
        lte: now
      }
    }
    
    if (feature && feature !== 'all') {
      where.featureName = feature
    }
    
    if (role && role !== 'all') {
      where.userRole = role
    }
    
    // Get feature usage data
    const featureUsage = await prisma.featureUsage.findMany({
      where,
      orderBy: { lastAccessed: 'desc' }
    })
    
    // Aggregate by feature
    const featureStats = featureUsage.reduce((acc, usage) => {
      const feature = usage.featureName
      if (!acc[feature]) {
        acc[feature] = {
          name: feature,
          category: usage.featureCategory,
          totalAccess: 0,
          uniqueUsers: new Set(),
          avgTimePerAccess: 0,
          completionRate: 0,
          errorRate: 0,
          helpRate: 0,
          usageByRole: {} as Record<string, number>
        }
      }
      
      acc[feature].totalAccess += usage.accessCount
      if (usage.userId) acc[feature].uniqueUsers.add(usage.userId)
      acc[feature].avgTimePerAccess += usage.avgTimePerAccess
      
      if (usage.taskCompleted) acc[feature].completionRate++
      if (usage.errorEncountered) acc[feature].errorRate++
      if (usage.helpSought) acc[feature].helpRate++
      
      const role = usage.userRole || 'Unknown'
      acc[feature].usageByRole[role] = (acc[feature].usageByRole[role] || 0) + usage.accessCount
      
      return acc
    }, {} as Record<string, any>)
    
    // Calculate percentages and averages
    Object.values(featureStats).forEach((stats: any) => {
      const totalUsers = stats.uniqueUsers.size || 1
      stats.uniqueUsers = stats.uniqueUsers.size
      stats.avgTimePerAccess = Math.round((stats.avgTimePerAccess / totalUsers) * 100) / 100
      stats.completionRate = Math.round((stats.completionRate / totalUsers) * 100)
      stats.errorRate = Math.round((stats.errorRate / totalUsers) * 100)
      stats.helpRate = Math.round((stats.helpRate / totalUsers) * 100)
    })
    
    // Get top features by usage
    const topFeatures = Object.values(featureStats)
      .sort((a: any, b: any) => b.totalAccess - a.totalAccess)
      .slice(0, 10)
    
    // Get features by role
    const featuresByRole = featureUsage.reduce((acc, usage) => {
      const role = usage.userRole || 'Unknown'
      if (!acc[role]) acc[role] = {}
      
      const feature = usage.featureName
      acc[role][feature] = (acc[role][feature] || 0) + usage.accessCount
      
      return acc
    }, {} as Record<string, Record<string, number>>)
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalFeatures: Object.keys(featureStats).length,
          totalUsage: featureUsage.reduce((sum, usage) => sum + usage.accessCount, 0),
          uniqueUsers: new Set(featureUsage.map(u => u.userId).filter(Boolean)).size,
          avgCompletionRate: Math.round(
            Object.values(featureStats).reduce((sum: number, stats: any) => sum + stats.completionRate, 0) / 
            Object.values(featureStats).length
          )
        },
        topFeatures,
        featuresByRole,
        allFeatures: Object.values(featureStats)
      }
    })
    
  } catch (error) {
    console.error('Error fetching feature usage analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature usage analytics' },
      { status: 500 }
    )
  }
}