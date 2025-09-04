import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Update submission status (for workflow management)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, reviewNotes, assigneeId } = body;

    // Check role permissions for status updates
    const userRole = session.user.role as UserRole;
    const allowedStatusChanges: Record<UserRole, string[]> = {
      VOLUNTEER: [], // Volunteers can only create, not update status
      EDITOR: ['IN_REVIEW', 'EDITING', 'APPROVED', 'REJECTED'],
      PUBLISHER: ['APPROVED', 'PUBLISHED', 'REJECTED'],
      ADMIN: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'EDITING', 'APPROVED', 'PUBLISHED', 'REJECTED'],
      CUSTOMER: [],
      LEARNER: [],
      TEACHER: [],
      INSTITUTION: []
    };

    if (!allowedStatusChanges[userRole]?.includes(status)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this status change' },
        { status: 403 }
      );
    }

    // Update the submission
    const updatedSubmission = await prisma.storySubmission.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        assigneeId,
        reviewerId: session.user.id
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// Get submission details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const { id } = params;

    const submission = await prisma.storySubmission.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const userRole = session.user.role as UserRole;
    const userId = session.user.id;
    
    const hasAccess = 
      userRole === 'ADMIN' ||
      userRole === 'EDITOR' ||
      userRole === 'PUBLISHER' ||
      submission.authorId === userId;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ submission });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}