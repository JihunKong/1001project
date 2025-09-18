/**
 * Security Monitoring and Alerting System
 * Real-time detection and response to security threats
 */

import { getRedisClient } from '@/lib/redis';
import { logAuditEvent } from '@/lib/security/headers';

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  identifier: string;
  description: string;
  metadata: Record<string, any>;
  actions: string[];
  resolved: boolean;
}

export interface SecurityPattern {
  name: string;
  description: string;
  threshold: number;
  windowMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
}

// Security patterns to monitor
const SECURITY_PATTERNS: Record<string, SecurityPattern> = {
  // Class code brute force detection
  CLASS_CODE_BRUTE_FORCE: {
    name: 'Class Code Brute Force Attack',
    description: 'Multiple failed class join attempts from same source',
    threshold: 15, // 15 failed attempts
    windowMs: 60 * 60 * 1000, // 1 hour
    severity: 'high',
    actions: ['BLOCK_IP', 'ALERT_ADMIN', 'LOG_INCIDENT']
  },

  // Authentication brute force
  AUTH_BRUTE_FORCE: {
    name: 'Authentication Brute Force Attack',
    description: 'Multiple failed login attempts from same source',
    threshold: 10, // 10 failed attempts
    windowMs: 30 * 60 * 1000, // 30 minutes
    severity: 'high',
    actions: ['BLOCK_IP', 'ALERT_ADMIN']
  },

  // Rapid API calls
  API_ABUSE: {
    name: 'API Abuse Detection',
    description: 'Unusually high API request volume',
    threshold: 1000, // 1000 requests
    windowMs: 5 * 60 * 1000, // 5 minutes
    severity: 'medium',
    actions: ['RATE_LIMIT', 'LOG_INCIDENT']
  },

  // Multiple invalid class codes from different IPs
  DISTRIBUTED_CLASS_SCAN: {
    name: 'Distributed Class Code Scanning',
    description: 'Invalid class codes from multiple sources',
    threshold: 50, // 50 invalid codes
    windowMs: 60 * 60 * 1000, // 1 hour
    severity: 'critical',
    actions: ['BLOCK_ALL', 'ALERT_ADMIN', 'EMERGENCY_RESPONSE']
  },

  // Suspicious user behavior
  ACCOUNT_TAKEOVER: {
    name: 'Potential Account Takeover',
    description: 'Login from unusual location/device after failed attempts',
    threshold: 1, // Single occurrence
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    severity: 'high',
    actions: ['FORCE_LOGOUT', 'ALERT_USER', 'REQUIRE_VERIFICATION']
  }
};

class SecurityMonitor {
  private redisClient: any;
  private alerts: Map<string, SecurityAlert> = new Map();

  constructor() {
    this.redisClient = getRedisClient();
  }

  // Monitor security events and detect patterns
  async analyzeSecurityEvent(
    identifier: string,
    eventType: string,
    metadata: Record<string, any> = {}
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const now = Date.now();

    try {
      for (const [patternName, pattern] of Object.entries(SECURITY_PATTERNS)) {
        if (this.shouldCheckPattern(eventType, patternName)) {
          const eventKey = `security_pattern:${patternName}:${identifier}`;
          const count = await this.incrementEventCounter(eventKey, pattern.windowMs);

          if (count >= pattern.threshold) {
            const alert = await this.createAlert(
              patternName,
              pattern,
              identifier,
              count,
              metadata
            );
            alerts.push(alert);
            
            // Execute automated responses
            await this.executeSecurityActions(pattern.actions, identifier, metadata);
          }
        }
      }

      // Cross-pattern analysis for distributed attacks
      await this.analyzeDistributedPatterns(eventType, metadata);

    } catch (error) {
      console.error('[SECURITY_MONITOR] Error analyzing event:', error);
    }

    return alerts;
  }

  // Check if this event type should trigger pattern analysis
  private shouldCheckPattern(eventType: string, patternName: string): boolean {
    const eventPatternMap: Record<string, string[]> = {
      'CLASS_JOIN_INVALID_CODE': ['CLASS_CODE_BRUTE_FORCE', 'DISTRIBUTED_CLASS_SCAN'],
      'AUTH_FAILED': ['AUTH_BRUTE_FORCE', 'ACCOUNT_TAKEOVER'],
      'API_REQUEST': ['API_ABUSE'],
      'LOGIN_SUSPICIOUS': ['ACCOUNT_TAKEOVER']
    };

    return eventPatternMap[eventType]?.includes(patternName) || false;
  }

