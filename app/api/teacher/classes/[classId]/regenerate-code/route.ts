import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { classId } = await params;

    // Check if class exists and belongs to teacher
    const existingClass = await prisma.class.findUnique({
      where: { 
        id: classId,
        teacherId: session.user.id
      }
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      );
    }

    // Generate new unique code
    let newCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      newCode = generateClassCode();
      const codeExists = await prisma.class.findUnique({
        where: { code: newCode }
      });
      
      if (!codeExists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Update the class with new code
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { code: newCode }
    });

    return NextResponse.json({
      success: true,
      data: {
        code: updatedClass.code
      }
    });

  } catch (error) {
    console.error('Error regenerating class code:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to regenerate class code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}