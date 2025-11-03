import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface ClassInfo {
  id: string;
  code: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  teacherEmail: string;
  department: string;
  studentCount: number;
  maxStudents: number;
  schedule: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const mockClasses: ClassInfo[] = [
  {
    id: '1',
    code: 'ENG-101',
    name: 'English Literature',
    subject: 'English',
    gradeLevel: '9th Grade',
    teacherName: 'Emily Rodriguez',
    teacherEmail: 'emily.rodriguez@school.edu',
    department: 'High School',
    studentCount: 28,
    maxStudents: 30,
    schedule: 'Mon/Wed/Fri 9:00-10:00 AM',
    isActive: true,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
  },
  {
    id: '2',
    code: 'MATH-201',
    name: 'Algebra I',
    subject: 'Mathematics',
    gradeLevel: '8th Grade',
    teacherName: 'Michael Chen',
    teacherEmail: 'michael.chen@school.edu',
    department: 'Middle School',
    studentCount: 25,
    maxStudents: 28,
    schedule: 'Tue/Thu 10:00-11:30 AM',
    isActive: true,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
  },
  {
    id: '3',
    code: 'SCI-301',
    name: 'Biology',
    subject: 'Science',
    gradeLevel: '10th Grade',
    teacherName: 'Emily Rodriguez',
    teacherEmail: 'emily.rodriguez@school.edu',
    department: 'High School',
    studentCount: 30,
    maxStudents: 30,
    schedule: 'Mon/Wed 11:00 AM-12:30 PM',
    isActive: true,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
  },
  {
    id: '4',
    code: 'ENG-001',
    name: 'Reading Fundamentals',
    subject: 'English',
    gradeLevel: '1st Grade',
    teacherName: 'Sarah Johnson',
    teacherEmail: 'sarah.johnson@school.edu',
    department: 'Elementary',
    studentCount: 22,
    maxStudents: 25,
    schedule: 'Daily 8:30-9:30 AM',
    isActive: true,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
  },
  {
    id: '5',
    code: 'SPEC-101',
    name: 'Special Reading Program',
    subject: 'Special Education',
    gradeLevel: 'Mixed',
    teacherName: 'Lisa Thompson',
    teacherEmail: 'lisa.thompson@school.edu',
    department: 'Special Education',
    studentCount: 12,
    maxStudents: 15,
    schedule: 'Mon/Wed/Fri 1:00-2:00 PM',
    isActive: true,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
  },
  {
    id: '6',
    code: 'HIST-201',
    name: 'World History',
    subject: 'History',
    gradeLevel: '7th Grade',
    teacherName: 'Michael Chen',
    teacherEmail: 'michael.chen@school.edu',
    department: 'Middle School',
    studentCount: 27,
    maxStudents: 30,
    schedule: 'Tue/Thu 1:30-3:00 PM',
    isActive: true,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
  },
  {
    id: '7',
    code: 'ART-101',
    name: 'Creative Writing',
    subject: 'Arts',
    gradeLevel: '11th Grade',
    teacherName: 'Emily Rodriguez',
    teacherEmail: 'emily.rodriguez@school.edu',
    department: 'High School',
    studentCount: 18,
    maxStudents: 20,
    schedule: 'Fri 2:00-3:30 PM',
    isActive: false,
    startDate: '2025-09-01',
    endDate: '2026-06-15'
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
    // const classes = await prisma.class.findMany({
    //   where: {
    //     institutionId: session.user.institutionId
    //   },
    //   include: {
    //     teacher: {
    //       select: {
    //         name: true,
    //         email: true,
    //         department: {
    //           select: {
    //             name: true
    //           }
    //         }
    //       }
    //     },
    //     enrollments: {
    //       select: {
    //         id: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     name: 'asc'
    //   }
    // });

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const teacher = searchParams.get('teacher');
    const subject = searchParams.get('subject');
    const isActive = searchParams.get('isActive');

    let filteredClasses = mockClasses;

    if (department) {
      filteredClasses = filteredClasses.filter(c => c.department === department);
    }

    if (teacher) {
      filteredClasses = filteredClasses.filter(c =>
        c.teacherName.toLowerCase().includes(teacher.toLowerCase()) ||
        c.teacherEmail.toLowerCase().includes(teacher.toLowerCase())
      );
    }

    if (subject) {
      filteredClasses = filteredClasses.filter(c =>
        c.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      filteredClasses = filteredClasses.filter(c => c.isActive === activeFilter);
    }

    return NextResponse.json({
      classes: filteredClasses,
      total: filteredClasses.length,
      activeCount: filteredClasses.filter(c => c.isActive).length,
      inactiveCount: filteredClasses.filter(c => !c.isActive).length
    });
  } catch (error) {
    logger.error('Error fetching classes', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
