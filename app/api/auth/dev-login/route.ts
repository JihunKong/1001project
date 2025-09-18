import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Only allow in development or when email is not configured
  const emailConfigured = process.env.EMAIL_SERVICE_ENABLED === 'true' && 
                          process.env.SMTP_USER !== 'your-email@gmail.com';
  
  if (process.env.NODE_ENV === 'production' && emailConfigured) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  // Get email from query params
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Generate magic link token
    const token = await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: Math.random().toString(36).substring(2) + Date.now().toString(36),
        expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });
    
    // Return the magic link
    const magicLink = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?token=${token.token}&email=${encodeURIComponent(email)}&callbackUrl=/dashboard`;
    
    return NextResponse.json({ 
      message: 'Magic link generated (email service not configured)',
      magicLink,
      instructions: 'Copy and paste this link in your browser to login'
    });
    
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 });
  }
}