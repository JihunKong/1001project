/**
 * Assignment-based Book Access Control Module
 * 
 * This module handles access control for the learning context where students
 * can ONLY access books that have been assigned to them by teachers.
 * This is separate from the general book-access.ts which gives free access to all books.
 */

import { prisma } from './prisma'

export interface AssignmentAccessResult {
  hasAccess: boolean
  reason: string
  assignment?: {
    id: string
    assignedAt: Date
    dueDate?: Date
    instructions?: string
    isRequired: boolean
    teacher: {
      id: string
      name: string | null
      email: string
    }
    class?: {
      id: string
      name: string
      code: string
    }
  }
}

/**
 * Check if a student has access to a specific book through assignments
 * 
 * Students have access if:
 * 1. Book is directly assigned to them, OR
 * 2. Book is assigned to a class they are actively enrolled in
 */
export async function checkAssignmentAccess(
  userId: string, 
  bookId: string
): Promise<AssignmentAccessResult> {
  try {
    // Check for direct assignment or class assignment
    const assignment = await prisma.bookAssignment.findFirst({
      where: {
        bookId: bookId,
        OR: [
          // Direct assignment to student
          { studentId: userId },
          // Assignment to classes where student is enrolled
          { 
            class: { 
              enrollments: { 
                some: { 
                  studentId: userId,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ]
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    if (assignment) {
      return {
        hasAccess: true,
        reason: assignment.class 
          ? `Assigned to your class: ${assignment.class.name}`
          : 'Assigned to you directly',
        assignment: {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          dueDate: assignment.dueDate || undefined,
          instructions: assignment.instructions || undefined,
          isRequired: assignment.isRequired,
          teacher: assignment.teacher,
          class: assignment.class || undefined
        }
      }
    }

    return {
      hasAccess: false,
      reason: 'This book has not been assigned to you by any teacher'
    }

  } catch (error) {
    console.error('Error checking assignment access:', error)
    return {
      hasAccess: false,
      reason: 'Error checking book assignment'
    }
  }
}

/**
 * Check assignment access for multiple books at once
 */
export async function checkBatchAssignmentAccess(
  userId: string,
  bookIds: string[]
): Promise<Record<string, AssignmentAccessResult>> {
  try {
    // Get all assignments for the books and user
    const assignments = await prisma.bookAssignment.findMany({
      where: {
        bookId: { in: bookIds },
        OR: [
          // Direct assignment to student
          { studentId: userId },
          // Assignment to classes where student is enrolled
          { 
            class: { 
              enrollments: { 
                some: { 
                  studentId: userId,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ]
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Create result map
    const results: Record<string, AssignmentAccessResult> = {}

    // Initialize all books as no access
    bookIds.forEach(bookId => {
      results[bookId] = {
        hasAccess: false,
        reason: 'This book has not been assigned to you by any teacher'
      }
    })

    // Update with assignments found
    assignments.forEach(assignment => {
      results[assignment.bookId] = {
        hasAccess: true,
        reason: assignment.class 
          ? `Assigned to your class: ${assignment.class.name}`
          : 'Assigned to you directly',
        assignment: {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          dueDate: assignment.dueDate || undefined,
          instructions: assignment.instructions || undefined,
          isRequired: assignment.isRequired,
          teacher: assignment.teacher,
          class: assignment.class || undefined
        }
      }
    })

    return results

  } catch (error) {
    console.error('Error checking batch assignment access:', error)
    
    // Return no access for all books on error
    const results: Record<string, AssignmentAccessResult> = {}
    bookIds.forEach(bookId => {
      results[bookId] = {
        hasAccess: false,
        reason: 'Error checking book assignment'
      }
    })
    return results
  }
}

/**
 * Get all books assigned to a student with assignment details
 */
export async function getAssignedBooks(userId: string) {
  try {
    const assignments = await prisma.bookAssignment.findMany({
      where: {
        OR: [
          // Direct assignment to student
          { studentId: userId },
          // Assignment to classes where student is enrolled
          { 
            class: { 
              enrollments: { 
                some: { 
                  studentId: userId,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ]
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authorName: true,
            summary: true,
            coverImage: true,
            content: true,
            pageCount: true,
            language: true,
            category: true,
            isPublished: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return assignments.filter(assignment => assignment.book.isPublished)

  } catch (error) {
    console.error('Error getting assigned books:', error)
    return []
  }
}

/**
 * Validate that user has assignment-based access to a book
 * This should be used in API endpoints that serve book content to students
 */
export async function validateAssignmentAccess(
  userId: string, 
  bookId: string,
  userRole: string = 'LEARNER'
): Promise<{ isValid: boolean; message?: string; assignment?: any }> {
  // Teachers and admins have full access (they're not students)
  if (userRole === 'TEACHER' || userRole === 'ADMIN') {
    return { isValid: true }
  }

  // For students/learners, check assignments
  if (userRole === 'LEARNER' || userRole === 'CUSTOMER') {
    const accessResult = await checkAssignmentAccess(userId, bookId)
    
    if (accessResult.hasAccess) {
      return { 
        isValid: true, 
        assignment: accessResult.assignment 
      }
    } else {
      return { 
        isValid: false, 
        message: accessResult.reason 
      }
    }
  }

  return { 
    isValid: false, 
    message: 'Access denied' 
  }
}

export default {
  checkAssignmentAccess,
  checkBatchAssignmentAccess,
  getAssignedBooks,
  validateAssignmentAccess
}