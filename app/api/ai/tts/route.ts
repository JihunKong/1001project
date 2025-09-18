import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleTTSRequest } from '@/lib/ai-service';
import { z } from 'zod';

const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = ttsSchema.parse(body);

    const result = await handleTTSRequest(validatedData.text, validatedData.voice);

    return NextResponse.json({
      success: result.success,
      error: result.error || 'Sound generation failed',
    });

  } catch (error) {
    console.error('TTS error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Sound generation failed' 
      },
      { status: 200 }
    );
  }
}