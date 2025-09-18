#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class HealthMonitor {
  constructor() {
    this.checkInterval = 30000; // 30 seconds
    this.services = [
      { name: 'app', url: 'http://localhost:3000/api/health', critical: true },
      { name: 'nginx-internal', url: 'http://localhost/health', critical: true },
      { name: 'nginx-external', url: 'https://1001stories.seedsofempowerment.org/health', critical: false },
      { name: 'postgres', command: 'pg_isready -h postgres -U stories_user', critical: true }
    ];
    this.failureThreshold = 3;
    this.failureCounts = {};
    this.lastHealthReport = {};
  }

  async checkHttpService(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode === 200) {
          resolve({ status: 'healthy', statusCode: res.statusCode });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async checkService(service) {
    try {
      if (service.url) {
        return await this.checkHttpService(service.url);
      } else if (service.command) {
        await execAsync(service.command);
        return { status: 'healthy' };
      }
    } catch (error) {
      throw error;
    }
  }

  async performHealthChecks() {
    const results = [];
    const timestamp = new Date().toISOString();
    
    for (const service of this.services) {
      try {
        const result = await this.checkService(service);
        
        // Reset failure count on success
        this.failureCounts[service.name] = 0;
        
        results.push({
          service: service.name,
          status: 'healthy',
          timestamp,
          ...result
        });
        
        console.log(`[${timestamp}] ✓ ${service.name} is healthy`);
        
      } catch (error) {
        // Increment failure count
        this.failureCounts[service.name] = (this.failureCounts[service.name] || 0) + 1;
        
        results.push({
          service: service.name,
          status: 'unhealthy',
          error: error.message,
          failureCount: this.failureCounts[service.name],
          timestamp,
        });
        
        console.error(`[${timestamp}] ✗ ${service.name} is unhealthy: ${error.message} (failure count: ${this.failureCounts[service.name]})`);
        
        // Take action if threshold exceeded
        if (service.critical && this.failureCounts[service.name] >= this.failureThreshold) {
          await this.handleCriticalFailure(service);
        }
      }
    }
    
    // Generate health summary
    const healthySevices = results.filter(r => r.status === 'healthy').length;
    const totalServices = results.length;
    const overallHealth = healthySevices === totalServices ? 'healthy' : 'degraded';
    
    // Store results for monitoring dashboard
    await this.storeHealthMetrics(results, overallHealth);
    
    // Report to monitoring if status changed
    await this.reportStatusChange(overallHealth, results);
    
    return results;
  }

  async handleCriticalFailure(service) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] CRITICAL: ${service.name} has failed ${this.failureCounts[service.name]} times consecutively`);
    
    // Attempt recovery based on service type
    try {
      if (service.name === 'app') {
        console.log(`[${timestamp}] Attempting to restart application...`);
        await execAsync('pm2 restart 1001-stories-app');
        console.log(`[${timestamp}] Application restart initiated`);
      } else if (service.name === 'nginx-internal') {
        console.log(`[${timestamp}] Attempting to reload nginx...`);
        await execAsync('docker exec 1001-stories-nginx nginx -s reload');
        console.log(`[${timestamp}] Nginx reload initiated`);
      }
    } catch (error) {
      console.error(`[${timestamp}] Failed to recover ${service.name}:`, error.message);
    }
    
    // Send critical alert
    await this.sendAlert({
      severity: 'critical',
      service: service.name,
      message: `Service ${service.name} has exceeded failure threshold`,
      failureCount: this.failureCounts[service.name],
      timestamp,
      action: 'Recovery attempt initiated'
    });
  }

  async storeHealthMetrics(results, overallHealth) {
    // Store metrics for Prometheus/Grafana or other monitoring systems
    const metrics = {
      timestamp: new Date().toISOString(),
      overallHealth,
      services: results.reduce((acc, result) => {
        acc[result.service] = {
          status: result.status,
          failureCount: this.failureCounts[result.service] || 0
        };
        return acc;
      }, {}),
      healthyServices: results.filter(r => r.status === 'healthy').length,
      totalServices: results.length
    };
    
    // Log metrics in structured format for collection
    console.log(`[METRICS] ${JSON.stringify(metrics)}`);
    
    // Store in cache for API endpoint
    this.lastHealthReport = metrics;
  }

  async reportStatusChange(currentStatus, results) {
    const previousStatus = this.lastOverallHealth;
    this.lastOverallHealth = currentStatus;
    
    if (previousStatus && previousStatus !== currentStatus) {
      console.log(`[${new Date().toISOString()}] Overall health status changed: ${previousStatus} -> ${currentStatus}`);
      
      await this.sendAlert({
        severity: currentStatus === 'healthy' ? 'info' : 'warning',
        message: `System health status changed from ${previousStatus} to ${currentStatus}`,
        details: results.filter(r => r.status === 'unhealthy').map(r => `${r.service}: ${r.error}`),
        timestamp: new Date().toISOString()
      });
    }
  }

  async sendAlert(alert) {
    // Integration with alerting system
    const webhook = process.env.MONITORING_WEBHOOK || process.env.ALERT_WEBHOOK;
    if (webhook) {
      try {
        const response = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...alert,
            service: '1001-stories-health-monitor'
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to send alert:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
    
    // Also log locally for immediate visibility
    console.log(`[ALERT] ${JSON.stringify(alert)}`);
  }

  // API endpoint for health status
  createHealthAPI() {
    const server = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.lastHealthReport || { status: 'starting' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });
    
    server.listen(9090, () => {
      console.log(`[${new Date().toISOString()}] Health monitor API listening on port 9090`);
    });
  }

  start() {
    console.log(`[${new Date().toISOString()}] Health monitor started - checking every ${this.checkInterval/1000}s`);
    
    // Start health API
    this.createHealthAPI();
    
    // Initial check
    this.performHealthChecks();
    
    // Schedule periodic checks
    setInterval(() => {
      this.performHealthChecks().catch(error => {
        console.error(`[${new Date().toISOString()}] Health check failed:`, error);
      });
    }, this.checkInterval);
  }

  // Graceful shutdown
  async shutdown() {
    console.log(`[${new Date().toISOString()}] Health monitor shutting down...`);
    
    await this.sendAlert({
      severity: 'info',
      message: 'Health monitor is shutting down',
      timestamp: new Date().toISOString()
    });
    
    process.exit(0);
  }
}

// Start monitoring
const monitor = new HealthMonitor();
monitor.start();

// Graceful shutdown handlers
process.on('SIGTERM', () => monitor.shutdown());
process.on('SIGINT', () => monitor.shutdown());

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception in health monitor:`, error);
  monitor.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection in health monitor:`, reason);
});