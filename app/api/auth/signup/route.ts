import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, organization, subscribeNewsletter } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = Object.values(UserRole);
    const userRole = validRoles.includes(role as UserRole) ? (role as UserRole) : UserRole.LEARNER;

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: userRole,
        profile: {
          create: {
            organization,
            language: 'en',
          },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
            maxStudents: 30,
            maxDownloads: 10,
            canAccessPremium: false,
            canDownloadPDF: false,
            canCreateClasses: userRole === UserRole.TEACHER || userRole === UserRole.INSTITUTION,
          },
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    });

    // Send welcome email (don't await to not block the response)
    sendWelcomeEmail(email, name, userRole).catch(console.error);

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Failed to create user account' },
      { status: 500 }
    );
  }
}