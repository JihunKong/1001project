# 1001 Stories Educational Platform - Feature Documentation

## Overview
The 1001 Stories platform has been transformed into a comprehensive educational system with advanced role-based access control, teacher-student matching, publishing workflows, and AI-powered learning features.

## 1. User Roles & Permissions

### 7 Distinct User Roles
1. **LEARNER** - Students who can only access assigned books
2. **TEACHER** - Educators who manage classes and assign books
3. **VOLUNTEER** - Content creators who submit stories
4. **STORY_MANAGER** - Reviews story content and narrative
5. **BOOK_MANAGER** - Handles formatting and book production
6. **CONTENT_ADMIN** - Final approval and publishing decisions
7. **ADMIN** - Full system administration

### Permission Matrix
- Over 50 granular permissions defined in `/lib/permissions.ts`
- Database-level access control for security
- Role-based UI components and API access

## 2. Teacher-Student Matching System

### Class Management
- **6-Character Unique Codes**: Cryptographically secure class codes (e.g., ABC-123)
- **Class Creation**: Teachers create classes with subject, grade level, and capacity
- **Student Enrollment**: Students join using class codes
- **Active Status Tracking**: Monitor enrollment and class activity

### API Endpoints
- `POST /api/classes/create` - Create new class
- `POST /api/classes/join` - Student joins class
- `GET /api/classes` - List classes (filtered by role)

## 3. Book Assignment & Access Control

### CRITICAL SECURITY FEATURE
Students can ONLY access books explicitly assigned by their teachers.

### Assignment System
- Individual student assignments
- Class-wide assignments
- Due dates and instructions
- Required vs optional readings

### Database-Level Filtering
```typescript
// Students ONLY see assigned books
const whereClause = {
  assignments: {
    some: {
      OR: [
        { studentId: userId },
        { class: { enrollments: { some: { studentId: userId }}}}
      ]
    }
  }
}
```

### API Endpoints
- `POST /api/books/assign` - Teacher assigns books
- `GET /api/books/assigned` - Get assigned books (role-filtered)

## 4. Publishing Workflow State Machine

### 8-Stage Approval Process
1. **DRAFT** - Initial creation by volunteer
2. **IN_REVIEW** - Story manager reviews content
3. **REVISION_REQUESTED** - Changes needed
4. **STORY_APPROVED** - Content approved
5. **FORMAT_REVIEW** - Book manager reviews formatting
6. **FINAL_REVIEW** - Content admin final check
7. **PUBLISHED** - Available to users
8. **REJECTED** - Not suitable for publication

### Workflow Features
- Role-specific transitions
- Required comments for rejections
- Automatic notifications
- Deadline tracking
- Review queue system

### API Endpoints
- `POST /api/books/workflow` - Transition book status
- `GET /api/review-queue` - Get review queue by role

## 5. AI Integration

### Upstage Integration
- **PDF Parsing**: Extract text from uploaded PDFs
- **Content Chat**: Educational chatbot for book discussions
- **Reading Level Analysis**: Automatic grade level detection

### OpenAI GPT Integration
- **Image Generation**: DALL-E 3 for story illustrations
- **TTS**: Text-to-speech (error-only implementation)
- **Vocabulary Explanations**: Age-appropriate word definitions
- **Illustration Prompts**: AI-suggested illustration ideas

### CRITICAL TTS REQUIREMENT
TTS always returns error: "Sound generation failed"
Never implement browser audio callbacks.

### API Endpoints
- `POST /api/ai/generate-image` - Generate story illustrations
- `POST /api/ai/tts` - Text-to-speech (returns error)

## 6. Vocabulary Bank System

### Features
- Double-click word selection in reader
- AI-powered explanations
- Difficulty tracking (EASY/MEDIUM/HARD)
- Mastery status
- Context preservation

### Data Structure
```typescript
VocabularyBank {
  word: string
  context: string
  definition: string
  examples: string[]
  mastered: boolean
  difficulty: enum
  reviewCount: number
}
```

### API Endpoints
- `POST /api/vocabulary` - Add word to bank
- `GET /api/vocabulary` - Get user's vocabulary
- `PATCH /api/vocabulary` - Update mastery status

## 7. Book Club System

### Club Features
- Teacher or student created clubs
- Public or private with join codes
- Maximum member limits
- Discussion threads
- Chapter-specific discussions

