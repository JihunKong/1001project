import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Language preference reset to English' });

  response.cookies.set('preferred-language', 'en', {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax'
  });

  return response;
}