  // Increment event counter with Redis
  private async incrementEventCounter(key: string, windowMs: number): Promise<number> {
    if (!this.redisClient) return 0;

    try {
      const luaScript = `
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local current_time = tonumber(ARGV[2])
        
        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window)
        
        -- Add current event
        redis.call('ZADD', key, current_time, current_time)
        
        -- Set expiration
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        
        -- Return count
        return redis.call('ZCARD', key)
      `;

      const count = await this.redisClient.eval(
        luaScript,
        1,
        key,
        windowMs,
        Date.now()
      ) as number;

      return count;
    } catch (error) {
      console.error('[SECURITY_MONITOR] Redis counter error:', error);
      return 0;
    }
  }

  // Create security alert
  private async createAlert(
    patternName: string,
    pattern: SecurityPattern,
    identifier: string,
    eventCount: number,
    metadata: Record<string, any>
  ): Promise<SecurityAlert> {
    const alertId = `${patternName}_${identifier}_${Date.now()}`;
    
    const alert: SecurityAlert = {
      id: alertId,
      timestamp: new Date(),
      severity: pattern.severity,
      type: patternName,
      identifier,
      description: `${pattern.description} - ${eventCount} events detected`,
      metadata: {
        ...metadata,
        eventCount,
        threshold: pattern.threshold,
        pattern: pattern.name
      },
      actions: pattern.actions,
      resolved: false
    };

    // Store alert
    this.alerts.set(alertId, alert);
    
    // Persist to Redis for distributed alerting
    if (this.redisClient) {
      await this.redisClient.setex(
        `security_alert:${alertId}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify(alert)
      );
    }

    // Log the alert
    await logAuditEvent({
      timestamp: new Date(),
      userId: undefined,
      action: 'SECURITY_ALERT_CREATED',
      resource: 'security/monitoring',
      ip: metadata.ip || 'system',
      userAgent: metadata.userAgent || 'system',
      success: true,
      metadata: {
        alertId,
        severity: pattern.severity,
        type: patternName,
        identifier,
        eventCount
      }
    });

    console.warn(`[SECURITY_ALERT] ${pattern.severity.toUpperCase()}: ${alert.description}`, {
      alertId,
      identifier,
      eventCount,
      actions: pattern.actions
    });

    return alert;
  }

  // Execute automated security actions
  private async executeSecurityActions(
    actions: string[],
    identifier: string,
    metadata: Record<string, any>
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action) {
          case 'BLOCK_IP':
            await this.blockIP(identifier, metadata);
            break;
          case 'RATE_LIMIT':
            await this.applyEmergencyRateLimit(identifier);
            break;
          case 'ALERT_ADMIN':
            await this.alertAdministrators(identifier, metadata);
            break;
          case 'LOG_INCIDENT':
            await this.logSecurityIncident(identifier, metadata);
            break;
          case 'FORCE_LOGOUT':
            await this.forceUserLogout(identifier);
            break;
          case 'EMERGENCY_RESPONSE':
            await this.initiateEmergencyResponse(identifier, metadata);
            break;
        }
      } catch (error) {
        console.error(`[SECURITY_ACTION] Failed to execute ${action}:`, error);
      }
    }
  }

  // Analyze distributed attack patterns
  private async analyzeDistributedPatterns(
    eventType: string,
    metadata: Record<string, any>
  ): Promise<void> {
    if (eventType === 'CLASS_JOIN_INVALID_CODE') {
      // Track unique IPs attempting invalid codes
      const globalKey = 'distributed_class_scan:global';
      const ip = metadata.ip || 'unknown';
      
      if (this.redisClient) {
        await this.redisClient.sadd(globalKey, ip);
        await this.redisClient.expire(globalKey, 60 * 60); // 1 hour
        
        const uniqueIPs = await this.redisClient.scard(globalKey);
        
        // Alert if many different IPs are scanning
        if (uniqueIPs >= 20) {
          await this.createAlert(
            'DISTRIBUTED_CLASS_SCAN',
            SECURITY_PATTERNS.DISTRIBUTED_CLASS_SCAN,
            'global',
            uniqueIPs,
            { uniqueIPs, eventType }
          );
        }
      }
    }
  }

  // Security action implementations
  private async blockIP(identifier: string, metadata: Record<string, any>): Promise<void> {
    const ip = identifier.split(':')[0]; // Extract IP from identifier
    
    if (this.redisClient) {
      // Block IP for 24 hours
      await this.redisClient.setex(`blocked_ip:${ip}`, 24 * 60 * 60, JSON.stringify({
        blockedAt: new Date().toISOString(),
        reason: 'Security alert triggered',
        metadata
      }));
    }
    
    console.warn(`[SECURITY_ACTION] IP blocked: ${ip}`);
  }

  private async applyEmergencyRateLimit(identifier: string): Promise<void> {
    if (this.redisClient) {
      // Apply strict rate limit for 1 hour
      await this.redisClient.setex(
        `emergency_rate_limit:${identifier}`,
        60 * 60,
        JSON.stringify({ limit: 1, window: 60 }) // 1 request per minute
      );
    }
    
    console.warn(`[SECURITY_ACTION] Emergency rate limit applied: ${identifier}`);
  }

  private async alertAdministrators(identifier: string, metadata: Record<string, any>): Promise<void> {
    // In production, this would send emails/Slack notifications to admins
    console.error(`[SECURITY_ALERT] Administrator alert: Security incident detected for ${identifier}`, metadata);
    
    // Store admin notification in Redis for dashboard
    if (this.redisClient) {
      const notification = {
        timestamp: new Date().toISOString(),
        identifier,
        metadata,
        acknowledged: false
      };
      
      await this.redisClient.lpush('admin_security_alerts', JSON.stringify(notification));
      await this.redisClient.expire('admin_security_alerts', 7 * 24 * 60 * 60); // 7 days
    }
  }

  private async logSecurityIncident(identifier: string, metadata: Record<string, any>): Promise<void> {
    await logAuditEvent({
      timestamp: new Date(),
      userId: metadata.userId,
      action: 'SECURITY_INCIDENT_LOGGED',
      resource: 'security/incident',
      ip: metadata.ip || identifier.split(':')[0],
      userAgent: metadata.userAgent || '',
      success: true,
      metadata: {
        identifier,
        incidentType: 'automated_detection',
        ...metadata
      }
    });
  }

  private async forceUserLogout(identifier: string): Promise<void> {
    const userId = identifier.includes(':') ? identifier.split(':')[1] : identifier;
    
    if (this.redisClient && userId) {
      // Invalidate user sessions
      await this.redisClient.setex(`force_logout:${userId}`, 60 * 60, 'true');
    }
    
    console.warn(`[SECURITY_ACTION] Forced logout for user: ${userId}`);
  }

  private async initiateEmergencyResponse(identifier: string, metadata: Record<string, any>): Promise<void> {
    // Emergency response for critical threats
    console.error(`[EMERGENCY_RESPONSE] Critical security threat detected: ${identifier}`, metadata);
    
    // Multiple actions for critical threats
    await Promise.all([
      this.blockIP(identifier, metadata),
      this.alertAdministrators(identifier, metadata),
      this.logSecurityIncident(identifier, { ...metadata, emergency: true })
    ]);
  }

  // Check if IP is blocked
  async isIPBlocked(ip: string): Promise<boolean> {
    if (!this.redisClient) return false;
    
    try {
      const blocked = await this.redisClient.exists(`blocked_ip:${ip}`);
      return blocked === 1;
    } catch (error) {
      console.error('[SECURITY_MONITOR] Error checking IP block status:', error);
      return false;
    }
  }

  // Get security alerts for dashboard
  async getActiveAlerts(limit: number = 50): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys('security_alert:*');
        const recentKeys = keys.slice(0, limit);
        
        for (const key of recentKeys) {
          const alertData = await this.redisClient.get(key);
          if (alertData) {
            alerts.push(JSON.parse(alertData));
          }
        }
      } catch (error) {
        console.error('[SECURITY_MONITOR] Error fetching alerts:', error);
      }
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Global security monitor instance
const securityMonitor = new SecurityMonitor();

// Export functions for use throughout the application
export async function analyzeSecurityEvent(
  identifier: string,
  eventType: string,
  metadata: Record<string, any> = {}
): Promise<SecurityAlert[]> {
  return securityMonitor.analyzeSecurityEvent(identifier, eventType, metadata);
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  return securityMonitor.isIPBlocked(ip);
}

export async function getActiveSecurityAlerts(limit?: number): Promise<SecurityAlert[]> {
  return securityMonitor.getActiveAlerts(limit);
}

export { SECURITY_PATTERNS };
export default securityMonitor;