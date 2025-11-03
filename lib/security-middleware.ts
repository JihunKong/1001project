/**
 * SECURITY HARDENING: Comprehensive Security Middleware
 * Addresses critical security vulnerabilities identified in audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { logger } from '@/lib/logger';

// Initialize DOMPurify for server-side HTML sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * SECURITY: Strict input validation schemas
 */
export const SecuritySchemas = {
  // Email validation with additional security checks
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(320, 'Email too long') // RFC 5321 limit
    .refine(email => {
      // Block suspicious patterns
      const suspiciousPatterns = [
        /[<>'"]/,  // HTML/script injection attempts
        /javascript:/i,  // JavaScript protocol
        /data:/i,  // Data URLs
        /vbscript:/i,  // VBScript
        /@.*@/,  // Double @ signs
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(email));
    }, 'Email contains invalid characters'),

  // Text input with XSS protection
  safeText: z.string()
    .max(1000, 'Text too long')
    .transform(text => purify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })),

  // Rich text with controlled HTML
  richText: z.string()
    .max(50000, 'Content too long')
    .transform(html => purify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's',
                     'ul', 'ol', 'li', 'blockquote', 'br', 'hr'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    })),

  // File upload validation
  filename: z.string()
    .max(255, 'Filename too long')
    .refine(name => {
      // Block dangerous file patterns
      const dangerousPatterns = [
        /\.\./,  // Directory traversal
        /[<>:"|?*]/,  // Invalid filename characters
        /^\./,  // Hidden files
        /\.(exe|bat|cmd|scr|pif|com|dll|vbs|js|jar|app)$/i,  // Executable files
      ];
      return !dangerousPatterns.some(pattern => pattern.test(name));
    }, 'Invalid filename'),

  // URL validation
  url: z.string()
    .url('Invalid URL')
    .refine(url => {
      try {
        const parsed = new URL(url);
        // Block dangerous protocols
        const allowedProtocols = ['http:', 'https:'];
        return allowedProtocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'URL uses invalid protocol'),
};

/**
 * SECURITY: Enhanced rate limiting with IP tracking
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blocked: boolean;
    violations: number;
  };
}

const rateLimitStore: RateLimitStore = {};
const suspiciousIPs = new Set<string>();

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }
  });
}, 60 * 1000);

export function enhancedRateLimit(config: {
  windowMs: number;
  maxRequests: number;
  blockDuration?: number;
  violationThreshold?: number;
}) {
  return (req: NextRequest): { allowed: boolean; reason?: string } => {
    const ip = getClientIP(req);
    const key = `${ip}:${new URL(req.url).pathname}`;
    const now = Date.now();

    // Check if IP is permanently blocked
    if (suspiciousIPs.has(ip)) {
      logSecurityEvent('BLOCKED_IP_ATTEMPT', { ip, url: req.url });
      return { allowed: false, reason: 'IP blocked due to suspicious activity' };
    }

    let entry = rateLimitStore[key];
    if (!entry || now > entry.resetTime) {
      entry = rateLimitStore[key] = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
        violations: entry?.violations || 0
      };
    }

    entry.count++;

    // Check rate limit
    if (entry.count > config.maxRequests) {
      entry.violations++;

      // Block IP if too many violations
      if (entry.violations > (config.violationThreshold || 5)) {
        suspiciousIPs.add(ip);
        logSecurityEvent('IP_BLOCKED', { ip, violations: entry.violations });
      }

      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip,
        count: entry.count,
        max: config.maxRequests
      });

      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    return { allowed: true };
  };
}

/**
 * SECURITY: Get real client IP with proxy detection
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const headers = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',            // nginx
    'x-forwarded-for',      // General proxy
    'x-client-ip',          // Apache
    'x-cluster-client-ip',  // Cluster
    'x-forwarded',          // Proxy
    'forwarded-for',        // Proxy
    'forwarded',            // RFC 7239
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Take first IP if comma-separated
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback
  return '127.0.0.1';
}

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * SECURITY: SQL injection prevention for dynamic queries
 */
export function sanitizeSQLInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/['";\\]/g, '') // Remove SQL injection characters
    .replace(/--/g, '')      // Remove SQL comments
    .replace(/\/\*/g, '')    // Remove SQL block comments start
    .replace(/\*\//g, '')    // Remove SQL block comments end
    .replace(/xp_/gi, '')    // Remove SQL Server extended procedures
    .replace(/sp_/gi, '')    // Remove SQL Server stored procedures
    .trim()
    .substring(0, 100);      // Limit length
}

/**
 * SECURITY: File upload security
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }

  // Check filename
  const filenameValidation = SecuritySchemas.filename.safeParse(file.name);
  if (!filenameValidation.success) {
    return { valid: false, error: 'Invalid filename' };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

/**
 * SECURITY: Security event logging
 */
interface SecurityEvent {
  type: string;
  data: any;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const securityEvents: SecurityEvent[] = [];

export function logSecurityEvent(type: string, data: any, severity: SecurityEvent['severity'] = 'MEDIUM') {
  const event: SecurityEvent = {
    type,
    data: {
      ...data,
      userAgent: data.userAgent || 'unknown',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    severity
  };

  securityEvents.push(event);

  // Log to console for immediate visibility
  logger.warn(`[SECURITY-${severity}] ${type}`, event.data);

  // Keep only last 1000 events
  if (securityEvents.length > 1000) {
    securityEvents.shift();
  }

  // Alert on critical events
  if (severity === 'CRITICAL') {
    logger.error('CRITICAL SECURITY EVENT', event);
    // TODO: Send alert to security team
  }
}

/**
 * SECURITY: Request validation middleware
 */
export function validateRequest(req: NextRequest, schema: z.ZodSchema): {
  valid: boolean;
  data?: any;
  errors?: string[];
} {
  try {
    const body = req.json();
    const validated = schema.parse(body);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      );

      logSecurityEvent('VALIDATION_FAILED', {
        errors,
        url: req.url,
        ip: getClientIP(req)
      });

      return { valid: false, errors };
    }

    logSecurityEvent('REQUEST_PARSE_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
      ip: getClientIP(req)
    });

    return { valid: false, errors: ['Invalid request format'] };
  }
}

/**
 * SECURITY: CSRF protection
 */
export function validateCSRFToken(req: NextRequest): boolean {
  const token = req.headers.get('x-csrf-token');
  const sessionToken = req.headers.get('x-session-token');

  if (!token || !sessionToken) {
    logSecurityEvent('MISSING_CSRF_TOKEN', {
      url: req.url,
      ip: getClientIP(req)
    }, 'HIGH');
    return false;
  }

  // Simple CSRF validation - enhance with proper token generation
  const expectedToken = Buffer.from(sessionToken).toString('base64');
  if (token !== expectedToken) {
    logSecurityEvent('INVALID_CSRF_TOKEN', {
      url: req.url,
      ip: getClientIP(req)
    }, 'HIGH');
    return false;
  }

  return true;
}

/**
 * SECURITY: Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // HTTPS enforcement
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

const securityMiddleware = {
  SecuritySchemas,
  enhancedRateLimit,
  sanitizeSQLInput,
  validateFileUpload,
  logSecurityEvent,
  validateRequest,
  validateCSRFToken,
  addSecurityHeaders,
};

export default securityMiddleware;