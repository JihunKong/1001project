import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEACHER_ASSIGNMENTS] Starting GET request');
    
    const session = await getServerSession(authOptions);
    console.log('[TEACHER_ASSIGNMENTS] Session check:', !!session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('[TEACHER_ASSIGNMENTS] No session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[TEACHER_ASSIGNMENTS] Checking user role for:', session.user.id);
    
    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    console.log('[TEACHER_ASSIGNMENTS] User role:', user?.role);

    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      console.log('[TEACHER_ASSIGNMENTS] Insufficient permissions');
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    console.log('[TEACHER_ASSIGNMENTS] Fetching book assignments...');

    // Get teacher's book assignments with proper includes
    const assignments = await prisma.bookAssignment.findMany({
      where: {
        teacherId: session.user.id
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authorName: true,
            summary: true,
            language: true,
            category: true,
            coverImage: true,
            pageCount: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              select: { id: true }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('[TEACHER_ASSIGNMENTS] Found assignments:', assignments.length);

    // Transform assignments to match expected format
    const transformedAssignments = assignments.map(assignment => {
      const totalStudents = assignment.classId 
        ? assignment.class?.enrollments?.length || 0 
        : 1;
      
      // Calculate status based on due date (simplified since we don't track completion in BookAssignment)
      let status = 'PENDING';
      if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
        status = 'OVERDUE';
      } else if (assignment.dueDate) {
        status = 'IN_PROGRESS';
      }

      return {
        id: assignment.id,
        bookId: assignment.bookId,
        book: {
          id: assignment.book.id,
          title: assignment.book.title,
          author: assignment.book.authorName || 'Unknown Author',
          description: assignment.book.summary || '',
          difficulty: 'INTERMEDIATE', // Default since not in schema
          estimatedReadingTime: assignment.book.pageCount ? assignment.book.pageCount * 2 : 30, // Estimate 2 min per page
          thumbnail: assignment.book.coverImage || `/api/thumbnails/generate?bookId=${assignment.book.id}&fileName=main.pdf`,
          categories: assignment.book.category || []
        },
        classId: assignment.classId,
        className: assignment.class?.name,
        studentId: assignment.studentId,
        studentName: assignment.student?.name,
        assignedAt: assignment.assignedAt.toISOString(),
        dueDate: assignment.dueDate?.toISOString(),
        instructions: assignment.instructions,
        isRequired: assignment.isRequired,
        allowDiscussion: assignment.allowDiscussion,
        status,
        progress: 0, // TODO: Calculate actual progress from ReadingProgress
        submissions: 0, // TODO: Get actual submissions count
        totalStudents
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assignments: transformedAssignments
      }
    });

  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json(
      { 
        success: false,
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      bookId, 
      assignmentType, 
      classId, 
      studentIds, 
      dueDate, 
      instructions, 
      isRequired = true,
      allowDiscussion = true
    } = body;

    if (!bookId || (assignmentType === 'class' && !classId) || (assignmentType === 'individual' && !studentIds?.length)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const createdAssignments = [];

    if (assignmentType === 'class') {
      // Verify teacher owns this class
      const classRecord = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: session.user.id
        }
      });

      if (!classRecord) {
        return NextResponse.json(
          { error: 'Class not found or access denied' },
          { status: 404 }
        );
      }

      // Create class assignment
      const assignment = await prisma.bookAssignment.create({
        data: {
          bookId,
          classId,
          teacherId: session.user.id,
          dueDate: dueDate ? new Date(dueDate) : null,
          instructions: instructions || null,
          isRequired,
          allowDiscussion
        }
      });

      createdAssignments.push(assignment);
    } else {
      // Individual assignments
      for (const studentId of studentIds) {
        // Verify student is in teacher's class
        const enrollment = await prisma.classEnrollment.findFirst({
          where: {
            studentId,
            status: 'ACTIVE',
            class: {
              teacherId: session.user.id
            }
          }
        });

        if (enrollment) {
          const assignment = await prisma.bookAssignment.create({
            data: {
              bookId,
              studentId,
              teacherId: session.user.id,
              dueDate: dueDate ? new Date(dueDate) : null,
              instructions: instructions || null,
              isRequired,
              allowDiscussion
            }
          });

          createdAssignments.push(assignment);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: createdAssignments,
        message: `Created ${createdAssignments.length} assignment(s)`
      }
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}