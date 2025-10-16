# Disk Optimization & Deployment Strategy

## Current Situation Analysis (2025-10-10)

### Infrastructure Constraints
- **Server**: AWS Lightsail, 29GB total disk
- **Current Usage**: 18GB/29GB (62%)
- **Docker Build Requirements**: ~18-20GB temporary space
- **Problem**: Insufficient disk space prevents Docker image builds

### Disk Usage Breakdown
```
Total: 29GB
Used: 18GB (62%)
Free: 11GB

Docker Components:
- Images: 2.75GB (6 images, 2.19GB reclaimable)
- Containers: 7.5MB (6 containers)
- Volumes: 119MB
- Build Cache: 8.70GB (!!)
```

## Immediate Actions Taken

### 1. Site Recovery
✅ Restarted old container (image 19705e5e75ed from 4 days ago)
- Container ID: 53ad64f17668
- Status: Running and healthy
- Network: 1001-stories_app-network
- **Note**: Running OLD code without latest fixes

### 2. Code Fixes Completed (Not Yet Deployed)
✅ Fixed files in `/home/ubuntu/1001-stories`:
- `app/api/text-submissions/route.ts` - Added enum validation for status parameter
- `app/dashboard/story-manager/page.tsx` - Enhanced error logging
- `lib/ai/openai.ts` - Kept gpt-5-mini model as specified

## Disk Optimization Recommendations

### Phase 1: Immediate Cleanup (Server)

#### Test Artifacts Cleanup
```bash
# Remove old test results and reports
cd /home/ubuntu/1001-stories
rm -rf playwright-report test-results screenshots/*.png

# Expected savings: ~9MB
```

#### Docker Build Cache Management
```bash
# Clean build cache (currently 8.70GB!)
docker builder prune -af

# Remove dangling images
docker image prune -a

# Expected savings: ~6-8GB
```

#### Old Backup Files
```bash
# Review and archive these if not needed:
cd /home/ubuntu/1001-stories
ls -lh essential-files.tar.gz backups/

# Move to external storage or delete
```

### Phase 2: Local Development Optimization

#### 1. Monorepo Structure for Shared Dependencies
**Problem**: Duplicate node_modules consuming ~800MB × 2 projects

**Solution**: Convert to pnpm workspace
```bash
# In root /Users/jihunkong/1001project/
npm install -g pnpm

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml <<EOF
packages:
  - '1001-stories'
  - 'other-next-project'  # if exists
EOF

# Convert each project
cd 1001-stories
pnpm import  # converts package-lock.json
rm -rf node_modules package-lock.json
pnpm install

# Expected savings: 400-600MB locally
```

#### 2. Asset Management Strategy
**Problem**: Large files in public/ and books/ directories

**Solution 1 - AWS S3 Migration** (Recommended)
```bash
# Move static assets to S3
aws s3 sync public/books/ s3://1001-stories-assets/books/ \\
  --exclude "*.md" --exclude "*.json"

# Update code to use S3 URLs
# Set USE_S3_STORAGE=true in .env
```

**Solution 2 - Git LFS** (Alternative)
```bash
git lfs install
git lfs track "*.pdf" "*.mp4" "*.jpg" "*.png"
git add .gitattributes
git lfs push --all origin
```

#### 3. Automated Cleanup Scripts
Create `/scripts/cleanup-dev.sh`:
```bash
#!/bin/bash
echo "Cleaning development artifacts..."

# Remove test outputs
find . -name "playwright-report" -type d -exec rm -rf {} + 2>/dev/null
find . -name "test-results" -type d -exec rm -rf {} + 2>/dev/null
find . -name "screenshots" -type d -exec rm -rf {} + 2>/dev/null

# Clean old build artifacts
rm -rf .next/cache/*
rm -f tsconfig.tsbuildinfo

# Docker cleanup
docker system prune -f

echo "Cleanup complete!"
```

### Phase 3: Deployment Strategy

#### Option A: Expand Server Disk (Best Solution)
```bash
# In AWS Lightsail Console:
1. Stop instance
2. Create snapshot
3. Increase disk size: 29GB → 50GB
4. Restart instance
5. Resize filesystem:
   sudo resize2fs /dev/xvda1
```

