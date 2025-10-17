import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Department {
  id: string;
  name: string;
  code: string;
  teacherCount: number;
  studentCount: number;
  classCount: number;
  headTeacher?: {
    id: string;
    name: string;
    email: string;
  };
}

const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Elementary',
    code: 'ELEM',
    teacherCount: 8,
    studentCount: 240,
    classCount: 12,
    headTeacher: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@school.edu'
    }
  },
  {
    id: '2',
    name: 'Middle School',
    code: 'MIDDLE',
    teacherCount: 12,
    studentCount: 360,
    classCount: 18,
    headTeacher: {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@school.edu'
    }
  },
  {
    id: '3',
    name: 'High School',
    code: 'HIGH',
    teacherCount: 15,
    studentCount: 450,
    classCount: 20,
    headTeacher: {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@school.edu'
    }
  },
  {
    id: '4',
    name: 'Special Education',
    code: 'SPED',
    teacherCount: 5,
    studentCount: 60,
    classCount: 8,
    headTeacher: {
      id: '5',
      name: 'Lisa Thompson',
      email: 'lisa.thompson@school.edu'
    }
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
    // const departments = await prisma.department.findMany({
    //   where: {
    //     institutionId: session.user.institutionId
    //   },
    //   include: {
    //     headTeacher: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true
    //       }
    //     },
    //     teachers: {
    //       include: {
    //         teachingClasses: {
    //           include: {
    //             enrollments: true
    //           }
    //         }
    //       }
    //     }
    //   }
    // });

    return NextResponse.json({
      departments: mockDepartments,
      total: mockDepartments.length
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
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

    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code' },
        { status: 400 }
      );
    }

    const codeRegex = /^[A-Z0-9_-]+$/;
    if (!codeRegex.test(body.code)) {
      return NextResponse.json(
        { error: 'Department code must contain only uppercase letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    // TODO: Once schema is updated, replace with real query:
    // const existingDepartment = await prisma.department.findFirst({
    //   where: {
    //     institutionId: session.user.institutionId,
    //     code: body.code
    //   }
    // });
    //
    // if (existingDepartment) {
    //   return NextResponse.json(
    //     { error: 'Department with this code already exists' },
    //     { status: 409 }
    //   );
    // }
    //
    // const newDepartment = await prisma.department.create({
    //   data: {
    //     name: body.name,
    //     code: body.code,
    //     description: body.description,
    //     institutionId: session.user.institutionId,
    //     headTeacherId: body.headTeacherId
    //   },
    //   include: {
    //     headTeacher: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true
    //       }
    //     }
    //   }
    // });

    const newDepartment: Department = {
      id: Date.now().toString(),
      name: body.name,
      code: body.code,
      teacherCount: 0,
      studentCount: 0,
      classCount: 0
    };

    return NextResponse.json(
      {
        success: true,
        department: newDepartment,
        message: 'Department created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