### Discussion System
- Threaded replies
- Like/reaction system
- Pin important discussions
- Real-time notifications

### API Endpoints
- `POST /api/book-clubs` - Create or join club
- `POST /api/book-clubs/discussions` - Create discussion or reply
- `GET /api/book-clubs/discussions` - Get discussions

## 8. Infrastructure Updates

### Redis Caching
- Session management
- Assigned books caching
- Review queue optimization
- AI response caching
- Vocabulary bank caching

### Cache Keys
```typescript
CacheKeys = {
  USER_SESSION: (userId) => `session:${userId}`,
  BOOK_DATA: (bookId) => `book:${bookId}`,
  ASSIGNED_BOOKS: (userId) => `assigned:${userId}`,
  REVIEW_QUEUE: (role) => `queue:${role}`,
  // ... more keys
}
```

### Docker Compose Updates
- Added Redis service with persistence
- Environment variables for Redis connection
- Health checks for all services
- Service dependencies

## 9. Security Measures

### Access Control
- Database-level filtering (not application-level)
- JWT token validation
- Permission-based API access
- Activity logging for audit trails

### Data Protection
- Encrypted passwords (bcrypt)
- Secure class codes (crypto.randomInt)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma ORM)

## 10. Testing Suite

### Comprehensive E2E Tests
- Teacher class management
- Student book access restrictions
- Publishing workflow transitions
- Vocabulary bank functionality
- Book club features
- AI integration tests
- Role-based permission tests
- Performance/caching tests
- Security vulnerability tests

### Test Files
- `/tests/education-features.spec.ts` - Main feature tests

## Environment Variables

### Required for Educational Features
```env
# AI Services
OPENAI_API_KEY=your-openai-key
UPSTAGE_API_KEY=your-upstage-key
UPSTAGE_BASE_URL=https://api.upstage.ai/v1

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_password_123

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_BOOK_CLUBS=true
ENABLE_VOCABULARY=true
```

## Database Schema Updates

### New Models
- `BookAssignment` - Teacher book assignments
- `Class` - Educational classes
- `ClassEnrollment` - Student enrollments
- `WorkflowTransition` - Publishing state changes
- `AIGeneratedContent` - AI-generated assets
- `VocabularyBank` - Student vocabulary
- `BookClub` - Reading clubs
- `BookClubMember` - Club membership
- `BookClubDiscussion` - Discussion threads
- `DiscussionReply` - Thread replies
- `Notification` - System notifications
- `ActivityLog` - Audit trail

## API Summary

### Core Educational APIs
- `/api/classes/*` - Class management
- `/api/books/assign` - Book assignments
- `/api/books/assigned` - Assigned books access
- `/api/books/workflow` - Publishing workflow
- `/api/review-queue` - Content review
- `/api/vocabulary` - Vocabulary bank
- `/api/book-clubs/*` - Book clubs
- `/api/ai/*` - AI services

## Deployment Notes

### Docker Deployment
```bash
# Build and deploy with Redis
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f app redis
```

### Production Checklist
- [ ] Set strong Redis password
- [ ] Configure AI API keys
- [ ] Enable SSL/TLS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test all role permissions
- [ ] Verify student access restrictions

## Future Enhancements

### Planned Features
- WebSocket for real-time discussions
- Advanced analytics dashboard
- Mobile app support
- Offline reading mode
- Multi-language support
- Parent portal
- Progress tracking
- Gamification elements

## Support & Maintenance

### Key Files
- `/lib/permissions.ts` - Permission definitions
- `/lib/workflow.ts` - Publishing state machine
- `/lib/ai-service.ts` - AI integrations
- `/lib/redis.ts` - Cache management
- `/app/api/*` - API endpoints
- `/prisma/schema.prisma` - Database schema

### Monitoring Points
- Redis connection status
- AI API usage/limits
- Database query performance
- Class enrollment metrics
- Publishing workflow bottlenecks
- Cache hit rates

## Important Notes

1. **Student Access**: Students can NEVER access the full book library
2. **TTS Behavior**: Always shows error, never plays audio
3. **Class Codes**: 6 characters, no confusing letters (0,O,I,1)
4. **Workflow**: Books must go through all stages to be published
5. **Caching**: Redis fallback to mock for development
6. **Testing**: Run full E2E suite before deployment

---

*Last Updated: 2025-09-08*
*Version: 2.0.0 - Educational Platform Release*