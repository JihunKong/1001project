import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Make this endpoint public - session is optional
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (error) {
      // Session fetch failed, continue without it
      console.log('Survey endpoint accessed without session')
    }
    
    const url = new URL(request.url)
    const page = url.searchParams.get('page')
    const role = url.searchParams.get('role')
    
    // For unauthenticated users or when surveys are disabled, return empty array
    // This prevents authentication errors in the frontend
    if (!process.env.ENABLE_SURVEYS || process.env.ENABLE_SURVEYS === 'false') {
      return NextResponse.json([])
    }
    
    const now = new Date()
    
    // Build where clause
    const where: any = {
      isActive: true,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } }
      ]
    }
    
    // Filter by page if provided
    if (page) {
      where.OR = [
        { targetPage: page },
        { targetPage: null }
      ]
    }
    
    // Get active surveys
    const surveys = await prisma.microSurvey.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    // Filter by role and other criteria
    const eligibleSurveys = surveys.filter(survey => {
      // Check role targeting
      if (survey.targetRole && survey.targetRole.length > 0) {
        if (!role || !survey.targetRole.includes(role as any)) {
          return false
        }
      }
      
      // Check if user has already responded (if session exists)
      // This would require checking against survey responses
      
      return true
    })
    
    // Check if user already responded to surveys (only if authenticated)
    let filteredSurveys = eligibleSurveys
    if (session?.user?.id) {
      const existingResponses = await prisma.surveyResponse.findMany({
        where: {
          userId: session.user.id,
          surveyId: {
            in: eligibleSurveys.map(s => s.id)
          }
        },
        select: { surveyId: true }
      })
      
      const respondedSurveyIds = new Set(existingResponses.map(r => r.surveyId))
      
      filteredSurveys = eligibleSurveys.filter(survey => {
        // Allow repeated surveys based on frequency
        if (survey.frequency === 'ALWAYS') return true
        if (survey.frequency === 'PER_SESSION') return true // Would need session tracking
        if (survey.frequency === 'ONCE' && respondedSurveyIds.has(survey.id)) return false
        
        return true
      })
    }
    
    return NextResponse.json(filteredSurveys)
    
  } catch (error) {
    console.error('Error fetching active surveys:', error)
    // Return empty array instead of error to prevent frontend issues
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.questions || !Array.isArray(data.questions)) {
      return NextResponse.json(
        { error: 'Name and questions are required' },
        { status: 400 }
      )
    }
    
    // Create survey
    const survey = await prisma.microSurvey.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger || 'PAGE_LOAD',
        targetPage: data.targetPage,
        targetRole: data.targetRole || [],
        frequency: data.frequency || 'ONCE',
        displayType: data.displayType || 'MODAL',
        position: data.position || 'bottom-right',
        delay: data.delay || 5000,
        questions: data.questions,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== false
      }
    })
    
    return NextResponse.json({
      success: true,
      survey
    })
    
  } catch (error) {
    console.error('Error creating survey:', error)
    return NextResponse.json(
      { error: 'Failed to create survey' },
      { status: 500 }
    )
  }
}