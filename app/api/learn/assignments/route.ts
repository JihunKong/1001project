import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simplified assignments endpoint that returns mock data for now
// The full educational features with ClassEnrollment, Assignment, etc. are not yet implemented
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role || 'LEARNER';
    
    // Only allow learners/students to get assignments
    if (userRole === 'TEACHER' || userRole === 'ADMIN') {
      return NextResponse.json(
        { error: 'This endpoint is for students only' },
        { status: 403 }
      );
    }

    // Return empty assignments for now since the educational models aren't implemented
    // This prevents the 500 error while keeping the UI functional
    const assignments = [];
    
    const stats = {
      total: 0,
      pending: 0,
      submitted: 0,
      graded: 0,
      overdue: 0
    };

    return NextResponse.json({
      success: true,
      assignments,
      stats,
      enrollments: []
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return a placeholder response for now
    return NextResponse.json({
      success: false,
      message: 'Assignment submission is not yet implemented'
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}