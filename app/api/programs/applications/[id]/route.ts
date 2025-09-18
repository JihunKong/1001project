import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Get individual application details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    const applicationId = params.id;

    // Check permissions
    const hasReviewAccess = userRole === UserRole.PROGRAM_LEAD || userRole === UserRole.ADMIN;
    const isOwner = session.user.id; // We'll check this in the query

    const application = await prisma.programApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
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
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' }, 
        { status: 404 }
      );
    }

    // Check if user has permission to view this application
    const canView = hasReviewAccess || application.applicantId === session.user.id;
    
    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Filter sensitive information for non-reviewers
    let responseData = application;
    if (!hasReviewAccess && application.applicantId === session.user.id) {
      // Applicants can see their own application but not review details
      responseData = {
        ...application,
        reviews: application.reviews.filter(review => review.decision), // Only show completed reviews with decisions
        internalNotes: undefined // Hide internal notes from applicants
      };
    }

    return NextResponse.json({ application: responseData });
    
  } catch (error) {
    console.error('Application GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT - Update application (for applicants to update their own draft applications)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const applicationId = params.id;
    const updateData = await req.json();

    // Get the application to check ownership
    const existingApplication = await prisma.programApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicantId: true,
        status: true
      }
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' }, 
        { status: 404 }
      );
    }

    // Check if user owns this application
    if (existingApplication.applicantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Only allow updates to draft applications
    if (existingApplication.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only update draft applications' }, 
        { status: 400 }
      );
    }

    // Update the application
    const updatedApplication = await prisma.programApplication.update({
      where: { id: applicationId },
      data: {
        fullName: updateData.fullName,
        email: updateData.email,
        phone: updateData.phone,
        country: updateData.country,
        city: updateData.city,
        timezone: updateData.timezone,
        languages: updateData.languages || [],
        organizationName: updateData.organizationName,
        organizationType: updateData.organizationType,
        jobTitle: updateData.jobTitle,
        experienceYears: updateData.experienceYears,
        weeklyHours: updateData.weeklyHours,
        availableDays: updateData.availableDays || [],
        timeWindows: updateData.timeWindows || {},
        interests: updateData.interests || [],
        skills: updateData.skills || [],
        languageProficiency: updateData.languageProficiency || {},
        goals: updateData.goals,
        motivation: updateData.motivation,
        preferredModality: updateData.preferredModality,
        programSpecificData: updateData.programSpecificData || {},
        dataProcessingConsent: updateData.dataProcessingConsent || false,
        codeOfConductAccepted: updateData.codeOfConductAccepted || false,
        backgroundCheckConsent: updateData.backgroundCheckConsent || false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      application: updatedApplication 
    });
    
  } catch (error) {
    console.error('Application PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Withdraw application
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const applicationId = params.id;

    // Get the application to check ownership
    const existingApplication = await prisma.programApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicantId: true,
        status: true
      }
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' }, 
        { status: 404 }
      );
    }

    // Check if user owns this application
    if (existingApplication.applicantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Only allow withdrawal of non-final applications
    const finalStatuses = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'];
    if (finalStatuses.includes(existingApplication.status)) {
      return NextResponse.json(
        { error: 'Cannot withdraw application in current status' }, 
        { status: 400 }
      );
    }

    // Update application status to withdrawn
    await prisma.$transaction(async (tx) => {
      await tx.programApplication.update({
        where: { id: applicationId },
        data: {
          status: 'WITHDRAWN',
          updatedAt: new Date()
        }
      });

      // Add status history entry
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: existingApplication.status as any,
          toStatus: 'WITHDRAWN',
          changedById: session.user.id,
          reason: 'Application withdrawn by applicant',
          automaticChange: false
        }
      });
    });

    return NextResponse.json({ 
      success: true,
      message: 'Application withdrawn successfully' 
    });
    
  } catch (error) {
    console.error('Application DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}