import { NextRequest, NextResponse } from 'next/server';
import { generateCuteCartoonImage } from '@/lib/google-genai-image';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, saveToFile = false, filename } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let outputPath: string | undefined;
    if (saveToFile && filename) {
      const publicDir = path.join(process.cwd(), 'public', 'generated-images');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      outputPath = path.join(publicDir, filename);
    }

    const result = await generateCuteCartoonImage(prompt, outputPath);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: result.base64Data,
      filePath: result.filePath ? `/generated-images/${filename}` : undefined
    });

  } catch (error) {
    console.error('[API] Error in generate-image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
