# 1001 Stories Platform

A global education and empowerment platform for discovering, publishing, and sharing stories from children in underserved communities.

## 🌍 Features

- **Multi-language Support**: English (default), Korean, Spanish, French, Chinese
- **Role-based Dashboards**: Learner, Teacher, Institution, Volunteer, Admin
- **Digital Library**: E-book reader with annotations and bookmarks
- **Volunteer Hub**: Project matching and certificate generation
- **Story Publishing Workflow**: Kanban board for content management
- **Seeds of Empowerment**: Donation and sponsorship system

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/JihunKong/1001project.git
cd 1001project
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run development server:
```bash
npm run dev
```

Visit http://localhost:3000

## 🐳 Docker Deployment

### Build and Run with Docker

1. Build the Docker image:
```bash
docker build -t 1001-stories:latest .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Test Docker Setup

```bash
./scripts/test-docker-local.sh all
```

## 🚀 Production Deployment

### Server Setup (First Time)

1. SSH to your server:
```bash
ssh -i your-key.pem ubuntu@43.202.3.58
```

2. Run setup script:
```bash
curl -o setup-server.sh https://raw.githubusercontent.com/JihunKong/1001project/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### Deploy Updates

From your local machine:
```bash
./scripts/deploy.sh
```

### Rollback if Needed

```bash
./scripts/deploy.sh rollback
```

## 📁 Project Structure

```
1001-stories/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── providers/        # Context providers
├── lib/                   # Utilities
├── locales/              # Translation files
├── nginx/                # Nginx configuration
├── scripts/              # Deployment scripts
├── types/                # TypeScript types
├── docker-compose.yml    # Docker orchestration
└── Dockerfile            # Docker image
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### SSL Certificate

For production, setup SSL with Certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Seeds of Empowerment team
- All volunteer contributors
- Partner schools and institutions

## 📞 Contact

- Website: https://1001stories.org
- Email: info@1001stories.org

---

Built with ❤️ for children worldwide