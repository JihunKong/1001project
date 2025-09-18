import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Simple test login endpoint - ONLY FOR DEVELOPMENT
export async function POST(request: NextRequest) {
  // Only allow in test/development mode
  if (process.env.NODE_ENV === 'production' && process.env.TEST_MODE_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Only allow test accounts
    if (!email.includes('local.dev') && !email.includes('@test.')) {
      return NextResponse.json({ error: 'Only test accounts allowed' }, { status: 403 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET || 'test-secret-key';
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      },
      secret
    );

    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Test login successful'
    });

  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}