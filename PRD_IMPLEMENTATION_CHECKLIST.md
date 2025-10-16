# PRD Implementation Checklist - Code Quality Standards

## 📋 Overview

This document defines code quality standards and pre-implementation checklist for the **Story Publication** feature.

**Related Documents:**
- `CODE_QUALITY_PLAN.md` (this worktree) - Existing lint/error fixes (80+ warnings, 3 errors)
- `docs/STORY_PUBLICATION_PRD.md` (main worktree) - Full PRD

---

## 🚨 Phase 0: Pre-Implementation Quality Gates

### Must Fix Before PRD Implementation

#### 1. Critical Errors (3 total) ⚠️ BLOCKING
- [ ] React apostrophe escaping - `app/login/page.tsx:354`
- [ ] React apostrophe escaping - `components/workflow/StoryStatusCardDemo.tsx:184`
- [ ] React apostrophe escaping - `components/workflow/StoryStatusCardDemo.tsx:259`

**Fix Pattern**:
```tsx
// Before (ERROR)
<p>Let's get started</p>

// After (FIXED)
<p>Let&apos;s get started</p>
// or
<p>{`Let's get started`}</p>
```

#### 2. High Priority Warnings (60+ console.log)
- [ ] Remove all console.log from production code
- [ ] Replace with console.error/warn where appropriate
- [ ] Use proper logging library (Winston/Pino) for server-side

**Priority Files**:
- `lib/email.ts` (14 console.log)
- `lib/audit-monitoring.ts` (7 console.log)
- `components/workflow/StoryStatusCardDemo.tsx` (6 console.log)
- `lib/performance.ts` (4 console.log)

#### 3. React Hook Dependencies (15 warnings)
- [ ] Fix all missing dependencies in useEffect/useCallback/useMemo
- [ ] Add useCallback for functions passed as deps
- [ ] Move functions inside useEffect if only used there

**Pattern**:
```tsx
// Before (WARNING)
useEffect(() => {
  fetchData();
}, []); // fetchData not in deps

// Fix Option 1: useCallback
const fetchData = useCallback(() => {
  // fetch logic
}, [/* actual deps */]);

useEffect(() => {
  fetchData();
}, [fetchData]);

// Fix Option 2: Move inside
useEffect(() => {
  const fetchData = () => {
    // fetch logic
  };
  fetchData();
}, [/* actual deps */]);
```

#### 4. Export Patterns (2 warnings)
- [ ] Fix anonymous default export in `lib/rate-limit.ts`
- [ ] Fix anonymous default export in `lib/security-middleware.ts`

**Pattern**:
```typescript
// Before (WARNING)
export default {
  // ...
}

// After (FIXED)
const rateLimiter = {
  // ...
};
export default rateLimiter;
```

---

## 📐 Coding Standards for Story Publication

### TypeScript Standards

#### 1. Type Safety
```typescript
// ✅ GOOD: Explicit types
interface SubmissionFormData {
  title: string;
  content: string;
  language: string;
  category: string[];
  tags: string[];
}

async function createSubmission(data: SubmissionFormData): Promise<TextSubmission> {
  // ...
}

// ❌ BAD: Using any
async function createSubmission(data: any): Promise<any> {
  // ...
}
```

#### 2. Error Handling
```typescript
// ✅ GOOD: Proper error handling
try {
  const submission = await createSubmission(data);
  return { success: true, data: submission };
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    return { success: false, error: 'Database error' };
  }
  throw error; // Re-throw unexpected errors
}

// ❌ BAD: Silent errors
try {
  await createSubmission(data);
} catch (e) {
  console.log(e); // Silent failure
}
```

#### 3. Async/Await
```typescript
// ✅ GOOD: Consistent async/await
async function submitStory(id: string) {
  const submission = await getSubmission(id);
  await validateSubmission(submission);
  await updateStatus(id, 'PENDING');
  await sendNotifications(id);
  return submission;
}

