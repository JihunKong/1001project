import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  try {
    const { lang } = await params;

    if (!/^[a-z]{2}$/.test(lang)) {
      console.error('[API /api/i18n] Invalid language code:', lang);
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'locales', 'generated', `${lang}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(content);

    return NextResponse.json(translations, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /api/i18n] ⚠️ Failed to load translations:', error);
    return NextResponse.json({}, { status: 404 });
  }
}
