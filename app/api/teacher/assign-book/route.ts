import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * POST /api/teacher/assign-book
 * 
 * Allows teachers to assign books to individual students or entire classes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teacherId = session.user.id
    const userRole = session.user.role || 'LEARNER'
    
    // Only allow teachers to assign books
    if (userRole !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Only teachers can assign books' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      bookId, 
      assignTo, // 'student' or 'class'
      studentIds, // for individual assignments
      classIds, // for class-wide assignments
      dueDate,
      instructions,
      isRequired = true,
      allowDiscussion = true
    } = body

    // Validate required fields
    if (!bookId || !assignTo) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, assignTo' },
        { status: 400 }
      )
    }

    if (assignTo === 'student' && (!studentIds || studentIds.length === 0)) {
      return NextResponse.json(
        { error: 'Student IDs are required for individual assignments' },
        { status: 400 }
      )
    }

    if (assignTo === 'class' && (!classIds || classIds.length === 0)) {
      return NextResponse.json(
        { error: 'Class IDs are required for class assignments' },
        { status: 400 }
      )
    }

    // Verify the book exists and is published
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        authorName: true,
        isPublished: true
      }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (!book.isPublished) {
      return NextResponse.json(
        { error: 'Cannot assign unpublished books' },
        { status: 400 }
      )
    }

    const assignments = []
    const conflicts = []
    
    // Handle student assignments
    if (assignTo === 'student') {
      // Verify students exist and are learners
      const students = await prisma.user.findMany({
        where: {
          id: { in: studentIds },
          role: { in: ['LEARNER', 'CUSTOMER'] }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      })

      if (students.length !== studentIds.length) {
        const foundIds = students.map(s => s.id)
        const missingIds = studentIds.filter((id: string) => !foundIds.includes(id))
        return NextResponse.json(
          { error: `Students not found or not learners: ${missingIds.join(', ')}` },
          { status: 400 }
        )
      }

      // Check for existing assignments
      const existingAssignments = await prisma.bookAssignment.findMany({
        where: {
          bookId: bookId,
          studentId: { in: studentIds },
          teacherId: teacherId
        },
        select: {
          studentId: true,
          student: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (existingAssignments.length > 0) {
        existingAssignments.forEach(existing => {
          conflicts.push({
            type: 'student',
            student: existing.student,
            message: `Book already assigned to ${existing.student?.name || existing.student?.email}`
          })
        })
      }

      // Create assignments for students that don't have conflicts
      const conflictStudentIds = existingAssignments.map(ea => ea.studentId)
      const validStudentIds = studentIds.filter((id: string) => !conflictStudentIds.includes(id))

      for (const studentId of validStudentIds) {
        const assignment = await prisma.bookAssignment.create({
          data: {
            bookId: bookId,
            studentId: studentId,
            teacherId: teacherId,
            dueDate: dueDate ? new Date(dueDate) : null,
            instructions: instructions || null,
            isRequired: isRequired,
            allowDiscussion: allowDiscussion
          },
          include: {
            book: {
              select: {
                title: true,
                authorName: true
              }
            },
            student: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
        
        assignments.push(assignment)
      }
    }

    // Handle class assignments
    if (assignTo === 'class') {
      // Verify classes exist and teacher teaches them
      const classes = await prisma.class.findMany({
        where: {
          id: { in: classIds },
          teacherId: teacherId
        },
        select: {
          id: true,
          name: true,
          code: true,
          enrollments: {
            where: {
              status: 'ACTIVE'
            },
            select: {
              studentId: true
            }
          }
        }
      })

      if (classes.length !== classIds.length) {
        const foundIds = classes.map(c => c.id)
        const missingIds = classIds.filter((id: string) => !foundIds.includes(id))
        return NextResponse.json(
          { error: `Classes not found or you don't teach them: ${missingIds.join(', ')}` },
          { status: 400 }
        )
      }

      // Check for existing class assignments
      const existingClassAssignments = await prisma.bookAssignment.findMany({
        where: {
          bookId: bookId,
          classId: { in: classIds },
          teacherId: teacherId
        },
        select: {
          classId: true,
          class: {
            select: {
              name: true,
              code: true
            }
          }
        }
      })

      if (existingClassAssignments.length > 0) {
        existingClassAssignments.forEach(existing => {
          conflicts.push({
            type: 'class',
            class: existing.class,
            message: `Book already assigned to class ${existing.class?.name || existing.class?.code}`
          })
        })
      }

      // Create assignments for classes that don't have conflicts
      const conflictClassIds = existingClassAssignments.map(ea => ea.classId)
      const validClassIds = classIds.filter((id: string) => !conflictClassIds.includes(id))

      for (const classId of validClassIds) {
        const assignment = await prisma.bookAssignment.create({
          data: {
            bookId: bookId,
            classId: classId,
            teacherId: teacherId,
            dueDate: dueDate ? new Date(dueDate) : null,
            instructions: instructions || null,
            isRequired: isRequired,
            allowDiscussion: allowDiscussion
          },
          include: {
            book: {
              select: {
                title: true,
                authorName: true
              }
            },
            class: {
              select: {
                name: true,
                code: true,
                enrollments: {
                  where: {
                    status: 'ACTIVE'
                  },
                  select: {
                    student: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        })
        
        assignments.push(assignment)
      }
    }

    const successCount = assignments.length
    const conflictCount = conflicts.length
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${successCount} assignment(s)${conflictCount > 0 ? `. ${conflictCount} conflicts found.` : ''}`,
      data: {
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          bookId: assignment.bookId,
          bookTitle: assignment.book.title,
          bookAuthor: assignment.book.authorName,
          studentId: assignment.studentId,
          classId: assignment.classId,
          assignedAt: assignment.assignedAt.toISOString(),
          dueDate: assignment.dueDate?.toISOString(),
          instructions: assignment.instructions,
          isRequired: assignment.isRequired,
          allowDiscussion: assignment.allowDiscussion,
          student: assignment.student,
          class: assignment.class
        })),
        conflicts,
        stats: {
          successCount,
          conflictCount,
          totalAttempted: (studentIds?.length || 0) + (classIds?.length || 0)
        }
      }
    })

  } catch (error) {
    console.error('Error assigning book:', error)
    return NextResponse.json(
      { 
        error: 'Failed to assign book',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/teacher/assign-book
 * 
 * Get teacher's assignment history and available books/students/classes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teacherId = session.user.id
    const userRole = session.user.role || 'LEARNER'
    
    // Only allow teachers
    if (userRole !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Only teachers can access assignment data' },
        { status: 403 }
      )
    }

    // Get teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId: teacherId },
      select: {
        id: true,
        name: true,
        code: true,
        subject: true,
        gradeLevel: true,
        enrollments: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get all students from teacher's classes
    const allStudentIds = classes.flatMap(c => 
      c.enrollments.map(e => e.student.id)
    )
    const uniqueStudentIds = [...new Set(allStudentIds)]
    
    const students = await prisma.user.findMany({
      where: {
        id: { in: uniqueStudentIds },
        role: { in: ['LEARNER', 'CUSTOMER'] }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get published books
    const books = await prisma.book.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        coverImage: true,
        summary: true,
        category: true,
        language: true,
        pageCount: true,
        isPremium: true
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Get recent assignments by this teacher
    const recentAssignments = await prisma.bookAssignment.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        book: {
          select: {
            title: true,
            authorName: true
          }
        },
        student: {
          select: {
            name: true,
            email: true
          }
        },
        class: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: {
        classes: classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          code: cls.code,
          subject: cls.subject,
          gradeLevel: cls.gradeLevel,
          studentCount: cls._count.enrollments,
          students: cls.enrollments.map(e => e.student)
        })),
        students,
        books,
        recentAssignments: recentAssignments.map(assignment => ({
          id: assignment.id,
          bookTitle: assignment.book.title,
          bookAuthor: assignment.book.authorName,
          assignedAt: assignment.assignedAt.toISOString(),
          dueDate: assignment.dueDate?.toISOString(),
          student: assignment.student,
          class: assignment.class,
          isRequired: assignment.isRequired
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching assignment data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teacher/assign-book
 * 
 * Remove book assignments
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teacherId = session.user.id
    const userRole = session.user.role || 'LEARNER'
    
    // Only allow teachers
    if (userRole !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Only teachers can remove assignments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { assignmentIds } = body

    if (!assignmentIds || assignmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Assignment IDs are required' },
        { status: 400 }
      )
    }

    // Verify assignments belong to this teacher
    const assignments = await prisma.bookAssignment.findMany({
      where: {
        id: { in: assignmentIds },
        teacherId: teacherId
      },
      select: {
        id: true,
        book: {
          select: {
            title: true
          }
        }
      }
    })

    if (assignments.length !== assignmentIds.length) {
      return NextResponse.json(
        { error: 'Some assignments not found or not owned by you' },
        { status: 403 }
      )
    }

    // Delete assignments
    const deleteResult = await prisma.bookAssignment.deleteMany({
      where: {
        id: { in: assignmentIds },
        teacherId: teacherId
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${deleteResult.count} assignment(s)`,
      data: {
        deletedCount: deleteResult.count,
        assignments: assignments
      }
    })

  } catch (error) {
    console.error('Error removing assignments:', error)
    return NextResponse.json(
      { 
        error: 'Failed to remove assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}