// ❌ BAD: Mixing promise chains
function submitStory(id: string) {
  return getSubmission(id)
    .then(submission => {
      validateSubmission(submission);
      return updateStatus(id, 'PENDING');
    })
    .then(() => sendNotifications(id));
}
```

### React Component Standards

#### 1. Functional Components Only
```tsx
// ✅ GOOD: Functional component with hooks
export function StoryCard({ story }: { story: TextSubmission }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>...</div>
  );
}

// ❌ BAD: Class components
export class StoryCard extends React.Component {
  // ...
}
```

#### 2. Props Interface
```tsx
// ✅ GOOD: Explicit props interface
interface StoryCardProps {
  story: TextSubmission;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
  // ...
}

// ❌ BAD: Inline props
export function StoryCard(props: any) {
  // ...
}
```

#### 3. Loading & Error States
```tsx
// ✅ GOOD: Handle all states
export function SubmissionList() {
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions()
      .then(setSubmissions)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (submissions.length === 0) return <EmptyState />;

  return <SubmissionGrid submissions={submissions} />;
}

// ❌ BAD: Missing states
export function SubmissionList() {
  const [submissions, setSubmissions] = useState([]);
  // No loading or error handling
  return <div>{submissions.map(...)}</div>;
}
```

### API Route Standards

#### 1. Input Validation
```typescript
// ✅ GOOD: Zod validation
import { z } from 'zod';

const SubmissionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(100),
  category: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = SubmissionSchema.parse(body); // Throws if invalid
  // ...
}

// ❌ BAD: No validation
export async function POST(req: Request) {
  const body = await req.json();
  // Directly use body without validation
}
```

#### 2. Authorization Checks
```typescript
// ✅ GOOD: Check auth before processing
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateSubmission(session.user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request...
}

// ❌ BAD: No auth check
export async function POST(req: Request) {
  // Directly process without checking auth
}
```

#### 3. Consistent Error Responses
```typescript
// ✅ GOOD: Consistent error format
return Response.json(
  {
    error: 'Validation failed',
    message: 'Title must be at least 1 character',
    code: 'VALIDATION_ERROR',
  },
  { status: 400 }
);

// ❌ BAD: Inconsistent errors
return new Response('Bad request', { status: 400 });
// or
return Response.json({ msg: 'error' });
```

---

## 🧪 Testing Requirements

### Unit Tests (Jest/Vitest)

#### Coverage Requirements
- **Functions**: 80% coverage minimum
- **Branches**: 70% coverage minimum
- **Lines**: 80% coverage minimum

#### Test Structure
```typescript
// tests/services/submission.test.ts

