import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FeedbackType, FeedbackCategory, FeedbackSeverity, SentimentType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const data = await request.json()
    
    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Generate session ID for anonymous users
    const sessionId = data.sessionId || 
                      request.headers.get('x-session-id') ||
                      `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Validate required fields
    if (!data.message || !data.feedbackType) {
      return NextResponse.json(
        { error: 'Message and feedback type are required' },
        { status: 400 }
      )
    }
    
    // Simple sentiment analysis (can be enhanced with ML later)
    const analyzeSentiment = (message: string): SentimentType => {
      const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'amazing', 'wonderful', 'perfect']
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'broken', 'worst', 'useless']
      
      const lowerMessage = message.toLowerCase()
      const positiveScore = positiveWords.filter(word => lowerMessage.includes(word)).length
      const negativeScore = negativeWords.filter(word => lowerMessage.includes(word)).length
      
      if (negativeScore > positiveScore + 1) return 'NEGATIVE'
      if (negativeScore > positiveScore) return 'VERY_NEGATIVE'
      if (positiveScore > negativeScore + 1) return 'POSITIVE'
      if (positiveScore > negativeScore) return 'VERY_POSITIVE'
      return 'NEUTRAL'
    }
    
    // Create feedback record
    const feedback = await prisma.userFeedback.create({
      data: {
        userId: session?.user?.id,
        sessionId,
        email: data.email || session?.user?.email,
        feedbackType: data.feedbackType as FeedbackType,
        category: data.category as FeedbackCategory,
        page: data.page,
        userAgent,
        viewport: data.viewport,
        rating: data.rating ? parseInt(data.rating) : null,
        title: data.title,
        message: data.message,
        sentiment: analyzeSentiment(data.message),
        userRole: data.userRole || session?.user?.role,
        previousRole: data.previousRole,
        migrationDate: data.migrationDate ? new Date(data.migrationDate) : null,
        sessionDuration: data.sessionDuration ? parseInt(data.sessionDuration) : null,
        clickPath: data.clickPath || null,
        scrollBehavior: data.scrollBehavior || null,
        timeOnPage: data.timeOnPage ? parseInt(data.timeOnPage) : null,
        exitIntent: data.exitIntent || false,
        bugReport: data.bugReport || false,
        reproducible: data.reproducible,
        severity: data.severity ? (data.severity as FeedbackSeverity) : 'LOW',
        screenshotUrl: data.screenshotUrl,
        tags: data.tags || [],
        priority: data.severity === 'CRITICAL' ? 'HIGH' : 
                 data.severity === 'HIGH' ? 'MEDIUM' : 'LOW'
      }
    })
    
    // If this is a role migration feedback, also track in RoleMigration table
    if (data.feedbackType === 'ROLE_MIGRATION' && session?.user?.id && data.previousRole) {
      // Find existing role migration record
      const existingMigration = await prisma.roleMigration.findFirst({
        where: { userId: session.user.id },
        orderBy: { initiatedAt: 'desc' }
      });

      if (existingMigration) {
        await prisma.roleMigration.update({
          where: { id: existingMigration.id },
          data: {
            satisfactionRating: data.rating ? parseInt(data.rating) : null,
            feedbackProvided: true,
            issuesReported: data.message ? [data.message] : []
          }
        });
      } else {
        await prisma.roleMigration.create({
          data: {
            userId: session.user.id,
            fromRole: data.previousRole,
            toRole: data.userRole || session.user.role,
            migrationType: 'SYSTEM_MIGRATION',
            status: 'COMPLETED',
            completedAt: new Date(),
            satisfactionRating: data.rating ? parseInt(data.rating) : null,
            feedbackProvided: true,
            issuesReported: data.message ? [data.message] : []
          }
        });
      }
    }
    
    // Log for critical issues
    if (data.severity === 'CRITICAL' || data.feedbackType === 'BUG_REPORT') {
      console.warn('Critical feedback received:', {
        id: feedback.id,
        type: data.feedbackType,
        severity: data.severity,
        page: data.page,
        message: data.message.substring(0, 100)
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      feedbackId: feedback.id,
      message: 'Feedback submitted successfully'
    })
    
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}