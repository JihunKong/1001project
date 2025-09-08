import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { upstageAdapter } from '@/lib/services/education/upstage-adapter';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, targetAge, targetLevel, title } = body;

    // Support both targetAge and targetLevel
    const level = targetLevel || targetAge;

    // Validate input
    if (!text || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Map difficulty levels to age groups
    let mappedAge = 'middle';
    if (level === 'Beginner' || level === 'elementary') {
      mappedAge = 'elementary';
    } else if (level === 'Intermediate' || level === 'middle') {
      mappedAge = 'middle';
    } else if (level === 'Advanced' || level === 'high' || level === 'adult') {
      mappedAge = 'high';
    }

    // Adapt text using Upstage AI
    const result = await upstageAdapter.adaptText({
      originalText: text,
      targetAge: mappedAge as any,
      title
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adapting text:', error);
    return NextResponse.json({ error: 'Failed to adapt text' }, { status: 500 });
  }
}