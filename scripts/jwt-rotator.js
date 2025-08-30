#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

class JWTRotator {
  constructor() {
    this.rotationInterval = 6 * 60 * 60 * 1000; // 6 hours
  }

  async rotateTokens() {
    console.log(`[${new Date().toISOString()}] Starting JWT token rotation...`);
    
    try {
      // Increment token version for privileged users to invalidate existing tokens
      const result = await prisma.$executeRaw`
        UPDATE "User" 
        SET "tokenVersion" = "tokenVersion" + 1,
            "updatedAt" = NOW()
        WHERE "role" IN ('ADMIN', 'VOLUNTEER')
      `;
      
      console.log(`[${new Date().toISOString()}] Updated token versions for privileged users`);
      
      // Clean up expired sessions (older than 30 days)
      const expiryDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      const deletedSessions = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: expiryDate
          }
        }
      });
      
      console.log(`[${new Date().toISOString()}] Cleaned up ${deletedSessions.count} expired sessions`);
      
      // Clean up expired accounts (unverified accounts older than 7 days)
      const unverifiedExpiryDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      const deletedUnverifiedAccounts = await prisma.user.deleteMany({
        where: {
          emailVerified: null,
          createdAt: {
            lt: unverifiedExpiryDate
          },
          role: 'CUSTOMER' // Only delete unverified customer accounts
        }
      });
      
      console.log(`[${new Date().toISOString()}] Cleaned up ${deletedUnverifiedAccounts.count} unverified accounts`);
      
      // Generate new JWT secret if rotation is enabled (optional - requires app restart)
      if (process.env.ROTATE_JWT_SECRET === 'true') {
        const newSecret = crypto.randomBytes(32).toString('hex');
        console.log(`[${new Date().toISOString()}] New JWT secret generated (requires app restart to take effect)`);
        
        // In production, you'd store this in a secure location or trigger deployment
        // For now, we'll just log it for manual update
        console.log('Note: Update NEXTAUTH_SECRET environment variable and restart app');
      }
      
      console.log(`[${new Date().toISOString()}] JWT token rotation completed successfully`);
      
      // Send notification to monitoring system
      await this.notifyMonitoring('jwt_rotation_success', {
        privilegedUsersUpdated: result,
        expiredSessionsDeleted: deletedSessions.count,
        unverifiedAccountsDeleted: deletedUnverifiedAccounts.count
      });
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] JWT rotation failed:`, error);
      await this.notifyMonitoring('jwt_rotation_failure', error.message);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  async notifyMonitoring(event, details = '') {
    // Integration with monitoring system
    const webhook = process.env.MONITORING_WEBHOOK;
    if (webhook) {
      try {
        const response = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            details,
            service: '1001-stories-jwt-rotator',
            severity: event.includes('failure') ? 'error' : 'info'
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to send monitoring notification:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to send monitoring notification:', error);
      }
    }
  }
  
  // Graceful shutdown handler
  async shutdown() {
    console.log(`[${new Date().toISOString()}] Shutting down JWT rotator...`);
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Main execution
const rotator = new JWTRotator();

// Handle graceful shutdown
process.on('SIGTERM', () => rotator.shutdown());
process.on('SIGINT', () => rotator.shutdown());

// Execute rotation
rotator.rotateTokens()
  .then(() => {
    console.log(`[${new Date().toISOString()}] JWT rotation task completed`);
    // PM2 will restart based on cron schedule
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] JWT rotation task failed:`, error);
    process.exit(1);
  });