describe('SubmissionService', () => {
  describe('createSubmission', () => {
    it('should create submission with valid data', async () => {
      const data = {
        title: 'Test Story',
        content: 'Content...',
        authorId: 'user_123',
      };

      const result = await createSubmission(data);

      expect(result.status).toBe('DRAFT');
      expect(result.title).toBe('Test Story');
    });

    it('should throw error with invalid data', async () => {
      const data = { title: '' }; // Invalid

      await expect(
        createSubmission(data)
      ).rejects.toThrow('Title is required');
    });
  });

  describe('submitForReview', () => {
    it('should transition status from DRAFT to PENDING', async () => {
      const submission = await createTestSubmission();

      await submitForReview(submission.id);

      const updated = await getSubmission(submission.id);
      expect(updated.status).toBe('PENDING');
    });

    it('should send notification to reviewers', async () => {
      const notifySpy = jest.spyOn(NotificationService, 'notify');

      await submitForReview('sub_123');

      expect(notifySpy).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests (Playwright)

#### E2E Test Scenarios
```typescript
// tests/e2e/story-submission.spec.ts

test.describe('Story Submission Flow', () => {
  test('writer can create and submit story', async ({ page }) => {
    await loginAs(page, 'writer@test.com');

    // Navigate to submission form
    await page.goto('/dashboard/writer/submit-text');

    // Fill form
    await page.fill('[name="title"]', 'My Test Story');
    await page.fill('[name="content"]', 'Once upon a time...');

    // Save draft
    await page.click('button:has-text("임시 저장")');
    await expect(page.locator('text=Draft saved')).toBeVisible();

    // Request AI review
    await page.click('button:has-text("AI 리뷰 요청")');
    await expect(page.locator('text=AI review in progress')).toBeVisible();

    // Submit for review
    await page.click('button:has-text("최종 제출")');
    await page.check('[type="checkbox"]'); // Copyright
    await page.click('button:has-text("제출")');

    // Verify status change
    await expect(page.locator('text=Pending Review')).toBeVisible();
  });

  test('manager can review and approve story', async ({ page }) => {
    // Setup: Create pending submission
    const submission = await createTestSubmission({ status: 'PENDING' });

    await loginAs(page, 'story-manager@test.com');
    await page.goto('/dashboard/story-manager/review');

    // Find and open submission
    await page.click(`text=${submission.title}`);

    // Approve
    await page.click('button:has-text("승인")');
    await page.click('button:has-text("확인")');

    // Verify approval
    await expect(page.locator('text=Story Approved')).toBeVisible();
  });
});
```

---

## 📊 Performance Standards

### API Response Times
- **GET requests**: < 200ms (avg)
- **POST/PATCH requests**: < 500ms (avg)
- **AI Review requests**: < 3s (initial response), async processing

### Frontend Performance
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### Database Query Optimization
```typescript
// ✅ GOOD: Efficient query with select
const submission = await prisma.textSubmission.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    status: true,
    author: {
      select: { name: true, email: true },
    },
  },
});

// ❌ BAD: Fetching all fields
const submission = await prisma.textSubmission.findUnique({
  where: { id },
  include: { author: true }, // Fetches all author fields
});
```

---

## 🔒 Security Standards

### Input Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content
const sanitized = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: [],
});
```

### SQL Injection Prevention
```typescript
// ✅ GOOD: Parameterized queries (Prisma does this automatically)
await prisma.textSubmission.findMany({
  where: { authorId: userId },
});

// ❌ BAD: Raw SQL with string interpolation
await prisma.$executeRaw`SELECT * FROM text_submissions WHERE authorId = ${userId}`;
```

### XSS Prevention
```tsx
// ✅ GOOD: React automatically escapes
<div>{userContent}</div>

// ⚠️ CAREFUL: Only when necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

---

## ✅ Pre-Merge Checklist

### Before Creating PR
- [ ] All lint errors fixed (npm run lint)
- [ ] All tests passing (npm test)
- [ ] Build succeeds (npm run build)
- [ ] Type check passes (tsc --noEmit)
- [ ] No console.log in production code
- [ ] All TODO comments addressed or documented

### Code Review Checklist
- [ ] Follows TypeScript coding standards
- [ ] Proper error handling implemented
- [ ] Input validation present
- [ ] Authorization checks in place
- [ ] Loading/error states handled
- [ ] Tests cover main scenarios
- [ ] No sensitive data in logs
- [ ] Performance acceptable

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Documentation updated

---

## 📝 Recommended Tools

### Linting & Formatting
```bash
# ESLint
npm run lint

# Prettier
npm run format

# Type checking
npm run type-check
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npx playwright test

# Coverage
npm test -- --coverage
```

### Pre-commit Hook (Husky)
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run type-check
npm test
```

---

## 🎯 Quality Gates Summary

| Gate | Requirement | Status |
|------|-------------|--------|
| **Lint Errors** | 0 errors | ⏳ Pending (3 errors) |
| **Lint Warnings** | < 10 warnings | ⏳ Pending (80+ warnings) |
| **Test Coverage** | > 80% | ⏳ Pending |
| **Build** | Success | ✅ Currently passing |
| **Type Check** | 0 errors | ✅ Currently passing |

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Owner**: Code Quality Team
**Status**: Ready for Implementation

**Next Step**: Fix existing lint errors/warnings before implementing PRD features.
