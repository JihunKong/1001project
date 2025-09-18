import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * GET /api/story-manager/submissions
 * 
 * Fetch submissions for Story Manager review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.STORY_MANAGER) {
      return NextResponse.json(
        { error: 'Unauthorized. Story Manager access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      status: {
        in: ['PENDING_REVIEW', 'REVIEWED', 'PENDING_COORDINATOR', 'APPROVED_COORDINATOR']
      }
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Fetch submissions with related data
    const [submissions, total] = await Promise.all([
      prisma.bookSubmission.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit,
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true
            }
          },
          coordinator: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              workflowTransitions: true
            }
          }
        }
      }),
      prisma.bookSubmission.count({ where })
    ]);

    // Transform data for frontend
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      title: submission.title,
      authorName: submission.authorName,
      authorAge: submission.authorAge,
      authorLocation: submission.authorLocation,
      summary: submission.summary,
      language: submission.language,
      ageRange: submission.ageRange,
      categories: submission.categories,
      tags: submission.tags,
      format: submission.format,
      filePath: submission.filePath,
      coverImagePath: submission.coverImagePath,
      pageCount: submission.pageCount,
      wordCount: submission.wordCount,
      status: submission.status,
      priority: submission.priority || 'MEDIUM',
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      submittedBy: submission.submittedBy,
      currentReviewer: submission.reviewedBy,
      feedbackCount: submission._count.workflowTransitions,
      lastFeedback: submission.reviewNotes ? {
        message: submission.reviewNotes,
        createdAt: submission.reviewedAt?.toISOString() || submission.updatedAt.toISOString()
      } : null
    }));

    return NextResponse.json({
      success: true,
      submissions: transformedSubmissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/story-manager/submissions
 * 
 * Bulk update submissions
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.STORY_MANAGER) {
      return NextResponse.json(
        { error: 'Unauthorized. Story Manager access required.' },
        { status: 401 }
      );
    }

    const { submissionIds, action, data } = await request.json();

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid submission IDs' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    
    switch (action) {
      case 'approve':
        updateData = {
          status: 'REVIEWED',
          reviewedById: session.user.id,
          reviewedAt: new Date()
        };
        break;
      case 'reject':
        updateData = {
          status: 'REJECTED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          rejectionReason: data?.reason || 'Rejected by Story Manager'
        };
        break;
      case 'assign_priority':
        updateData = {
          priority: data?.priority || 'MEDIUM'
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update submissions
    const updatedSubmissions = await prisma.bookSubmission.updateMany({
      where: {
        id: { in: submissionIds }
      },
      data: updateData
    });

    // Log workflow transitions
    await Promise.all(
      submissionIds.map(submissionId =>
        prisma.workflowTransition.create({
          data: {
            submissionId,
            submissionType: 'BookSubmission',
            fromStatus: 'PENDING_REVIEW', // This should ideally come from the current status
            toStatus: updateData.status || 'PENDING_REVIEW',
            performedById: session.user.id,
            reason: data?.reason || `Bulk ${action} by Story Manager`
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: updatedSubmissions.count,
      message: `Successfully ${action}ed ${updatedSubmissions.count} submissions`
    });

  } catch (error) {
    console.error('Error updating submissions:', error);
    return NextResponse.json(
      { error: 'Failed to update submissions' },
      { status: 500 }
    );
  }
}