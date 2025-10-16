import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint for Docker containers and monitoring
 * Returns basic status for public, detailed info for admins only
 */
export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now();

    // Check authentication for detailed info
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === UserRole.ADMIN;

    // Basic health check for non-admin users and Docker health checks
    if (!isAdmin) {
      return NextResponse.json(
        {
          status: 'healthy',
          timestamp: new Date().toISOString()
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Detailed system info for admin users only
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.4.1',
      uptime: process.uptime(),
    }

    // Check database connectivity (if available)
    let dbStatus = 'unknown'
    try {
      // Import Prisma client only if available
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      // Simple query to test database connection
      await prisma.$queryRaw`SELECT 1`
      await prisma.$disconnect()

      dbStatus = 'connected'
    } catch (error) {
      logger.warn('Database health check failed', { error })
      dbStatus = 'disconnected'
    }

    // Check Redis connectivity (if available)
    let redisStatus = 'unknown'
    try {
      if (process.env.REDIS_URL) {
        // Basic Redis connection test would go here
        // For now, just check if Redis URL is configured
        redisStatus = 'configured'
      } else {
        redisStatus = 'not_configured'
      }
    } catch (error) {
      logger.warn('Redis health check failed', { error })
      redisStatus = 'disconnected'
    }

    const responseTime = Date.now() - startTime

    const healthData = {
      ...systemInfo,
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      performance: {
        responseTime: `${responseTime}ms`,
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      docker: {
        required: process.env.DOCKER_REQUIRED === 'true',
        detected: process.env.DOCKER_REQUIRED === 'true' || false
      }
    }

    // Determine overall health status
    const isHealthy = dbStatus === 'connected' || dbStatus === 'unknown'

    return NextResponse.json(
      {
        ...healthData,
        status: isHealthy ? 'healthy' : 'unhealthy'
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    logger.error('Health check error', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Internal server error during health check',
        environment: process.env.NODE_ENV || 'development'
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(_request: NextRequest) {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}