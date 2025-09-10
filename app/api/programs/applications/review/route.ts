import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  ProgramApplicationStatus, 
  UserRole, 
  ReviewStatus 
} from '@prisma/client';

// GET - Get applications for review (Program Leads and Admins only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user has review permissions
    const userRole = session.user.role;
    if (userRole !== UserRole.PROGRAM_LEAD && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied. Program Lead or Admin role required.' }, 
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const programType = searchParams.get('programType');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status as ProgramApplicationStatus;
    }

    if (programType) {
      where.programType = programType;
    }

    if (assignedTo === 'me') {
      where.assignedReviewerId = session.user.id;
    } else if (assignedTo === 'unassigned') {
      where.assignedReviewerId = null;
    }

    // Get applications with pagination
    const [applications, totalCount] = await Promise.all([
      prisma.programApplication.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          assignedReviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              originalName: true,
              filePath: true,
              fileSize: true,
              mimeType: true,
              attachmentType: true,
              uploadedAt: true
            }
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              assignedAt: 'desc'
            }
          },
          statusHistory: {
            include: {
              changedBy: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: {
              changedAt: 'desc'
            },
            take: 5
          }
        },
        orderBy: [
          { priority: 'asc' },
          { submittedAt: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.programApplication.count({ where })
    ]);

    // Get summary statistics
    const stats = await prisma.programApplication.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const summaryStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: summaryStats
    });
    
  } catch (error) {
    console.error('Program applications review GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Assign application for review or update review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user has review permissions
    const userRole = session.user.role;
    if (userRole !== UserRole.PROGRAM_LEAD && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied. Program Lead or Admin role required.' }, 
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, applicationId, reviewerId, ...reviewData } = body;

    if (!applicationId && action !== 'bulk_assign') {
      return NextResponse.json(
        { error: 'Application ID is required' }, 
        { status: 400 }
      );
    }

    switch (action) {
      case 'assign':
        if (!reviewerId) {
          return NextResponse.json(
            { error: 'Reviewer ID is required for assignment' }, 
            { status: 400 }
          );
        }

        // Check if application exists
        const application = await prisma.programApplication.findUnique({
          where: { id: applicationId },
          include: { reviews: true }
        });

        if (!application) {
          return NextResponse.json(
            { error: 'Application not found' }, 
            { status: 404 }
          );
        }

        // Update application assignment
        await prisma.$transaction(async (tx) => {
          await tx.programApplication.update({
            where: { id: applicationId },
            data: {
              assignedReviewerId: reviewerId,
              status: ProgramApplicationStatus.UNDER_REVIEW
            }
          });

          // Create or update review record
          await tx.applicationReview.upsert({
            where: {
              applicationId_reviewerId: {
                applicationId,
                reviewerId
              }
            },
            create: {
              applicationId,
              reviewerId,
              status: ReviewStatus.IN_PROGRESS
            },
            update: {
              status: ReviewStatus.IN_PROGRESS,
              startedAt: new Date()
            }
          });

          // Add status history
          await tx.applicationStatusHistory.create({
            data: {
              applicationId,
              fromStatus: application.status,
              toStatus: ProgramApplicationStatus.UNDER_REVIEW,
              changedById: session.user.id,
              reason: `Assigned to reviewer`,
              automaticChange: false
            }
          });
        });

        return NextResponse.json({ 
          success: true,
          message: 'Application assigned successfully' 
        });

      case 'review':
        const { score, strengths, concerns, recommendations, decision } = reviewData;

        // Check if application exists
        const reviewApplication = await prisma.programApplication.findUnique({
          where: { id: applicationId },
          include: { reviews: true }
        });

        if (!reviewApplication) {
          return NextResponse.json(
            { error: 'Application not found' }, 
            { status: 404 }
          );
        }

        // Find existing review
        const existingReview = reviewApplication.reviews.find(r => r.reviewerId === session.user.id);
        if (!existingReview) {
          return NextResponse.json(
            { error: 'No review assignment found for this user' }, 
            { status: 403 }
          );
        }

        // Update review
        await prisma.$transaction(async (tx) => {
          await tx.applicationReview.update({
            where: { id: existingReview.id },
            data: {
              status: ReviewStatus.COMPLETED,
              score: score || null,
              strengths: strengths || null,
              concerns: concerns || null,
              recommendations: recommendations || null,
              decision: decision || null,
              completedAt: new Date()
            }
          });

          // Update application status based on decision
          let newStatus = reviewApplication.status;
          if (decision === 'accept') {
            newStatus = ProgramApplicationStatus.ACCEPTED;
          } else if (decision === 'reject') {
            newStatus = ProgramApplicationStatus.REJECTED;
          } else if (decision === 'request_info') {
            newStatus = ProgramApplicationStatus.ADDITIONAL_INFO_REQUESTED;
          } else if (decision === 'interview') {
            newStatus = ProgramApplicationStatus.INTERVIEW_SCHEDULED;
          }

          if (newStatus !== reviewApplication.status) {
            await tx.programApplication.update({
              where: { id: applicationId },
              data: {
                status: newStatus,
                reviewedAt: new Date(),
                decidedAt: decision === 'accept' || decision === 'reject' ? new Date() : null
              }
            });

            // Add status history
            await tx.applicationStatusHistory.create({
              data: {
                applicationId,
                fromStatus: reviewApplication.status,
                toStatus: newStatus,
                changedById: session.user.id,
                reason: `Review completed with decision: ${decision}`,
                automaticChange: false
              }
            });
          }
        });

        // Send status update email
        try {
          const { sendProgramApplicationStatusUpdateEmail } = await import('@/lib/email');
          
          let newStatus = reviewApplication.status;
          if (decision === 'accept') {
            newStatus = ProgramApplicationStatus.ACCEPTED;
          } else if (decision === 'reject') {
            newStatus = ProgramApplicationStatus.REJECTED;
          } else if (decision === 'request_info') {
            newStatus = ProgramApplicationStatus.ADDITIONAL_INFO_REQUESTED;
          } else if (decision === 'interview') {
            newStatus = ProgramApplicationStatus.INTERVIEW_SCHEDULED;
          }
          
          if (newStatus !== reviewApplication.status) {
            await sendProgramApplicationStatusUpdateEmail(
              reviewApplication.email,
              reviewApplication.fullName,
              reviewApplication.programType,
              reviewApplication.status,
              newStatus,
              reviewData.recommendations
            );
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't fail the request if email fails
        }

        return NextResponse.json({ 
          success: true,
          message: 'Review submitted successfully' 
        });

      case 'bulk_assign':
        const { applicationIds, bulkReviewerId } = body;
        
        if (!applicationIds || !Array.isArray(applicationIds) || !bulkReviewerId) {
          return NextResponse.json(
            { error: 'Application IDs and reviewer ID are required for bulk assignment' }, 
            { status: 400 }
          );
        }

        // Bulk assign applications
        await prisma.$transaction(async (tx) => {
          for (const appId of applicationIds) {
            await tx.programApplication.update({
              where: { id: appId },
              data: {
                assignedReviewerId: bulkReviewerId,
                status: ProgramApplicationStatus.UNDER_REVIEW
              }
            });

            // Create review record
            await tx.applicationReview.upsert({
              where: {
                applicationId_reviewerId: {
                  applicationId: appId,
                  reviewerId: bulkReviewerId
                }
              },
              create: {
                applicationId: appId,
                reviewerId: bulkReviewerId,
                status: ReviewStatus.IN_PROGRESS
              },
              update: {
                status: ReviewStatus.IN_PROGRESS,
                startedAt: new Date()
              }
            });

            // Add status history
            await tx.applicationStatusHistory.create({
              data: {
                applicationId: appId,
                fromStatus: ProgramApplicationStatus.SUBMITTED,
                toStatus: ProgramApplicationStatus.UNDER_REVIEW,
                changedById: session.user.id,
                reason: `Bulk assigned to reviewer`,
                automaticChange: false
              }
            });
          }
        });

        return NextResponse.json({ 
          success: true,
          message: `${applicationIds.length} applications assigned successfully` 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Program applications review POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}