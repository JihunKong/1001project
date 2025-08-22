import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

/**
 * GET /api/admin/volunteer-submissions
 * 
 * Fetch all volunteer submissions for admin review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const whereClause: any = {}
    if (status && status !== 'all') {
      whereClause.status = status
    }
    if (priority && priority !== 'all') {
      whereClause.priority = priority
    }

    const [submissions, totalCount] = await Promise.all([
      prisma.volunteerSubmission.findMany({
        where: whereClause,
        orderBy: [
          { status: 'asc' }, // Prioritize pending submissions
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          volunteer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.volunteerSubmission.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching volunteer submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch volunteer submissions' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/volunteer-submissions
 * 
 * Update volunteer submission status and review
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { submissionId, status, reviewNotes, rejectionReason, priority } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES', 'PUBLISHED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
    }

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    if (priority) {
      updateData.priority = priority
    }

    // Set reviewer if changing status
    if (status && status !== 'SUBMITTED') {
      updateData.reviewerId = session.user.id
    }

    // Set publish date if approving/publishing
    if (status === 'PUBLISHED') {
      updateData.publishDate = new Date()
    }

    const updatedSubmission = await prisma.volunteerSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // TODO: Send notification email to volunteer about status change

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: `Submission ${status ? `marked as ${status.toLowerCase()}` : 'updated'} successfully`
    })

  } catch (error) {
    console.error('Error updating volunteer submission:', error)
    return NextResponse.json(
      { error: 'Failed to update volunteer submission' },
      { status: 500 }
    )
  }
}