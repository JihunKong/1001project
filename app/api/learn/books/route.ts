import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * GET /api/learn/books
 * 
 * Returns ONLY books assigned to the student (via BookAssignment)
 * Students can only see books that have been assigned to them directly 
 * or to their enrolled classes by teachers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const language = searchParams.get('language')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'assignedAt'
    const order = searchParams.get('order') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Get current user session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userRole = session.user.role || 'LEARNER'
    
    // Only allow learners/students to access this endpoint
    if (userRole !== 'LEARNER' && userRole !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'This endpoint is for students only' },
        { status: 403 }
      )
    }
    
    // Build where clause for assigned books only
    const where: any = {
      isPublished: true,
      BookAssignments: {
        some: {
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
        }
      }
    }
    
    // Add additional filters
    if (category) {
      where.category = {
        has: category
      }
    }
    
    if (language) {
      where.language = language
    }
    
    if (search) {
      const searchTerm = search.toLowerCase()
      where.AND = [
        { ...where },
        {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              authorName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              summary: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          ]
        }
      ]
      delete where.OR // Remove the OR from BookAssignments level
      where.BookAssignments = {
        some: {
          OR: [
            { studentId: userId },
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
        }
      }
    }
    
    // Build orderBy clause - prefer assignment-related sorting
    const validSortFields = ['title', 'authorName', 'assignedAt', 'createdAt']
    const sortField = validSortFields.includes(sort) ? sort : 'assignedAt'
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    
    let orderBy: any
    if (sortField === 'assignedAt') {
      orderBy = {
        BookAssignments: {
          _min: {
            assignedAt: sortOrder
          }
        }
      }
    } else {
      orderBy = {}
      orderBy[sortField] = sortOrder
    }
    
    // Fetch assigned books and total count
    const [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          authorName: true,
          summary: true,
          language: true,
          category: true,
          tags: true,
          isPremium: true,
          price: true,
          currency: true,
          coverImage: true,
          content: true,
          previewPages: true,
          pageCount: true,
          viewCount: true,
          downloadCount: true,
          rating: true,
          createdAt: true,
          featured: true,
          // Include assignment details
          bookAssignments: {
            where: {
              OR: [
                { studentId: userId },
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
            select: {
              id: true,
              assignedAt: true,
              dueDate: true,
              instructions: true,
              isRequired: true,
              allowDiscussion: true,
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
          }
        }
      }),
      prisma.book.count({ where })
    ])
    
    // Transform books with assignment information
    const booksWithAssignments = books.map(book => ({
      id: book.id,
      title: book.title,
      authorName: book.authorName,
      summary: book.summary || undefined,
      language: book.language,
      category: book.category,
      tags: book.tags,
      isPremium: book.isPremium,
      price: book.price ? Number(book.price) : undefined,
      currency: book.currency,
      coverImage: book.coverImage || undefined,
      content: book.content || undefined,
      previewPages: book.previewPages,
      pageCount: book.pageCount || undefined,
      viewCount: book.viewCount,
      downloadCount: book.downloadCount,
      rating: book.rating || undefined,
      featured: book.featured,
      createdAt: book.createdAt.toISOString(),
      // Assignment-specific fields
      hasAccess: true, // Students always have access to assigned books
      accessLevel: 'assigned',
      assignments: book.bookAssignments.map(assignment => ({
        id: assignment.id,
        assignedAt: assignment.assignedAt.toISOString(),
        dueDate: assignment.dueDate?.toISOString(),
        instructions: assignment.instructions,
        isRequired: assignment.isRequired,
        allowDiscussion: assignment.allowDiscussion,
        teacher: assignment.teacher,
        class: assignment.class
      }))
    }))
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      success: true,
      books: booksWithAssignments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        category,
        language,
        search,
        sort,
        order
      },
      message: totalCount === 0 ? 'No books have been assigned to you yet. Contact your teacher for assignments.' : undefined
    })
    
  } catch (error) {
    console.error('Error fetching assigned books:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch assigned books',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}