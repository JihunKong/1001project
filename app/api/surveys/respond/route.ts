import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const data = await request.json()
    
    // Validate required fields
    if (!data.surveyId || !data.answers) {
      return NextResponse.json(
        { error: 'Survey ID and answers are required' },
        { status: 400 }
      )
    }
    
    // Generate session ID for anonymous responses
    const sessionId = data.sessionId || 
                      request.headers.get('x-session-id') ||
                      `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Check if survey exists and is active
    const survey = await prisma.microSurvey.findUnique({
      where: { id: data.surveyId }
    })
    
    if (!survey || !survey.isActive) {
      return NextResponse.json(
        { error: 'Survey not found or inactive' },
        { status: 404 }
      )
    }
    
    // Check if user has already responded (for ONCE frequency surveys)
    if (survey.frequency === 'ONCE' && session?.user?.id) {
      const existingResponse = await prisma.surveyResponse.findFirst({
        where: {
          surveyId: data.surveyId,
          userId: session.user.id
        }
      })
      
      if (existingResponse) {
        return NextResponse.json(
          { error: 'You have already responded to this survey' },
          { status: 400 }
        )
      }
    }
    
    // Create survey response
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: data.surveyId,
        userId: session?.user?.id,
        sessionId,
        answers: data.answers,
        completionTime: data.completionTime || 0,
        isComplete: data.isComplete !== false,
        userRole: data.userRole || session?.user?.role,
        page: data.page,
        userAgent: data.userAgent
      }
    })
    
    // Update survey statistics
    await prisma.microSurvey.update({
      where: { id: data.surveyId },
      data: {
        responseCount: { increment: 1 },
        // Update completion rate
        completionRate: {
          // This would need to be calculated properly based on impressions vs responses
          increment: data.isComplete ? 1 : 0
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      responseId: response.id,
      message: 'Survey response submitted successfully'
    })
    
  } catch (error) {
    console.error('Error submitting survey response:', error)
    return NextResponse.json(
      { error: 'Failed to submit survey response' },
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
    const surveyId = url.searchParams.get('surveyId')
    const timeframe = url.searchParams.get('timeframe') || '7d'
    
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
      createdAt: {
        gte: startDate,
        lte: now
      }
    }
    
    if (surveyId) {
      where.surveyId = surveyId
    }
    
    // Get survey responses
    const responses = await prisma.surveyResponse.findMany({
      where,
      include: {
        survey: {
          select: {
            name: true,
            questions: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Aggregate response data
    const summary = {
      totalResponses: responses.length,
      completedResponses: responses.filter(r => r.isComplete).length,
      avgCompletionTime: responses.reduce((sum, r) => sum + r.completionTime, 0) / responses.length,
      responsesByRole: responses.reduce((acc, r) => {
        const role = r.userRole || 'Unknown'
        acc[role] = (acc[role] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    // Analyze answers by question
    const questionAnalysis = responses.reduce((acc, response) => {
      if (response.survey) {
        const questions = response.survey.questions as any[]
        const answers = response.answers as any
        
        questions.forEach((question: any) => {
          if (!acc[question.id]) {
            acc[question.id] = {
              question: question.question,
              type: question.type,
              responses: []
            }
          }
          
          if (answers[question.id] !== undefined) {
            acc[question.id].responses.push(answers[question.id])
          }
        })
      }
      return acc
    }, {} as Record<string, any>)
    
    // Calculate statistics for each question
    Object.keys(questionAnalysis).forEach(questionId => {
      const analysis = questionAnalysis[questionId]
      const responses = analysis.responses
      
      if (analysis.type === 'rating' || analysis.type === 'scale') {
        analysis.average = responses.reduce((sum: number, r: number) => sum + r, 0) / responses.length
        analysis.distribution = responses.reduce((acc: Record<string, number>, r: number) => {
          acc[r] = (acc[r] || 0) + 1
          return acc
        }, {})
      } else if (analysis.type === 'choice') {
        analysis.distribution = responses.reduce((acc: Record<string, number>, r: string) => {
          acc[r] = (acc[r] || 0) + 1
          return acc
        }, {})
      } else if (analysis.type === 'multiChoice') {
        const allChoices = responses.flat()
        analysis.distribution = allChoices.reduce((acc: Record<string, number>, choice: string) => {
          acc[choice] = (acc[choice] || 0) + 1
          return acc
        }, {})
      }
    })
    
    return NextResponse.json({
      success: true,
      summary,
      questionAnalysis,
      responses: responses.slice(0, 100) // Limit for performance
    })
    
  } catch (error) {
    console.error('Error fetching survey responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch survey responses' },
      { status: 500 }
    )
  }
}