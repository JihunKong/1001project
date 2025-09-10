import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Debug log
console.log('OpenAI API Key configured:', !!OPENAI_API_KEY);

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const { text, voice = 'alloy', speed = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // ALWAYS return error - TTS is disabled to prevent monster sounds
    console.log('TTS request blocked - returning error to prevent browser fallback');
    return NextResponse.json(
      { 
        success: false,
        error: 'Sound generation failed' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}