import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// POST /api/admin/stories/[id]/convert-to-product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Product conversion feature is not implemented in this version
    return NextResponse.json({ 
      error: 'Product conversion feature is not implemented in this version' 
    }, { status: 501 });

  } catch (error) {
    console.error('Error in convert-to-product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}