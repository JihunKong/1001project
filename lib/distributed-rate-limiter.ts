/**
 * Distributed Rate Limiter with Redis Backend
 * Provides comprehensive rate limiting with exponential backoff and security monitoring
 * Critical for preventing brute force attacks on class codes and other sensitive operations
 */

import { NextRequest } from 'next/server';
import { getRedisClient } from './redis';
import { logAuditEvent } from './security/headers';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  message?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest, identifier: string) => string;
  onLimitReached?: (request: NextRequest, identifier: string) => Promise<void>;
}

export interface ExponentialBackoffConfig extends RateLimitConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  failureWindowMs: number;
  maxFailures: number;
}

class DistributedRateLimiter {
  private redisClient: any;
  private fallbackStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.redisClient = getRedisClient();
    
    // Clean up fallback store every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.fallbackStore.entries()) {
        if (data.resetTime < now) {
          this.fallbackStore.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }

  // Lua script for atomic rate limiting operations
  private rateLimitScript = `
    local key = KEYS[1]
    local window = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    local current = redis.call('GET', key)
    local count = tonumber(current) or 0
    local resetTime = now + window
    
    if count < limit then
      local newCount = redis.call('INCR', key)
      if newCount == 1 then
        redis.call('EXPIRE', key, math.ceil(window / 1000))
      end
      local ttl = redis.call('TTL', key)
      return {newCount, 1, now + (ttl * 1000), limit - newCount}
    else
      local ttl = redis.call('TTL', key)
      return {count, 0, now + (ttl * 1000), 0}
    end
  `;

  // Enhanced rate limiting with distributed Redis support
  async checkRateLimit(
    request: NextRequest,
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const key = config.keyGenerator 
      ? config.keyGenerator(request, identifier)
      : `rate_limit:${identifier}:${request.nextUrl.pathname}:${windowStart}`;

    try {
      if (this.redisClient && typeof this.redisClient.eval === 'function') {
        // Use Redis for distributed rate limiting
        const result = await this.redisClient.eval(
          this.rateLimitScript,
          1,
          key,
          config.windowMs,
          config.maxRequests,
          now
        ) as [number, number, number, number];

        const [count, success, resetTime, remaining] = result;
        
        const rateLimitResult: RateLimitResult = {
          success: success === 1,
          limit: config.maxRequests,
          remaining: Math.max(0, remaining),
          resetTime,
          message: success === 1 ? undefined : config.message
        };

        if (!rateLimitResult.success) {
          rateLimitResult.retryAfter = Math.ceil((resetTime - now) / 1000);
          
          // Trigger callback if limit reached
          if (config.onLimitReached) {
            await config.onLimitReached(request, identifier);
          }
        }

        return rateLimitResult;
      } else {
        // Fallback to in-memory store if Redis unavailable
        return this.checkRateLimitFallback(key, config, now);
      }
    } catch (error) {
      console.error('[RATE_LIMITER] Redis error, falling back to memory:', error);
      return this.checkRateLimitFallback(key, config, now);
    }
  }

  // Fallback in-memory rate limiting
  private checkRateLimitFallback(
    key: string,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    const existing = this.fallbackStore.get(key);
    
    if (!existing || existing.resetTime < now) {
      // New window
      this.fallbackStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }

    if (existing.count < config.maxRequests) {
      // Within limit
      existing.count++;
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - existing.count,
        resetTime: existing.resetTime
      };
    }

