import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  try {
    const { lang } = await params;

    // Validate language code (simple validation)
    if (!/^[a-z]{2}$/.test(lang)) {
      console.error('[API /api/translations] Invalid language code:', lang);
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    // Read translation file from project root
    const filePath = path.join(process.cwd(), 'locales', 'generated', `${lang}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(content);

    // Return with caching headers
    return NextResponse.json(translations, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /api/translations] ⚠️ Failed to load translations:', error);
    // Return empty object if file not found
    return NextResponse.json({}, { status: 404 });
  }
}
