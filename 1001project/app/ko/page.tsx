import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function KoreanRoute() {
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', 'ko', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/'
  });
  
  redirect('/');
}