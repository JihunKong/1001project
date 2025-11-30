import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'No active session' }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      }
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Session refresh failed' }, { status: 200 });
  }
}

export async function GET() {
  return POST();
}
