module.exports = {
  apps: [
    {
      name: '1001-stories-app',
      script: 'server.js',
      instances: process.env.PM2_INSTANCES || 'max', // Use all CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Graceful shutdown
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 5000,
      
      // Health check and auto-restart
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      error_file: '/app/logs/pm2-error.log',
      out_file: '/app/logs/pm2-out.log',
      merge_logs: true,
      time: true,
      
      // Zero-downtime reload
      reload_delay: 1000,
      
      // Performance monitoring
      pmx: true,
      instance_var: 'INSTANCE_ID',
      
      // Auto-scaling for load balancing
      merge_logs: true,
    },
    {
      name: 'jwt-rotator',
      script: '/app/scripts/jwt-rotator.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // Every 6 hours
      autorestart: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ssl-renewer',
      script: '/app/scripts/ssl-renewer.sh',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 2 * * 0', // Weekly at 2 AM Sunday
      autorestart: false,
      interpreter: '/bin/bash',
    },
    {
      name: 'health-monitor',
      script: '/app/scripts/health-monitor.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: '3.128.143.122',
      ref: 'origin/main',
      repo: 'https://github.com/JihunKong/1001project.git',
      path: '/home/ubuntu/1001-stories',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Starting deployment..."',
    }
  }
};