import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import RoleSystemAnalytics, { formatMetricsForDashboard } from '@/lib/monitoring/role-system-analytics'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Require admin access for analytics
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const url = new URL(request.url)
    const timeframe = parseInt(url.searchParams.get('timeframe') || '30')
    const format = url.searchParams.get('format') || 'dashboard'
    
    const analytics = new RoleSystemAnalytics()
    const metrics = await analytics.generateComprehensiveReport()
    
    if (format === 'raw') {
      return NextResponse.json({
        success: true,
        data: metrics,
        generatedAt: new Date().toISOString(),
        timeframe
      })
    }
    
    // Format for dashboard consumption
    const dashboardData = formatMetricsForDashboard(metrics)
    
    // Add additional context
    const contextData = {
      roleSystemChanges: {
        roleSelectionRemoved: true,
        defaultCustomerRole: true,
        unifiedDashboard: true,
        adminRoleManagement: true,
        progressiveFeatureDiscovery: true
      },
      currentProductionUsers: {
        total: metrics.userMigrationSuccess.totalUsers,
        learnerToCustomerMigrations: metrics.userMigrationSuccess.learnerToCustomerMigrations,
        satisfactionScore: metrics.businessImpact.userSatisfactionScore
      },
      keyInsights: await generateKeyInsights(metrics),
      recommendations: await generateRecommendations(metrics)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...dashboardData,
        context: contextData
      },
      generatedAt: new Date().toISOString(),
      timeframe
    })
    
  } catch (error) {
    console.error('Error generating role system analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics report' },
      { status: 500 }
    )
  }
}

async function generateKeyInsights(metrics: any) {
  const insights = []
  
  // Migration success insights
  if (metrics.userMigrationSuccess.migrationSuccessRate > 95) {
    insights.push({
      type: 'success',
      category: 'Role Migration',
      message: `Excellent migration success rate of ${metrics.userMigrationSuccess.migrationSuccessRate.toFixed(1)}%`,
      impact: 'high',
      actionRequired: false
    })
  } else if (metrics.userMigrationSuccess.migrationSuccessRate < 80) {
    insights.push({
      type: 'warning',
      category: 'Role Migration',
      message: `Migration success rate of ${metrics.userMigrationSuccess.migrationSuccessRate.toFixed(1)}% needs attention`,
      impact: 'high',
      actionRequired: true,
      recommendation: 'Review failed migrations and implement automated retry mechanism'
    })
  }
  
  // User engagement insights
  if (metrics.userEngagement.bounceRate < 20) {
    insights.push({
      type: 'success',
      category: 'User Engagement',
      message: `Low bounce rate of ${metrics.userEngagement.bounceRate.toFixed(1)}% indicates strong engagement`,
      impact: 'medium',
      actionRequired: false
    })
  } else if (metrics.userEngagement.bounceRate > 60) {
    insights.push({
      type: 'critical',
      category: 'User Engagement',
      message: `High bounce rate of ${metrics.userEngagement.bounceRate.toFixed(1)}% suggests onboarding issues`,
      impact: 'high',
      actionRequired: true,
      recommendation: 'Optimize landing pages and improve initial user experience'
    })
  }
  
  // Feature adoption insights
  if (metrics.featureAdoption.featureDiscoveryRate > 80) {
    insights.push({
      type: 'success',
      category: 'Feature Discovery',
      message: `High feature discovery rate of ${metrics.featureAdoption.featureDiscoveryRate.toFixed(1)}%`,
      impact: 'medium',
      actionRequired: false
    })
  } else if (metrics.featureAdoption.featureDiscoveryRate < 50) {
    insights.push({
      type: 'warning',
      category: 'Feature Discovery',
      message: `Low feature discovery rate of ${metrics.featureAdoption.featureDiscoveryRate.toFixed(1)}%`,
      impact: 'medium',
      actionRequired: true,
      recommendation: 'Implement progressive disclosure and guided onboarding'
    })
  }
  
  // System performance insights
  if (metrics.systemPerformance.errorRate > 5) {
    insights.push({
      type: 'critical',
      category: 'System Performance',
      message: `Error rate of ${metrics.systemPerformance.errorRate.toFixed(1)}% is above acceptable threshold`,
      impact: 'high',
      actionRequired: true,
      recommendation: 'Investigate and fix high-frequency errors immediately'
    })
  }
  
  return insights
}

async function generateRecommendations(metrics: any) {
  const recommendations = []
  
  // Based on migration success rate
  if (metrics.userMigrationSuccess.migrationSuccessRate > 95) {
    recommendations.push({
      priority: 'medium',
      category: 'Expansion',
      title: 'Scale Migration Strategy',
      description: 'With 95%+ success rate, consider expanding automated role transitions to additional user segments',
      estimatedImpact: 'medium',
      effort: 'medium',
      timeline: '2-3 weeks'
    })
  }
  
  // Based on user engagement
  if (metrics.userEngagement.averageSessionDuration < 300) { // 5 minutes
    recommendations.push({
      priority: 'high',
      category: 'Engagement',
      title: 'Improve Session Duration',
      description: 'Average session duration is below 5 minutes. Implement sticky features and progress tracking',
      estimatedImpact: 'high',
      effort: 'medium',
      timeline: '1-2 weeks'
    })
  }
  
  // Based on feature adoption
  const topFeature = metrics.featureAdoption.topFeatures[0]
  if (topFeature && topFeature.errorRate > 10) {
    recommendations.push({
      priority: 'high',
      category: 'Feature Quality',
      title: `Fix ${topFeature.name} Feature Issues`,
      description: `Most-used feature "${topFeature.name}" has ${topFeature.errorRate.toFixed(1)}% error rate`,
      estimatedImpact: 'high',
      effort: 'low',
      timeline: '3-5 days'
    })
  }
  
  // Based on business impact
  if (metrics.businessImpact.signupCompletionRate < 80) {
    recommendations.push({
      priority: 'high',
      category: 'Onboarding',
      title: 'Optimize Signup Flow',
      description: `${metrics.businessImpact.signupCompletionRate.toFixed(1)}% completion rate suggests friction in signup process`,
      estimatedImpact: 'high',
      effort: 'medium',
      timeline: '1 week'
    })
  }
  
  // Advanced recommendations based on patterns
  if (metrics.userEngagement.returnUserRate > 70) {
    recommendations.push({
      priority: 'low',
      category: 'Growth',
      title: 'Leverage High Return Rate',
      description: 'High return user rate indicates good product-market fit. Consider referral program',
      estimatedImpact: 'medium',
      effort: 'high',
      timeline: '4-6 weeks'
    })
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
  })
}

// Additional endpoint for user journey analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { userId, timeframe = 7, analysisType = 'journey' } = await request.json()
    
    const analytics = new RoleSystemAnalytics()
    
    if (analysisType === 'journey') {
      const journeys = await analytics.getUserJourneyAnalysis(userId, timeframe)
      
      return NextResponse.json({
        success: true,
        data: {
          userJourneys: journeys,
          summary: {
            totalSessions: journeys.length,
            uniqueUsers: new Set(journeys.map(j => j.userId).filter(Boolean)).size,
            averageEngagement: journeys.reduce((sum, j) => sum + j.engagementScore, 0) / journeys.length,
            bounceRate: (journeys.filter(j => j.bounced).length / journeys.length) * 100
          }
        },
        generatedAt: new Date().toISOString()
      })
    }
    
    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    
  } catch (error) {
    console.error('Error in user journey analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate user journey analysis' },
      { status: 500 }
    )
  }
}