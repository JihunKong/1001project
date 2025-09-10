import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

    let classes;

    // Different queries based on role
    if (userRole === UserRole.TEACHER) {
      // Teachers see their own classes
      classes = await prisma.class.findMany({
        where: {
          teacherId: userId,
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
              lessons: true,
            }
          },
          enrollments: {
            select: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              },
              status: true,
              progress: true,
            },
            orderBy: {
              enrolledAt: 'desc'
            },
            take: 5, // Show recent 5 students
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (userRole === UserRole.LEARNER) {
      // Students see classes they're enrolled in
      classes = await prisma.class.findMany({
        where: {
          enrollments: {
            some: {
              studentId: userId,
              status: 'ACTIVE',
            }
          }
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          school: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
              lessons: true,
              bookAssignments: true,
            }
          },
          enrollments: {
            where: {
              studentId: userId,
            },
            select: {
              status: true,
              progress: true,
              enrolledAt: true,
            }
          },
          bookAssignments: {
            select: {
              id: true,
              bookId: true,
              dueDate: true,
              isRequired: true,
            },
            where: {
              OR: [
                { classId: { not: null } },
                { studentId: userId }
              ]
            },
            take: 5,
            orderBy: {
              assignedAt: 'desc'
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });
    } else if (userRole === UserRole.ADMIN || userRole === UserRole.INSTITUTION || userRole === UserRole.CONTENT_ADMIN) {
      // Admins and institutions see all classes
      classes = await prisma.class.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          school: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
              lessons: true,
              bookAssignments: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50, // Limit for performance
      });
    } else {
      // Other roles don't have access to classes
      return NextResponse.json({ classes: [] });
    }

    // Format the response
    const formattedClasses = classes.map(cls => ({
      ...cls,
      formattedCode: `${cls.code.slice(0, 3)}-${cls.code.slice(3)}`,
      isActive: cls.isActive && new Date() < cls.endDate,
      daysRemaining: Math.max(0, Math.ceil((cls.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    }));

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
      count: formattedClasses.length,
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}