#!/bin/bash

# 1001 Stories Infrastructure Fix Script
# Addresses 503 errors and container health issues

set -euo pipefail

echo "🔧 Fixing 1001 Stories Infrastructure Issues..."

# 1. Create missing nginx.conf
echo "📁 Creating missing nginx.conf..."
if [ ! -f "nginx/nginx.conf" ]; then
    cp nginx/nginx-ssl.conf nginx/nginx.conf
    echo "✅ Created nginx/nginx.conf from nginx-ssl.conf"
else
    echo "ℹ️  nginx/nginx.conf already exists"
fi

# 2. Fix nginx deprecated directives
echo "🔧 Fixing nginx deprecated directives..."
sed -i.bak 's/listen 443 ssl http2;/listen 443 ssl;\n        http2 on;/' nginx/nginx-ssl.conf
echo "✅ Fixed nginx HTTP/2 directive"

# 3. Update main docker-compose.yml health check
echo "🏥 Updating health check configuration..."
cat > docker-compose-healthcheck-fix.yml << 'EOF'
services:
  app:
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

# 4. Update SSL docker-compose.yml
echo "🔐 Fixing SSL docker-compose configuration..."
# Add env_file and network to nginx service
sed -i.bak '/^  app:$/a\
    env_file:\
      - .env.production' docker/docker-compose.ssl.yml

sed -i.bak '/^  nginx:$/,/^  [a-z]/ {
    /depends_on:/a\
    networks:\
      - app-network
}' docker/docker-compose.ssl.yml

# 5. Create deployment verification script
cat > verify-deployment.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying deployment health..."

# Check container health
echo "📊 Container Status:"
docker compose -f docker/docker-compose.ssl.yml ps

# Test endpoints
echo "🌐 Testing endpoints:"
curl -I http://localhost/health || echo "❌ HTTP health check failed"
curl -I -k https://localhost/ || echo "❌ HTTPS check failed"

# Check app container health
echo "🏥 App container health:"
docker inspect 1001-stories-app --format='{{.State.Health.Status}}'

# Check logs for errors
echo "📋 Recent errors:"
docker compose -f docker/docker-compose.ssl.yml logs --tail=20 app | grep -i error || echo "No recent errors"
EOF

chmod +x verify-deployment.sh

echo "✅ Infrastructure fixes completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Test locally: docker-compose -f docker-compose.local.yml up -d"
echo "2. Deploy to server: ./scripts/deploy.sh deploy"
echo "3. Verify deployment: ssh ubuntu@3.128.143.122 'cd /home/ubuntu/1001project && ./verify-deployment.sh'"
echo ""
echo "📊 Key files updated:"
echo "- nginx/nginx.conf (created)"
echo "- nginx/nginx-ssl.conf (fixed HTTP/2 directive)"
echo "- docker/docker-compose.ssl.yml (added env_file and network)"
echo "- docker-compose-healthcheck-fix.yml (health check template)"
echo "- verify-deployment.sh (verification script)"