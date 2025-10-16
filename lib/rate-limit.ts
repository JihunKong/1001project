/**
 * API Rate Limiting Utilities
 *
 * Implements rate limiting to prevent abuse and DDoS attacks
 * on the 1001 Stories platform APIs.
 */

import { NextRequest } from 'next/server';
import { getRedisClient, isRedisAvailable } from './redis';
import { logger } from './logger';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory fallback store when Redis is unavailable
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically (only for in-memory fallback)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  if (remoteAddr) {
    return remoteAddr.split(',')[0].trim();
  }

  // Fallback for development
  return '127.0.0.1';
}

/**
 * Generate rate limit key for a request
 */
function getRateLimitKey(request: NextRequest, identifier?: string): string {
  const ip = getClientIP(request);
  const pathname = new URL(request.url).pathname;

  if (identifier) {
    return `${identifier}:${pathname}`;
  }

  return `${ip}:${pathname}`;
}

/**
 * Check and update rate limit using Redis (with in-memory fallback)
 */
async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; error?: string } | null> {
  try {
    const client = await getRedisClient();
    if (!client || !isRedisAvailable()) {
      return null;
    }

    const now = Date.now();
    const resetTime = now + config.windowMs;
    const windowKey = `ratelimit:${key}:${Math.floor(now / config.windowMs)}`;

    const multi = client.multi();
    multi.incr(windowKey);
    multi.pExpire(windowKey, config.windowMs);

    const results = await multi.exec();
    const count = results?.[0] as number || 0;

    if (count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: config.message || 'Too many requests, please try again later'
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetTime
    };
  } catch (error) {
    logger.error('Redis rate limit check failed', error);
    return null;
  }
}

/**
 * Check and update rate limit using in-memory fallback
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; error?: string } {
  const now = Date.now();
  const resetTime = now + config.windowMs;

  let rateLimitData = rateLimitStore.get(key);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = { count: 0, resetTime };
    rateLimitStore.set(key, rateLimitData);
  }

  if (rateLimitData.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimitData.resetTime,
      error: config.message || 'Too many requests, please try again later'
    };
  }

  rateLimitData.count++;
  rateLimitStore.set(key, rateLimitData);

  return {
    allowed: true,
    remaining: config.maxRequests - rateLimitData.count,
    resetTime: rateLimitData.resetTime
  };
}

/**
 * Check and update rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number; error?: string }> {
  const key = getRateLimitKey(request, identifier);

  const redisResult = await checkRateLimitRedis(key, config);

  if (redisResult !== null) {
    return redisResult;
  }

  return checkRateLimitMemory(key, config);
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints
  GENERAL_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,          // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later'
  },

  // Search endpoints (more restrictive)
  SEARCH_API: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 30,           // 30 searches per minute
    message: 'Too many search requests, please slow down'
  },

  // Authentication endpoints (very restrictive)
  AUTH_API: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  },

  // User registration (extremely restrictive)
  SIGNUP_API: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 5,            // 5 signups per hour per IP
    message: 'Too many registration attempts, please try again later'
  },

  // Content creation
  CONTENT_CREATION: {
    windowMs: 10 * 60 * 1000,  // 10 minutes
    maxRequests: 20,           // 20 content creations per 10 minutes
    message: 'Too many content creation requests, please try again later'
  }
};

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const rateLimitResult = await checkRateLimit(request, config);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimitResult.error,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const response = await handler(request);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return response;
  };
}

/**
 * Input sanitization for search queries
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .substring(0, 100) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .replace(/[;\\]/g, '') // Remove SQL-like characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validate and sanitize query parameters
 */
export function validateQueryParams(params: { [key: string]: string | null }): {
  [key: string]: string | number | boolean
} {
  const validated: { [key: string]: string | number | boolean } = {};

  // Validate page parameter
  if (params.page) {
    const page = parseInt(params.page);
    validated.page = (page >= 1 && page <= 1000) ? page : 1;
  }

  // Validate limit parameter
  if (params.limit) {
    const limit = parseInt(params.limit);
    validated.limit = (limit >= 1 && limit <= 100) ? limit : 20;
  }

  // Validate and sanitize search
  if (params.search) {
    validated.search = sanitizeSearchInput(params.search);
  }

  // Validate language (ISO codes)
  if (params.language) {
    const lang = params.language.trim().toLowerCase();
    if (/^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang)) {
      validated.language = lang;
    }
  }

  // Validate category (alphanumeric + spaces + hyphens)
  if (params.category) {
    const category = params.category.trim();
    if (/^[a-zA-Z0-9\s\-_]{1,50}$/.test(category)) {
      validated.category = category;
    }
  }

  // Validate age range
  if (params.ageRange) {
    const ageRange = params.ageRange.trim();
    if (/^[a-zA-Z0-9\s\-+]{1,20}$/.test(ageRange)) {
      validated.ageRange = ageRange;
    }
  }

  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'authorName', 'publishedAt'];
  if (params.sortBy && allowedSortFields.includes(params.sortBy)) {
    validated.sortBy = params.sortBy;
  }

  if (params.sortOrder && ['asc', 'desc'].includes(params.sortOrder)) {
    validated.sortOrder = params.sortOrder;
  }

  // Validate boolean parameters
  if (params.published !== null) {
    validated.published = params.published === 'true';
  }

  if (params.premium !== null) {
    validated.premium = params.premium === 'true';
  }

  return validated;
}

/**
 * Secure query builder for search operations
 */
export function buildSecureSearchQuery(searchTerm: string): any {
  if (!searchTerm) {
    return {};
  }

  const sanitizedSearch = sanitizeSearchInput(searchTerm);

  if (!sanitizedSearch || sanitizedSearch.length < 2) {
    return {};
  }

  // Use Prisma's safe query methods
  return {
    OR: [
      { title: { contains: sanitizedSearch, mode: 'insensitive' } },
      { authorName: { contains: sanitizedSearch, mode: 'insensitive' } },
      { summary: { contains: sanitizedSearch, mode: 'insensitive' } }
    ]
  };
}

export default {
  checkRateLimit,
  withRateLimit,
  sanitizeSearchInput,
  validateQueryParams,
  buildSecureSearchQuery,
  RATE_LIMITS
};