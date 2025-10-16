import { PrismaClient } from '@prisma/client'
import { UserRole } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
  systemPrisma: PrismaClient
}

export const prisma = globalForPrisma.prisma || new PrismaClient()

// System Prisma client - SECURED VERSION with proper RLS handling
export const systemPrisma = globalForPrisma.systemPrisma || new PrismaClient()

/**
 * SECURITY FIX: Controlled RLS bypass for authenticated system operations
 * This replaces the dangerous blanket RLS bypass with controlled access
 */
export async function executeWithControlledAccess<T>(
  operation: (client: any) => Promise<T>,
  context: {
    userId?: string;
    userRole?: UserRole;
    operation: 'CREATE_USER' | 'AUTH_LOOKUP' | 'SYSTEM_ADMIN';
    reason: string;
  }
): Promise<T> {

  // Log all RLS bypass attempts for security monitoring
  console.log('[SECURITY] Controlled RLS Access:', {
    operation: context.operation,
    userRole: context.userRole,
    userId: context.userId,
    reason: context.reason,
    timestamp: new Date().toISOString()
  });

  return systemPrisma.$transaction(async (tx) => {
    try {
      // Set secure context instead of blanket bypass
      if (context.userId) {
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`
      }

      if (context.userRole) {
        await tx.$executeRaw`SELECT set_config('app.current_user_role', ${context.userRole}, true)`
      }

      // Only bypass RLS for specific, authorized operations
      switch (context.operation) {
        case 'CREATE_USER':
          // Allow user creation only
          await tx.$executeRaw`SELECT set_config('app.operation_type', 'CREATE_USER', true)`
          break;

        case 'AUTH_LOOKUP':
          // Allow authentication lookups only
          await tx.$executeRaw`SELECT set_config('app.operation_type', 'AUTH_LOOKUP', true)`
          break;

        case 'SYSTEM_ADMIN':
          // Admin operations - log extensively
          console.warn('[SECURITY] System admin operation requested:', context);
          await tx.$executeRaw`SELECT set_config('app.operation_type', 'SYSTEM_ADMIN', true)`
          break;

        default:
          throw new Error(`Unauthorized RLS bypass attempt: ${context.operation}`);
      }

      return operation(tx)
    } catch (error: any) {
      // Log security violations
      console.error('[SECURITY] RLS bypass failed:', {
        error: error.message,
        context,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  })
}

/**
 * DEPRECATED: Legacy function for backward compatibility
 * This will be removed after migration to secure version
 * @deprecated Use executeWithControlledAccess instead
 */
export async function executeWithRLSBypass<T>(operation: (client: any) => Promise<T>): Promise<T> {
  // Log usage of deprecated function for migration tracking
  console.warn('[SECURITY] DEPRECATED: executeWithRLSBypass used. Migrate to executeWithControlledAccess');
  console.trace('Stack trace for deprecated function usage');

  // For now, maintain compatibility but add security logging
  return systemPrisma.$transaction(async (tx) => {
    console.warn('[SECURITY] RLS BYPASS USED - SECURITY RISK', {
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });

    try {
      await tx.$executeRaw`SELECT set_config('app.current_user_role', 'LEGACY_BYPASS', true)`
      await tx.$executeRaw`SELECT set_config('app.current_user_id', 'legacy', true)`
      // Still bypass for compatibility, but log it
      await tx.$executeRaw`SET LOCAL row_security = off`
    } catch (error: any) {
      console.log('RLS bypass setup failed:', error.message)
    }

    return operation(tx)
  })
}

/**
 * Secure user operations with proper RLS policies
 */
export async function getUserById(userId: string, requestingUserId?: string) {
  return executeWithControlledAccess(
    (client) => client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        // Exclude sensitive fields like password
      }
    }),
    {
      userId: requestingUserId,
      operation: 'AUTH_LOOKUP',
      reason: `User lookup for ID: ${userId}`
    }
  )
}

/**
 * Secure user creation with controlled access
 */
export async function createUserWithProfiles(userData: any) {
  return executeWithControlledAccess(
    async (client) => {
      const user = await client.user.create({
        data: userData.user
      });

      if (userData.profile) {
        await client.profile.create({
          data: { ...userData.profile, userId: user.id }
        });
      }

      if (userData.subscription) {
        await client.subscription.create({
          data: { ...userData.subscription, userId: user.id }
        });
      }

      return user;
    },
    {
      operation: 'CREATE_USER',
      reason: 'User registration with profiles'
    }
  )
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.systemPrisma = systemPrisma
}

export default prisma