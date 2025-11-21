import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - must be ADMIN
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Read build info
    let buildInfo = {
      version: '0.2.0',
      environment: process.env.NODE_ENV || 'production',
      buildTime: new Date().toISOString(),
    };

    try {
      const buildInfoPath = path.join(process.cwd(), 'public', 'build-info.json');
      const buildInfoContent = await fs.readFile(buildInfoPath, 'utf-8');
      buildInfo = JSON.parse(buildInfoContent);
    } catch (error) {
      console.log('Build info not found, using defaults');
    }

    // Check database connection
    let databaseConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (error) {
      console.error('Database connection check failed:', error);
    }

    // Feature flags
    const featureFlags = {
      aiImages: process.env.ENABLE_AI_IMAGES === 'true',
      tts: process.env.ENABLE_TTS === 'true',
      chatbot: process.env.ENABLE_CHATBOT === 'true',
    };

    // Services status
    const services = {
      database: databaseConnected,
      redis: null, // Redis check would require redis client
      email: process.env.EMAIL_SERVER_HOST ? true : null,
    };

    return NextResponse.json({
      version: buildInfo.version,
      environment: buildInfo.environment,
      buildTime: buildInfo.buildTime,
      databaseStatus: databaseConnected ? 'connected' : 'disconnected',
      featureFlags,
      services,
    });

  } catch (error) {
    console.error('Error fetching system info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