**Cost**: ~$5-10/month additional
**Benefits**: Solves problem permanently

#### Option B: External Docker Build (Temporary)
```bash
# Build locally on development machine
docker build -t jihunkong/1001-stories-app:$(date +%Y%m%d) .

# Push to Docker Hub
docker push jihunkong/1001-stories-app:$(date +%Y%m%d)

# On server: Pull and restart
ssh ubuntu@3.128.143.122 \\
  "docker pull jihunkong/1001-stories-app:$(date +%Y%m%d) && \\
   docker tag jihunkong/1001-stories-app:$(date +%Y%m%d) 1001-stories-app:latest && \\
   docker compose up -d app"
```

#### Option C: Non-Docker Deployment (Emergency)
```bash
# On server:
cd /home/ubuntu/1001-stories
npm run build
pm2 start npm --name "1001-stories" -- start
pm2 save
```

**Drawbacks**: Loses Docker security benefits (read-only filesystem, resource limits)

## Long-Term Optimization Strategy

### 1. Multi-Stage Docker Build Optimization
Current Dockerfile has good multi-stage setup. To optimize further:

```dockerfile
# Add --no-install-recommends to apt
# Use .dockerignore extensively
# Minimize RUN layers
```

### 2. CI/CD Pipeline Setup
```yaml
# .github/workflows/deploy.yml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t \${{ secrets.DOCKER_HUB_USERNAME }}/1001-stories-app:\${{ github.sha }} .
      - name: Push to Docker Hub
        run: docker push \${{ secrets.DOCKER_HUB_USERNAME }}/1001-stories-app:\${{ github.sha }}
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: \${{ secrets.SERVER_HOST }}
          username: ubuntu
          key: \${{ secrets.SSH_KEY }}
          script: |
            docker pull \${{ secrets.DOCKER_HUB_USERNAME }}/1001-stories-app:\${{ github.sha }}
            cd /home/ubuntu/1001-stories
            docker compose pull
            docker compose up -d
```

### 3. Regular Maintenance Schedule
```bash
# Add to crontab:
# Clean Docker cache weekly
0 2 * * 0 docker system prune -af > /dev/null 2>&1

# Clean test artifacts daily
0 3 * * * find /home/ubuntu -name "test-results" -mtime +7 -exec rm -rf {} + 2>/dev/null
```

## Immediate Next Steps

1. **Expand server disk to 50GB** (User action required)
   - OR - Choose Option B (External build) for immediate deployment

2. **Clean up Docker build cache**
   ```bash
   ssh ubuntu@3.128.143.122 "docker builder prune -af && docker system prune -af"
   ```

3. **Deploy fixed code** (after disk expansion)
   ```bash
   cd /home/ubuntu/1001-stories
   docker compose build app
   docker compose up -d app
   ```

4. **Verify fixes**
   - Test STORY_MANAGER dashboard
   - Run complete 5-step workflow test
   - Check production logs for Prisma errors

## Monitoring & Alerts

### Disk Space Monitoring
```bash
# Add to crontab:
*/30 * * * * df -h / | awk 'NR==2 {if ($5+0 > 80) print "ALERT: Disk usage " $5}' | mail -s "Disk Alert" admin@example.com
```

### Docker Resource Limits
Already configured in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
```

## Cost-Benefit Analysis

| Solution | Cost | Time | Risk | Benefit |
|----------|------|------|------|---------|
| Expand Disk | $5-10/mo | 30 min | Low | Permanent fix |
| External Build | Free | 15 min | Low | Temporary |
| Non-Docker | Free | 10 min | High | Emergency only |
| Monorepo | Free | 2 hours | Low | Local savings |
| S3 Assets | $1-5/mo | 4 hours | Medium | Scalable |

## Conclusion

**Recommended Path**:
1. Immediately: Clean Docker cache (free 6-8GB)
2. Short-term: Use external build to deploy fixes
3. Long-term: Expand disk to 50GB for sustainable operations

**Current Status**: Site is online with old code. Fixes are ready but require deployment via one of the above methods.