    // Rate limited
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
      message: config.message
    };
  }

  // Exponential backoff for repeated failures
  async checkExponentialBackoff(
    request: NextRequest,
    identifier: string,
    config: ExponentialBackoffConfig,
    isFailure: boolean = false
  ): Promise<RateLimitResult> {
    const failureKey = `backoff_failures:${identifier}`;
    const backoffKey = `backoff_delay:${identifier}`;
    
    try {
      let failures = 0;
      let currentDelay = 0;

      if (this.redisClient) {
        // Get current failure count
        const failureCount = await this.redisClient.get(failureKey);
        failures = failureCount ? parseInt(failureCount, 10) : 0;

        // Get current backoff delay
        const delayData = await this.redisClient.get(backoffKey);
        currentDelay = delayData ? parseInt(delayData, 10) : 0;
      }

      // If this is a failure, increment counter and apply exponential backoff
      if (isFailure) {
        failures++;
        
        if (failures >= config.maxFailures) {
          // Calculate exponential backoff delay
          const exponentialDelay = Math.min(
            config.baseDelayMs * Math.pow(2, failures - config.maxFailures),
            config.maxDelayMs
          );
          
          if (this.redisClient) {
            await this.redisClient.setex(failureKey, Math.ceil(config.failureWindowMs / 1000), failures);
            await this.redisClient.setex(backoffKey, Math.ceil(exponentialDelay / 1000), exponentialDelay);
          }

          // Log security event
          await logAuditEvent({
            timestamp: new Date(),
            userId: undefined,
            action: 'EXPONENTIAL_BACKOFF_TRIGGERED',
            resource: request.nextUrl.pathname,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || '',
            success: false,
            metadata: {
              identifier,
              failures,
              delayMs: exponentialDelay,
              endpoint: request.nextUrl.pathname
            }
          });

          return {
            success: false,
            limit: config.maxRequests,
            remaining: 0,
            resetTime: Date.now() + exponentialDelay,
            retryAfter: Math.ceil(exponentialDelay / 1000),
            message: `Too many failed attempts. Please wait ${Math.ceil(exponentialDelay / 1000)} seconds before trying again.`
          };
        }
        
        // Update failure count
        if (this.redisClient) {
          await this.redisClient.setex(failureKey, Math.ceil(config.failureWindowMs / 1000), failures);
        }
      } else {
        // Success - reset failure count
        if (this.redisClient) {
          await this.redisClient.del(failureKey);
          await this.redisClient.del(backoffKey);
        }
      }

      // Check if currently in backoff period
      if (currentDelay > 0) {
        const ttl = this.redisClient ? await this.redisClient.ttl(backoffKey) : 0;
        if (ttl > 0) {
          return {
            success: false,
            limit: config.maxRequests,
            remaining: 0,
            resetTime: Date.now() + (ttl * 1000),
            retryAfter: ttl,
            message: `Please wait ${ttl} seconds before trying again.`
          };
        }
      }

      // Apply normal rate limiting
      return this.checkRateLimit(request, identifier, config);
      
    } catch (error) {
      console.error('[EXPONENTIAL_BACKOFF] Error:', error);
      // Fall back to normal rate limiting on error
      return this.checkRateLimit(request, identifier, config);
    }
  }

  // Security monitoring for suspicious patterns
  async recordSecurityEvent(
    identifier: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const key = `security_events:${identifier}:${eventType}`;
    const now = Date.now();
    
    try {
      if (this.redisClient) {
        // Store security event with 24-hour expiration
        await this.redisClient.setex(
          `${key}:${now}`,
          24 * 60 * 60,
          JSON.stringify({ severity, metadata, timestamp: now })
        );

        // Count events in the last hour
        const hourAgo = now - (60 * 60 * 1000);
        const keys = await this.redisClient.keys(`${key}:*`);
        const recentEvents = keys.filter((k: string) => {
          const timestamp = parseInt(k.split(':').pop() || '0', 10);
          return timestamp > hourAgo;
        });

        // Alert on suspicious patterns
        if (recentEvents.length > 10 && severity === 'high') {
          console.warn(`[SECURITY_ALERT] High volume of ${eventType} events from ${identifier}: ${recentEvents.length} in last hour`);
        }
      }
    } catch (error) {
      console.error('[SECURITY_MONITORING] Error recording event:', error);
    }
  }
}

// Global rate limiter instance
const globalRateLimiter = new DistributedRateLimiter();

// Pre-configured rate limiters for different scenarios
export const RateLimiters = {
  // Class joining - CRITICAL for preventing brute force attacks
  classJoin: (identifier: string) => ({
    config: {
      maxRequests: 10, // 10 attempts per hour per IP
      windowMs: 60 * 60 * 1000, // 1 hour
      message: 'Too many class join attempts. Please try again later.',
      keyGenerator: (req: NextRequest, id: string) => `class_join:${id}:${Math.floor(Date.now() / (60 * 60 * 1000))}`,
      onLimitReached: async (req: NextRequest, id: string) => {
        await globalRateLimiter.recordSecurityEvent(
          id,
          'CLASS_JOIN_RATE_LIMITED',
          'high',
          { endpoint: req.nextUrl.pathname, timestamp: Date.now() }
        );
      }
    } as RateLimitConfig,
    exponentialBackoff: {
      maxRequests: 5, // After 5 failures, start exponential backoff
      windowMs: 60 * 60 * 1000,
      baseDelayMs: 1000, // Start with 1 second delay
      maxDelayMs: 5 * 60 * 1000, // Max 5 minutes delay
      failureWindowMs: 60 * 60 * 1000, // Reset failure count after 1 hour
      maxFailures: 3, // Start backoff after 3 failures
      message: 'Too many failed class join attempts.'
    } as ExponentialBackoffConfig
  }),

  // Authentication endpoints
  authentication: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
    onLimitReached: async (req: NextRequest, id: string) => {
      await globalRateLimiter.recordSecurityEvent(
        id,
        'AUTH_RATE_LIMITED',
        'medium',
        { endpoint: req.nextUrl.pathname }
      );
    }
  } as RateLimitConfig,

  // General API endpoints
  generalApi: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  } as RateLimitConfig,

  // Admin operations
  adminApi: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many admin requests. Please try again later.',
    onLimitReached: async (req: NextRequest, id: string) => {
      await globalRateLimiter.recordSecurityEvent(
        id,
        'ADMIN_API_RATE_LIMITED',
        'critical',
        { endpoint: req.nextUrl.pathname }
      );
    }
  } as RateLimitConfig,

  // File uploads
  upload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many upload requests. Please try again later.'
  } as RateLimitConfig
};

// Main rate limiting function
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return globalRateLimiter.checkRateLimit(request, identifier, config);
}

// Exponential backoff function
export async function checkExponentialBackoff(
  request: NextRequest,
  identifier: string,
  config: ExponentialBackoffConfig,
  isFailure: boolean = false
): Promise<RateLimitResult> {
  return globalRateLimiter.checkExponentialBackoff(request, identifier, config, isFailure);
}

// Security event recording
export async function recordSecurityEvent(
  identifier: string,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata: Record<string, any> = {}
): Promise<void> {
  return globalRateLimiter.recordSecurityEvent(identifier, eventType, severity, metadata);
}

export default globalRateLimiter;