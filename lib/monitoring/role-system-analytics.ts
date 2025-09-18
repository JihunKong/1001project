import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export interface RoleSystemMetrics {
  userMigrationSuccess: {
    totalUsers: number
    learnerToCustomerMigrations: number
    migrationSuccessRate: number
    averageAdaptationTime: number
    satisfactionScore: number
  }
  
  userEngagement: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    averageSessionDuration: number
    bounceRate: number
    returnUserRate: number
  }
  
  featureAdoption: {
    topFeatures: Array<{
      name: string
      category: string
      totalUsage: number
      uniqueUsers: number
      completionRate: number
      errorRate: number
    }>
    featureDiscoveryRate: number
    featureUsageByRole: Record<string, Record<string, number>>
  }
  
  systemPerformance: {
    averagePageLoadTime: number
    apiResponseTime: number
    errorRate: number
    uptime: number
  }
  
  businessImpact: {
    signupCompletionRate: number
    userSatisfactionScore: number
    supportTicketReduction: number
    adminEfficiencyGain: number
  }
}

export class RoleSystemAnalytics {
  
  async getUserMigrationMetrics(timeframe: number = 30): Promise<RoleSystemMetrics['userMigrationSuccess']> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeframe)
    
    // Get all users and their migration data
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        roleMigrations: true
      }
    })
    
    const roleMigrations = await prisma.roleMigration.findMany({
      where: {
        completedAt: { gte: startDate }
      }
    })
    
    const learnerToCustomerMigrations = roleMigrations.filter(
      m => m.fromRole === 'LEARNER' && m.toRole === 'CUSTOMER'
    )
    
    const completedMigrations = roleMigrations.filter(m => m.status === 'COMPLETED')
    const migrationSuccessRate = roleMigrations.length > 0 
      ? (completedMigrations.length / roleMigrations.length) * 100 
      : 100
    
    // Calculate average adaptation time
    const adaptationTimes = completedMigrations
      .filter(m => m.adaptationPeriod)
      .map(m => m.adaptationPeriod!)
    
    const averageAdaptationTime = adaptationTimes.length > 0
      ? adaptationTimes.reduce((sum, time) => sum + time, 0) / adaptationTimes.length
      : 0
    
    // Calculate satisfaction score
    const satisfactionRatings = completedMigrations
      .filter(m => m.satisfactionRating)
      .map(m => m.satisfactionRating!)
    
    const satisfactionScore = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0
    
    return {
      totalUsers: users.length,
      learnerToCustomerMigrations: learnerToCustomerMigrations.length,
      migrationSuccessRate,
      averageAdaptationTime,
      satisfactionScore
    }
  }
  
  async getUserEngagementMetrics(): Promise<RoleSystemMetrics['userEngagement']> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Get active users
    const dailyActiveUsers = await prisma.userAnalytics.groupBy({
      by: ['userId'],
      where: {
        sessionStart: { gte: oneDayAgo },
        userId: { not: null }
      }
    })
    
    const weeklyActiveUsers = await prisma.userAnalytics.groupBy({
      by: ['userId'],
      where: {
        sessionStart: { gte: oneWeekAgo },
        userId: { not: null }
      }
    })
    
    const monthlyActiveUsers = await prisma.userAnalytics.groupBy({
      by: ['userId'],
      where: {
        sessionStart: { gte: oneMonthAgo },
        userId: { not: null }
      }
    })
    
    // Get session metrics
    const recentSessions = await prisma.userAnalytics.findMany({
      where: {
        sessionStart: { gte: oneWeekAgo }
      }
    })
    
    const averageSessionDuration = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => sum + session.totalDuration, 0) / recentSessions.length
      : 0
    
    const bounceRate = recentSessions.length > 0
      ? (recentSessions.filter(s => s.bounceRate).length / recentSessions.length) * 100
      : 0
    
    const returnUserRate = recentSessions.length > 0
      ? (recentSessions.filter(s => s.returnVisitor).length / recentSessions.length) * 100
      : 0
    
    return {
      dailyActiveUsers: dailyActiveUsers.length,
      weeklyActiveUsers: weeklyActiveUsers.length,
      monthlyActiveUsers: monthlyActiveUsers.length,
      averageSessionDuration,
      bounceRate,
      returnUserRate
    }
  }
  
  async getFeatureAdoptionMetrics(): Promise<RoleSystemMetrics['featureAdoption']> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const featureUsage = await prisma.featureUsage.findMany({
      where: {
        lastAccessed: { gte: oneWeekAgo }
      }
    })
    
    // Group by feature
    const featureStats = featureUsage.reduce((acc, usage) => {
      const key = usage.featureName
      if (!acc[key]) {
        acc[key] = {
          name: usage.featureName,
          category: usage.featureCategory || 'unknown',
          totalUsage: 0,
          uniqueUsers: new Set<string>(),
          completedTasks: 0,
          errors: 0,
          totalTasks: 0
        }
      }
      
      acc[key].totalUsage += usage.accessCount
      if (usage.userId) acc[key].uniqueUsers.add(usage.userId)
      if (usage.taskCompleted) acc[key].completedTasks++
      if (usage.errorEncountered) acc[key].errors++
      acc[key].totalTasks++
      
      return acc
    }, {} as Record<string, any>)
    
    // Calculate rates and transform to array
    const topFeatures = Object.values(featureStats).map((stat: any) => ({
      name: stat.name,
      category: stat.category,
      totalUsage: stat.totalUsage,
      uniqueUsers: stat.uniqueUsers.size,
      completionRate: stat.totalTasks > 0 ? (stat.completedTasks / stat.totalTasks) * 100 : 0,
      errorRate: stat.totalTasks > 0 ? (stat.errors / stat.totalTasks) * 100 : 0
    }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10)
    
    // Feature usage by role
    const featureUsageByRole = featureUsage.reduce((acc, usage) => {
      const role = usage.userRole || 'UNKNOWN'
      const feature = usage.featureName
      
      if (!acc[role]) acc[role] = {}
      acc[role][feature] = (acc[role][feature] || 0) + usage.accessCount
      
      return acc
    }, {} as Record<string, Record<string, number>>)
    
    // Calculate feature discovery rate (users who discover new features)
    const totalUsers = await prisma.user.count()
    const usersWithFeatureUsage = new Set(featureUsage.map(f => f.userId).filter(Boolean)).size
    const featureDiscoveryRate = totalUsers > 0 ? (usersWithFeatureUsage / totalUsers) * 100 : 0
    
    return {
      topFeatures,
      featureDiscoveryRate,
      featureUsageByRole
    }
  }
  
  async getSystemPerformanceMetrics(): Promise<RoleSystemMetrics['systemPerformance']> {
    // These would typically come from application performance monitoring
    // For now, we'll calculate basic metrics from available data
    
    const recentSessions = await prisma.userAnalytics.findMany({
      where: {
        sessionStart: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
    
    const recentFeatureUsage = await prisma.featureUsage.findMany({
      where: {
        lastAccessed: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
    
    const averagePageLoadTime = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => sum + (session.pageViews * 1.2), 0) / recentSessions.length
      : 1.2 // Default estimate
    
    const apiResponseTime = 150 // Would be monitored by APM
    
    const totalFeatureAttempts = recentFeatureUsage.reduce((sum, usage) => sum + usage.accessCount, 0)
    const errorCount = recentFeatureUsage.filter(usage => usage.errorEncountered).length
    const errorRate = totalFeatureAttempts > 0 ? (errorCount / totalFeatureAttempts) * 100 : 0
    
    return {
      averagePageLoadTime,
      apiResponseTime,
      errorRate,
      uptime: 99.9 // Would be monitored by infrastructure
    }
  }
  
  async getBusinessImpactMetrics(): Promise<RoleSystemMetrics['businessImpact']> {
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    
    // Calculate signup completion rate
    const totalUsers = await prisma.user.count({
      where: { createdAt: { gte: oneMonthAgo } }
    })
    
    const completedProfiles = await prisma.profile.count({
      where: { 
        user: { createdAt: { gte: oneMonthAgo } }
      }
    })
    
    const signupCompletionRate = totalUsers > 0 ? (completedProfiles / totalUsers) * 100 : 0
    
    // Get satisfaction scores from migrations
    const satisfactionRatings = await prisma.roleMigration.findMany({
      where: {
        completedAt: { gte: oneMonthAgo },
        satisfactionRating: { not: null }
      },
      select: { satisfactionRating: true }
    })
    
    const userSatisfactionScore = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating.satisfactionRating!, 0) / satisfactionRatings.length
      : 0
    
    // Estimate support ticket reduction (based on error rates)
    const errorCount = await prisma.featureUsage.count({
      where: {
        lastAccessed: { gte: oneMonthAgo },
        errorEncountered: true
      }
    })
    
    const supportTicketReduction = Math.max(0, 100 - (errorCount / totalUsers) * 100)
    
    // Admin efficiency (based on role migration success)
    const adminMigrations = await prisma.roleMigration.count({
      where: {
        completedAt: { gte: oneMonthAgo },
        status: 'COMPLETED'
      }
    })
    
    const adminEfficiencyGain = totalUsers > 0 ? (adminMigrations / totalUsers) * 100 : 0
    
    return {
      signupCompletionRate,
      userSatisfactionScore,
      supportTicketReduction,
      adminEfficiencyGain
    }
  }
  
  async generateComprehensiveReport(): Promise<RoleSystemMetrics> {
    const [
      userMigrationSuccess,
      userEngagement,
      featureAdoption,
      systemPerformance,
      businessImpact
    ] = await Promise.all([
      this.getUserMigrationMetrics(),
      this.getUserEngagementMetrics(),
      this.getFeatureAdoptionMetrics(),
      this.getSystemPerformanceMetrics(),
      this.getBusinessImpactMetrics()
    ])
    
    return {
      userMigrationSuccess,
      userEngagement,
      featureAdoption,
      systemPerformance,
      businessImpact
    }
  }
  
  async getUserJourneyAnalysis(userId?: string, timeframe: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeframe)
    
    const whereClause: any = {
      sessionStart: { gte: startDate }
    }
    
    if (userId) {
      whereClause.userId = userId
    }
    
    const userSessions = await prisma.userAnalytics.findMany({
      where: whereClause,
      orderBy: { sessionStart: 'asc' },
      include: {
        user: {
          include: {
            roleMigrations: true,
            featureUsage: true
          }
        }
      }
    })
    
    const userJourneys = userSessions.map(session => ({
      userId: session.userId,
      userRole: session.userRole,
      sessionId: session.sessionId,
      isNewUser: session.isNewUser,
      migrationDate: session.migrationDate,
      sessionDuration: session.totalDuration,
      pageSequence: session.pageSequence,
      featuresUsed: session.featuresUsed,
      engagementScore: session.engagementScore,
      bounced: session.bounceRate,
      deviceType: session.deviceType,
      landingPage: session.landingPage,
      exitPage: session.exitPage
    }))
    
    return userJourneys
  }
}

// Utility functions for data visualization
export const formatMetricsForDashboard = (metrics: RoleSystemMetrics) => {
  return {
    kpis: [
      {
        title: 'Migration Success Rate',
        value: `${metrics.userMigrationSuccess.migrationSuccessRate.toFixed(1)}%`,
        trend: metrics.userMigrationSuccess.migrationSuccessRate > 90 ? 'up' : 'down',
        color: metrics.userMigrationSuccess.migrationSuccessRate > 90 ? 'green' : 'yellow'
      },
      {
        title: 'User Satisfaction',
        value: `${metrics.businessImpact.userSatisfactionScore.toFixed(1)}/5`,
        trend: metrics.businessImpact.userSatisfactionScore > 4 ? 'up' : 'down',
        color: metrics.businessImpact.userSatisfactionScore > 4 ? 'green' : 'orange'
      },
      {
        title: 'Weekly Active Users',
        value: metrics.userEngagement.weeklyActiveUsers.toString(),
        trend: 'up',
        color: 'blue'
      },
      {
        title: 'Feature Discovery Rate',
        value: `${metrics.featureAdoption.featureDiscoveryRate.toFixed(1)}%`,
        trend: metrics.featureAdoption.featureDiscoveryRate > 80 ? 'up' : 'down',
        color: metrics.featureAdoption.featureDiscoveryRate > 80 ? 'green' : 'orange'
      }
    ],
    charts: {
      userEngagement: {
        daily: metrics.userEngagement.dailyActiveUsers,
        weekly: metrics.userEngagement.weeklyActiveUsers,
        monthly: metrics.userEngagement.monthlyActiveUsers,
        avgSessionDuration: metrics.userEngagement.averageSessionDuration,
        bounceRate: metrics.userEngagement.bounceRate,
        returnRate: metrics.userEngagement.returnUserRate
      },
      featureUsage: metrics.featureAdoption.topFeatures,
      roleDistribution: metrics.featureAdoption.featureUsageByRole,
      performance: {
        pageLoad: metrics.systemPerformance.averagePageLoadTime,
        apiResponse: metrics.systemPerformance.apiResponseTime,
        errorRate: metrics.systemPerformance.errorRate,
        uptime: metrics.systemPerformance.uptime
      }
    }
  }
}

export default RoleSystemAnalytics