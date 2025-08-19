import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    if (userRole !== UserRole.VOLUNTEER && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied. Volunteer or Admin role required.' }, 
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Volunteer API endpoint - GET',
      userRole,
      userId: session.user.id
    });
    
  } catch (error) {
    console.error('Volunteer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    if (userRole !== UserRole.VOLUNTEER && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied. Volunteer or Admin role required.' }, 
        { status: 403 }
      );
    }

    const body = await req.json();
    
    return NextResponse.json({
      message: 'Volunteer API endpoint - POST',
      userRole,
      userId: session.user.id,
      data: body
    });
    
  } catch (error) {
    console.error('Volunteer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}