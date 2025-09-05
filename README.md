# 1001 Stories Platform

A non-profit global education platform for discovering, publishing, and sharing stories from children in underserved communities. All revenue is reinvested through the Seeds of Empowerment program.

## 🌍 Mission

Empower young voices and inspire the world through stories that bridge cultures, build empathy, and create educational opportunities for underserved communities.

## ✨ Core Features

- **Story Library**: Digital stories with free samples and premium subscriptions
- **Authentication**: Secure email-based magic link authentication
- **Role-Based Access**: Learner and Admin dashboards (Teacher/Institution/Volunteer planned)
- **Donation System**: Seeds of Empowerment value proposition
- **Demo Mode**: Try the platform with sample data before signing up
- **Multi-language**: Support for English and Korean (more languages planned)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Docker & Docker Compose (for production)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/SeedsofEmpowerment/1001storie_online.git
cd 1001-stories
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. **Set up database**
```bash
# Run PostgreSQL locally or use Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:14

# Run migrations
npx prisma migrate dev

# Seed demo data
npx tsx prisma/seed-demo.ts
```

5. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## 🐳 Docker Deployment

### Local Testing with Docker

```bash
# Test complete Docker setup locally
./scripts/test-docker-local.sh

# Or manually:
docker-compose up -d
```

### Production Deployment

```bash
# Deploy to AWS Lightsail (13.209.14.175)
./scripts/deploy.sh deploy

# View logs
./scripts/deploy.sh logs

# Rollback if needed
./scripts/deploy.sh rollback
```

## 📁 Project Structure

```
1001-stories/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (auth, health)
│   ├── dashboard/         # Protected dashboard pages
│   ├── demo/              # Demo experience pages
│   └── (auth)/           # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   └── email.ts          # Email configuration
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── scripts/              # Deployment and setup scripts
├── tests/                # Playwright E2E tests
└── docker-compose.yml    # Production orchestration
```

## 🔧 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/1001stories"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-32-char-secret"

# Email (Gmail example)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@1001stories.org"
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npx playwright test     # Run E2E tests
npx prisma studio       # Open database GUI
```

## 🧪 Testing

### Run Tests
```bash
# Run all Playwright tests
npx playwright test

# Run specific test
npx playwright test tests/landing-page.spec.ts

# Run with UI
npx playwright test --ui
```

### Lint Code
```bash
npm run lint
```

## 🚀 Production Server

- **URL**: http://13.209.14.175
- **Platform**: AWS Lightsail
- **OS**: Ubuntu 22.04 LTS
- **Services**: Docker Compose (nginx, PostgreSQL, Next.js app)

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- ✅ Core authentication system
- ✅ Learner and Admin dashboards
- ✅ Story library with subscriptions
- ✅ Donation system
- ✅ Demo mode

### Phase 2 (Q2 2025)
- [ ] Teacher dashboard
- [ ] Institution partnerships
- [ ] Volunteer features
- [ ] Advanced analytics
- [ ] Mobile app

### Phase 3 (Q3 2025)
- [ ] Multi-language content
- [ ] Offline support
- [ ] API for partners
- [ ] Global expansion

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript with strict typing
- Follow ESLint rules
- Use Tailwind CSS for styling
- Write Playwright tests for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Seeds of Empowerment team
- All volunteer contributors
- Partner schools and institutions
- Open source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/SeedsofEmpowerment/1001storie_online/issues)
- **Email**: info@1001stories.org
- **Documentation**: See CLAUDE.md for detailed technical documentation

## 🔒 Security

- Authentication via NextAuth.js with email magic links
- Role-based access control in middleware
- Environment variables for sensitive data
- HTTPS in production via nginx

---

**Built with ❤️ for children worldwide**

*1001 Stories - Empowering young voices, inspiring the world*