import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  isDemoEmail, 
  getOrCreateDemoUser, 
  generateDemoToken,
  getDemoModeStatus 
} from '@/lib/auth-demo';

export async function POST(request: NextRequest) {
  try {
    // Check if demo mode is enabled
    const demoStatus = getDemoModeStatus();
    if (!demoStatus.enabled) {
      return NextResponse.json(
        { error: 'Demo mode is not enabled' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if it's a demo email
    if (!isDemoEmail(email)) {
      return NextResponse.json(
        { error: 'Not a demo account email' },
        { status: 400 }
      );
    }

    // Get or create demo user
    const user = await getOrCreateDemoUser(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create demo account' },
        { status: 500 }
      );
    }

    // Generate demo token
    const token = generateDemoToken(user.id, user.email, user.role);

    // Create response with demo session
    const response = NextResponse.json({
      success: true,
      message: 'Demo login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isDemoAccount: true,
      },
      token,
      redirectUrl: '/dashboard',
    });

    // Set demo session cookie
    response.cookies.set('demo-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Demo login failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return demo mode status
  const demoStatus = getDemoModeStatus();
  
  return NextResponse.json({
    demoMode: demoStatus,
    availableAccounts: demoStatus.enabled ? [
      { email: 'learner@demo.1001stories.org', role: 'LEARNER' },
      { email: 'teacher@demo.1001stories.org', role: 'TEACHER' },
      { email: 'volunteer@demo.1001stories.org', role: 'VOLUNTEER' },
      { email: 'institution@demo.1001stories.org', role: 'INSTITUTION' },
    ] : [],
  });
}