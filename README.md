# 1001 Stories - Global Education Platform

A non-profit digital library platform that discovers, publishes, and shares stories from children in underserved communities worldwide. All revenue is reinvested through the Seeds of Empowerment program.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.production.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📚 Features

- **Multi-Role System**: 7 distinct user roles (Learner, Teacher, Writer, Story Manager, Book Manager, Content Admin, Admin)
- **Progressive Library Access**: Teacher-controlled book assignments for students
- **Publishing Workflow**: Multi-stage content approval pipeline
- **AI-Enhanced Learning**: Content parsing, word explanations, Q&A chatbot
- **Authentication**: Secure email-based magic links + password auth

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.6, React 19, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT (image generation, TTS, AI Review)
- **Deployment**: Docker Compose on AWS EC2

## 📁 Project Structure

```
1001-stories/
├── app/                    # Next.js app router
│   ├── api/               # API routes (34 endpoints)
│   ├── dashboard/         # Role-based dashboards
│   ├── demo/              # Demo experience
│   └── (public pages)     # Landing, login, signup
├── components/            # React components
├── lib/                   # Utilities and configs
├── prisma/               # Database schema & migrations
├── public/               # Static assets
├── scripts/              # Deployment scripts
└── tests/                # Playwright E2E tests
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker (optional, recommended)

### Environment Variables

Required variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/1001stories"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Nodemailer)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@1001stories.org"

# AI Integration
OPENAI_API_KEY="your-openai-api-key"
```

### Docker Development

```bash
# Start all services
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# E2E tests
npx playwright test

# Specific test
npx playwright test tests/auth-flow.spec.ts
```

## 🚢 Deployment

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to AWS EC2
./scripts/deploy.sh deploy

# Check deployment status
./scripts/deploy.sh logs

# Rollback if needed
./scripts/deploy.sh rollback
```

### Server Info

- **URL**: https://1001stories.seedsofempowerment.org
- **IP**: 3.128.143.122
- **Platform**: AWS EC2 (Ubuntu 22.04 LTS)
- **Containers**: nginx, PostgreSQL, Redis, app

## 👥 User Roles

### Educational Roles
1. **LEARNER** - Students with teacher-assigned books and AI assistance
2. **TEACHER** - Manage classes, assign books, monitor student progress
3. **WRITER** - Submit stories for publication

### Content Management
4. **STORY_MANAGER** - Review and approve submitted stories
5. **BOOK_MANAGER** - Decide publication format (book vs text)
6. **CONTENT_ADMIN** - Final approval for publishing

### System
7. **ADMIN** - Full system administration

## 📋 Publishing Workflow

```
Writer Submission
        ↓
Story Manager Review
        ↓
Book Manager Format Decision
        ↓
Content Admin Final Approval
        ↓
Publication to Library
```

## 🗄️ Database

### Core Tables
- `User` - Authentication and profiles
- `Book` - Digital books (PDF/TXT/MD)
- `Class` - Teacher's classes
- `BookAssignment` - Teacher assigns to students
- `Submission` - Content submissions
- `AIGeneratedContent` - AI images and audio

See `prisma/schema.prisma` for full schema.

## 🔒 Security

- NextAuth.js authentication
- Role-based access control (RBAC)
- COPPA compliance for child users
- Input sanitization and validation
- Rate limiting on API endpoints
- CSP headers

## 📖 Documentation

- [Product Requirements](PRD.md)
- [Database Schema](ERD.md)
- [Infrastructure Guide](INFRASTRUCTURE.md)
- [Claude Code Instructions](CLAUDE.md)

## 🐛 Troubleshooting

### Common Issues

**Port conflicts**:
```bash
lsof -i :3000
kill -9 <PID>
```

**Database connection**:
```bash
npx prisma db push
```

**Docker issues**:
```bash
docker-compose down
docker-compose up -d --build
```

**Build errors**:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for Seeds of Empowerment non-profit
- Powered by OpenAI GPT
- Deployed on AWS EC2

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/1001-stories/issues)
- **Deployment**: `./scripts/deploy.sh logs`
- **Database GUI**: `npx prisma studio`
