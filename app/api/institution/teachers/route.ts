import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  classCount: number;
  studentCount: number;
  totalReadingHours: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

const mockTeachers: Teacher[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    department: 'Elementary',
    classCount: 3,
    studentCount: 75,
    totalReadingHours: 234,
    lastActive: '2025-10-16T10:30:00Z',
    status: 'active'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@school.edu',
    department: 'Middle School',
    classCount: 4,
    studentCount: 95,
    totalReadingHours: 312,
    lastActive: '2025-10-16T14:15:00Z',
    status: 'active'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@school.edu',
    department: 'High School',
    classCount: 2,
    studentCount: 58,
    totalReadingHours: 189,
    lastActive: '2025-10-15T16:45:00Z',
    status: 'active'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@school.edu',
    department: 'Elementary',
    classCount: 3,
    studentCount: 68,
    totalReadingHours: 201,
    lastActive: '2025-10-14T09:20:00Z',
    status: 'inactive'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@school.edu',
    department: 'Special Education',
    classCount: 2,
    studentCount: 24,
    totalReadingHours: 156,
    lastActive: '2025-10-16T11:00:00Z',
    status: 'active'
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'INSTITUTION') {
      return NextResponse.json(
        { error: 'Forbidden - INSTITUTION role required' },
        { status: 403 }
      );
    }

    // TODO: Once schema is updated, replace with real query:
    // const teachers = await prisma.user.findMany({
    //   where: {
    //     institutionId: session.user.institutionId,
    //     role: 'TEACHER'
    //   },
    //   include: {
    //     department: true,
    //     teachingClasses: {
    //       include: {
    //         enrollments: true
    //       }
    //     }
    //   }
    // });

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status') as 'active' | 'inactive' | null;

    let filteredTeachers = mockTeachers;

    if (department) {
      filteredTeachers = filteredTeachers.filter(t => t.department === department);
    }

    if (status) {
      filteredTeachers = filteredTeachers.filter(t => t.status === status);
    }

    return NextResponse.json({
      teachers: filteredTeachers,
      total: filteredTeachers.length
    });
  } catch (error) {
    logger.error('Error fetching teachers', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    if (session.user.role !== 'INSTITUTION') {
      return NextResponse.json(
        { error: 'Forbidden - INSTITUTION role required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.email || !body.name || !body.department) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, department' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Once schema is updated, replace with real query:
    // const existingTeacher = await prisma.user.findUnique({
    //   where: { email: body.email }
    // });
    //
    // if (existingTeacher) {
    //   return NextResponse.json(
    //     { error: 'Teacher with this email already exists' },
    //     { status: 409 }
    //   );
    // }
    //
    // const newTeacher = await prisma.user.create({
    //   data: {
    //     email: body.email,
    //     name: body.name,
    //     role: 'TEACHER',
    //     institutionId: session.user.institutionId,
    //     profile: {
    //       create: {
    //         subjects: body.subjects || []
    //       }
    //     }
    //   },
    //   include: {
    //     department: true
    //   }
    // });

    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      department: body.department,
      classCount: 0,
      studentCount: 0,
      totalReadingHours: 0,
      lastActive: new Date().toISOString(),
      status: 'active'
    };

    return NextResponse.json(
      {
        success: true,
        teacher: newTeacher,
        message: 'Teacher invitation sent successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating teacher', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
