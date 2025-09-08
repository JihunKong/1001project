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

    if (!openai) {
      console.error('OpenAI API key not configured');
      // Return a simple error without exposing the missing key
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 }
      );
    }

    // Generate a hash of the text for caching
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const fileName = `${textHash}-${voice}-${speed}.mp3`;
    const audioDir = join(process.cwd(), 'public', 'audio', 'tts');
    const filePath = join(audioDir, fileName);
    
    // Create directory if it doesn't exist
    await mkdir(audioDir, { recursive: true });

    // Check if we have a cached version
    try {
      await access(filePath);
      // File exists, return cached version
      return NextResponse.json({
        success: true,
        audioUrl: `/audio/tts/${fileName}`,
        cached: true,
      });
    } catch {
      // File doesn't exist, generate new audio
    }

    // Generate speech using OpenAI TTS with SDK
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as any, // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: speed,
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Save the audio file for caching
    await writeFile(filePath, buffer);

    // Return the audio URL instead of raw data
    return NextResponse.json({
      success: true,
      audioUrl: `/audio/tts/${fileName}`,
      cached: false,
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}