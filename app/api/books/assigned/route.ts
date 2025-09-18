import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * CRITICAL SECURITY ENDPOINT
 * This endpoint controls what books students can access.
 * Students should ONLY see books that have been explicitly assigned to them.
 * Access control happens at the DATABASE level, not in the application layer.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const readingLevel = searchParams.get('readingLevel') || '';
    
    const skip = (page - 1) * limit;

    let books;
    let totalCount;

    // CRITICAL: Different queries based on role
    if (userRole === UserRole.LEARNER) {
      // SECURITY: Students ONLY see assigned books
      // This query ensures students cannot access any book not explicitly assigned to them
      const whereClause: any = {
        bookAssignments: {
          some: {
            OR: [
              {
                // Individual assignment to this student
                studentId: userId
              },
              {
                // Class assignment where student is enrolled
                class: {
                  enrollments: {
                    some: {
                      studentId: userId,
                      status: 'ACTIVE' // Only active enrollments
                    }
                  }
                }
              }
            ]
          }
        },
        // Additional filters
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { authorName: { contains: search, mode: 'insensitive' as const } },
            { summary: { contains: search, mode: 'insensitive' as const } },
          ]
        }),
        ...(subject && { subjects: { has: subject } }),
        ...(readingLevel && { readingLevel }),
      };

      // Get total count for pagination
      totalCount = await prisma.book.count({ where: whereClause });

      // Get the books with assignments
      books = await prisma.book.findMany({
        where: whereClause,
        include: {
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
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              class: {
                select: {
                  id: true,
                  name: true,
                }
              }
            },
            orderBy: {
              assignedAt: 'desc'
            },
            take: 1 // Get the most recent assignment
          },
          learningProgress: {
            where: {
              userId,
            },
            select: {
              id: true,
              lastPageRead: true,
              totalPages: true,
              pagesRead: true,
              completedAt: true,
              isCompleted: true,
            },
            take: 1
          },
          _count: {
            select: {
              reviews: true,
              bookClubs: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          bookAssignments: {
            _count: 'desc' // Show most recently assigned first
          }
        }
      });

    } else if (userRole === UserRole.TEACHER || userRole === UserRole.INSTITUTION) {
      // Teachers and institutions see all published books
      const whereClause = {
        isPublished: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { authorName: { contains: search, mode: 'insensitive' as const } },
            { summary: { contains: search, mode: 'insensitive' as const } },
          ]
        }),
        ...(subject && { subjects: { has: subject } }),
        ...(readingLevel && { readingLevel }),
      };

      totalCount = await prisma.book.count({ where: whereClause });

      books = await prisma.book.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              bookAssignments: true,
              reviews: true,
              bookClubs: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

    } else if (userRole === UserRole.ADMIN || userRole === UserRole.CONTENT_ADMIN || 
                userRole === UserRole.PUBLISHER || userRole === UserRole.EDITOR || 
                userRole === UserRole.STORY_MANAGER || userRole === UserRole.BOOK_MANAGER) {
      // Content managers see all books
      const whereClause = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { authorName: { contains: search, mode: 'insensitive' as const } },
            { summary: { contains: search, mode: 'insensitive' as const } },
          ]
        }),
        ...(subject && { subjects: { has: subject } }),
        ...(readingLevel && { readingLevel }),
      };

      totalCount = await prisma.book.count({ where: whereClause });

      books = await prisma.book.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              bookAssignments: true,
              reviews: true,
              bookClubs: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

    } else {
      // Other roles see only published, non-premium books
      const whereClause = {
        isPublished: true,
        isPremium: false,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { authorName: { contains: search, mode: 'insensitive' as const } },
            { summary: { contains: search, mode: 'insensitive' as const } },
          ]
        }),
        ...(subject && { subjects: { has: subject } }),
        ...(readingLevel && { readingLevel }),
      };

      totalCount = await prisma.book.count({ where: whereClause });

      books = await prisma.book.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              reviews: true,
              bookClubs: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Format the response
    const formattedBooks = books.map(book => {
      const assignment = (book as any).bookAssignments?.[0];
      const progress = (book as any).learningProgress?.[0];
      
      return {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        authorName: book.authorName,
        authorAge: book.authorAge,
        authorLocation: book.authorLocation,
        summary: book.summary,
        language: book.language,
        ageRange: book.ageRange,
        readingLevel: book.readingLevel,
        subjects: book.subjects,
        genres: book.genres,
        tags: book.tags,
        coverImage: book.coverImage,
        pageCount: book.pageCount,
        isPremium: book.isPremium,
        isPublished: book.isPublished,
        rating: book.rating,
        viewCount: book.viewCount,
        _count: book._count,
        
        // Assignment details for students
        ...(assignment && {
          assignment: {
            id: assignment.id,
            assignedAt: assignment.assignedAt,
            dueDate: assignment.dueDate,
            instructions: assignment.instructions,
            isRequired: assignment.isRequired,
            teacher: assignment.teacher,
            class: assignment.class,
          }
        }),
        
        // Progress for students
        ...(progress && {
          progress: {
            currentPage: progress.currentPage,
            totalPages: progress.totalPages,
            percentComplete: progress.percentComplete,
            lastReadAt: progress.lastReadAt,
            completedAt: progress.completedAt,
          }
        }),
        
        // Access information
        accessType: userRole === UserRole.LEARNER ? 'assigned' : 'library',
        canRead: true,
        canDownload: book.downloadAllowed && userRole !== UserRole.LEARNER,
        canPrint: book.printAllowed && userRole !== UserRole.LEARNER,
      };
    });

    // Log access for security audit
    if (userRole === UserRole.LEARNER) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'VIEWED_ASSIGNED_BOOKS',
          entity: 'BOOK',
          entityId: 'list-view',
          metadata: {
            bookCount: formattedBooks.length,
            page,
            search,
          },
        }
      });
    }

    return NextResponse.json({
      success: true,
      books: formattedBooks,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      accessNote: userRole === UserRole.LEARNER 
        ? 'Showing only books assigned by your teacher'
        : 'Showing library books',
    });

  } catch (error) {
    console.error('Error fetching assigned books:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}