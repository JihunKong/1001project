# 🎓 English Education Platform - Test Environment Documentation

## ⚠️ CRITICAL SECURITY NOTICE

**IMMEDIATE ACTION REQUIRED**: The OpenAI API key that was exposed (`sk-proj-yn6MLCMtsjLinJ7bPXjflVauwYOYcnlNi8...`) must be:
1. **Revoked immediately** at https://platform.openai.com/api-keys
2. **Replaced with a new key** in `.env.test-edu`
3. **Never shared in messages or commits**

## 📋 Overview

This test environment provides a complete, isolated testing setup for the English Education platform within the 1001 Stories nonprofit system. It runs on **port 3001** to avoid conflicts with the main application on port 3000.

### Key Features
- ✅ Password-based authentication (no magic link required)
- ✅ Pre-configured test accounts (teacher & students)
- ✅ Isolated test database
- ✅ OpenAI integration for AI features
- ✅ Docker containerization
- ✅ Quick login UI panel
- ✅ Complete English Education features

## 🚀 Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- Port 3001 available
- New OpenAI API key (after revoking exposed one)

### 2. Configure OpenAI Key
```bash
# Edit the environment file
nano .env.test-edu

# Replace the placeholder with your new key:
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

### 3. Start Test Environment
```bash
# Make script executable (first time only)
chmod +x scripts/start-test-edu.sh

# Start the test environment
./scripts/start-test-edu.sh

# The script will:
# - Build Docker images
# - Start containers
# - Run database migrations
# - Seed test data
# - Open browser automatically
```

## 👤 Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Teacher** | teacher@test.edu | Test123! | Create classes, manage assignments, view analytics |
| **Student 1** | student1@test.edu | Student123! | Read stories, complete assignments, use AI tutor |
| **Student 2** | student2@test.edu | Student123! | Second student for testing peer features |

### Test Class Information
- **Class Code**: TEST-EDU-001
- **Class Name**: Test English Class - Grade 10
- **Pre-loaded Materials**: 3 sample stories with adaptations

## 🎯 Accessing the Test Environment

### URLs
- **Main Application**: http://localhost:3001
- **Test Login Page**: http://localhost:3001/test-login
- **Student Dashboard**: http://localhost:3001/programs/english-education/student
- **Teacher Dashboard**: http://localhost:3001/programs/english-education/teacher

### Quick Login Panel
When test mode is active, a floating panel appears on the right side of the screen:
- Yellow warning banner at the top
- One-click login buttons for each test account
- Credentials display for reference

## 🛠️ Technical Details

### Docker Configuration
```yaml
# docker-compose.test-edu.yml
services:
  app-test:     # Port 3001
  postgres-test: # Port 5433
  redis-test:   # Port 6380
```

### Environment Variables
Key test mode variables in `.env.test-edu`:
```env
TEST_MODE_ENABLED=true       # Enables test features
ALLOW_PASSWORD_LOGIN=true    # Enables password auth
PORT=3001                    # Different from main app
DATABASE_URL=...test_db      # Isolated database
```

### File Structure
```
1001-stories/
├── docker-compose.test-edu.yml    # Docker configuration
├── .env.test-edu                   # Test environment variables
├── lib/
│   └── auth-test.ts               # Test authentication logic
├── prisma/
│   └── seed-test-edu.ts           # Test data seeding
├── components/
│   └── TestLoginPanel.tsx         # Quick login UI
├── app/
│   └── test-login/
│       └── page.tsx               # Test login page
└── scripts/
    └── start-test-edu.sh          # Startup script
```

## 📚 Testing the English Education Features

### For Students
1. **Login** as student1@test.edu
2. **Browse** available stories in the dashboard
3. **Read** a story with adaptive text (change age level)
4. **Use** the AI tutor chat for vocabulary help
5. **Listen** to TTS narration
6. **Track** reading progress

### For Teachers
1. **Login** as teacher@test.edu
2. **View** class dashboard and enrolled students
3. **Create** assignments for reading materials
4. **Monitor** student progress and analytics
5. **Manage** class settings

### AI Features to Test
- **Text Adaptation**: Stories adapt to 6 age levels (6-16 years)
- **AI Tutor**: Ask questions about vocabulary and comprehension
- **TTS**: High-quality voice synthesis for all texts
- **Vocabulary**: Click words for instant definitions

## 🔧 Common Commands

### Start/Stop Environment
```bash
# Start test environment
./scripts/start-test-edu.sh start

# Stop test environment
./scripts/start-test-edu.sh stop

# Restart environment
./scripts/start-test-edu.sh restart

# Clean everything (including data)
./scripts/start-test-edu.sh clean
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.test-edu.yml logs -f

# Specific service
docker logs 1001-stories-edu-test -f
```

### Database Access
```bash
# Connect to test database
docker exec -it 1001-stories-test-db psql -U test_user -d stories_test_db

# View tables
\dt

# View users
SELECT email, role FROM "User";
```

### Reset Test Data
```bash
# Re-run seed script
docker exec 1001-stories-edu-test npx tsx prisma/seed-test-edu.ts
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.test-edu.yml logs app-test

# Rebuild image
docker-compose -f docker-compose.test-edu.yml build --no-cache
```

### Database Connection Issues
```bash
# Check if database is running
docker ps | grep test-db

# Test connection
docker exec 1001-stories-test-db pg_isready
```

### OpenAI API Not Working
1. Verify API key in `.env.test-edu`
2. Check OpenAI dashboard for usage/limits
3. View logs for API errors

## 🔒 Security Considerations

### ⚠️ Test Mode Warnings
- **Visual Indicators**: Yellow banner, test mode badges
- **Console Warnings**: Logged on every auth attempt
- **Environment Check**: Only works with TEST_MODE_ENABLED=true
- **Isolated Database**: Completely separate from production

### 🚫 Never Do This
- Use test credentials in production
- Expose API keys in code or messages
- Deploy with TEST_MODE_ENABLED=true
- Share test environment publicly
- Use weak passwords in production

## 📈 Performance Considerations

### Resource Usage
- **Memory**: ~2GB recommended
- **CPU**: 2+ cores recommended
- **Disk**: ~1GB for containers and data

### Optimization Tips
- Use Redis cache for adaptations
- Limit concurrent AI requests
- Monitor container resources
- Clean up old logs regularly

## 🎉 Summary

The test environment provides a complete, safe playground for testing the English Education platform:

✅ **Isolated** - Separate database, ports, and configuration
✅ **Convenient** - Password login and quick access buttons
✅ **Complete** - All education features fully functional
✅ **Safe** - Clear warnings and production safeguards
✅ **Documented** - Comprehensive guides and examples

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker logs for errors
3. Ensure all prerequisites are met
4. Verify environment variables are correct

## 🚨 Final Reminders

1. **Replace the OpenAI API key** immediately
2. **Never use test mode in production**
3. **Keep test credentials secure**
4. **Monitor resource usage**
5. **Clean up when done testing**

---

*Last Updated: 2025-09-05*
*Version: 1.0.0*
*For: English Education Platform Testing Only*