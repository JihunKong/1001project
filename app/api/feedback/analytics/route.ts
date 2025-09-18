import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const category = url.searchParams.get('category')
    
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
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    // Get all feedback
    const feedback = await prisma.userFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })
    
    // Get role migrations
    const roleMigrations = await prisma.roleMigration.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })
    
    // Calculate summary statistics
    const summary = {
      totalFeedback: feedback.length,
      roleMigrationFeedback: feedback.filter(f => f.feedbackType === 'ROLE_MIGRATION').length,
      bugReports: feedback.filter(f => f.feedbackType === 'BUG_REPORT').length,
      featureRequests: feedback.filter(f => f.feedbackType === 'FEATURE_REQUEST').length,
      avgRating: feedback
        .filter(f => f.rating)
        .reduce((sum, f, _, arr) => sum + (f.rating! / arr.length), 0),
      criticalIssues: feedback.filter(f => f.severity === 'CRITICAL').length,
      resolvedIssues: feedback.filter(f => f.isResolved).length
    }
    
    // Sentiment breakdown
    const sentimentBreakdown = feedback.reduce((acc, f) => {
      if (f.sentiment) {
        acc[f.sentiment] = (acc[f.sentiment] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    // Feedback by type
    const feedbackByType = feedback.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Feedback by role
    const feedbackByRole = feedback.reduce((acc, f) => {
      const role = f.userRole || 'Unknown'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Top issues (by frequency of similar messages)
    const issueKeywords = feedback
      .filter(f => f.bugReport || f.severity !== 'LOW')
      .map(f => ({
        message: f.message.toLowerCase(),
        severity: f.severity
      }))
    
    const topIssues = issueKeywords
      .reduce((acc, issue) => {
        // Simple keyword extraction (can be improved with NLP)
        const words = issue.message.split(' ').filter(w => w.length > 3)
        words.forEach(word => {
          if (!acc[word]) {
            acc[word] = { count: 0, severity: issue.severity }
          }
          acc[word].count++
        })
        return acc
      }, {} as Record<string, { count: number; severity: string }>)
    
    const topIssuesList = Object.entries(topIssues)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        severity: data.severity
      }))
    
    // Role migration analysis
    const roleMigrationAnalysis = roleMigrations.reduce((acc, migration) => {
      const key = `${migration.fromRole}_to_${migration.toRole}`
      if (!acc[key]) {
        acc[key] = {
          fromRole: migration.fromRole,
          toRole: migration.toRole,
          count: 0,
          satisfactionRatings: [] as number[]
        }
      }
      acc[key].count++
      if (migration.satisfactionRating) {
        acc[key].satisfactionRatings.push(migration.satisfactionRating)
      }
      return acc
    }, {} as Record<string, any>)
    
    const roleMigrationSummary = Object.values(roleMigrationAnalysis).map((data: any) => ({
      fromRole: data.fromRole,
      toRole: data.toRole,
      count: data.count,
      satisfactionRating: data.satisfactionRatings.length > 0 
        ? data.satisfactionRatings.reduce((a: number, b: number) => a + b, 0) / data.satisfactionRatings.length
        : 0
    }))
    
    // Recent critical feedback
    const criticalFeedback = feedback
      .filter(f => f.severity === 'CRITICAL' || f.feedbackType === 'BUG_REPORT')
      .slice(0, 10)
      .map(f => ({
        id: f.id,
        type: f.feedbackType,
        severity: f.severity,
        message: f.message.substring(0, 100) + (f.message.length > 100 ? '...' : ''),
        page: f.page,
        userRole: f.userRole,
        createdAt: f.createdAt,
        isResolved: f.isResolved
      }))
    
    // Time series data for trends
    const timeSeriesData = feedback.reduce((acc, f) => {
      const date = f.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          bugReports: 0,
          roleMigration: 0,
          ratings: [] as number[]
        }
      }
      acc[date].total++
      if (f.feedbackType === 'BUG_REPORT') acc[date].bugReports++
      if (f.feedbackType === 'ROLE_MIGRATION') acc[date].roleMigration++
      if (f.rating) acc[date].ratings.push(f.rating)
      return acc
    }, {} as Record<string, any>)
    
    const trends = Object.values(timeSeriesData)
      .map((day: any) => ({
        ...day,
        avgRating: day.ratings.length > 0 
          ? day.ratings.reduce((a: number, b: number) => a + b, 0) / day.ratings.length 
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return NextResponse.json({
      success: true,
      summary,
      sentimentBreakdown,
      feedbackByType,
      feedbackByRole,
      topIssues: topIssuesList,
      roleMigrations: roleMigrationSummary,
      criticalFeedback,
      trends,
      data: {
        feedback: feedback.slice(0, 50), // Return first 50 for detailed view
        roleMigrations: roleMigrations.slice(0, 50)
      }
    })
    
  } catch (error) {
    console.error('Error fetching feedback analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback analytics' },
      { status: 500 }
    )
  }
}