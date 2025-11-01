# Product Requirements Document (PRD)
## Dashboard Restructure & Multi-Language System

**Version**: 1.0
**Date**: 2025-11-01
**Status**: Approved
**Owner**: Development Team

---

## 1. Executive Summary

This PRD outlines the comprehensive restructuring of the 1001 Stories dashboard system to support role-based navigation, multi-language support, and improved user experience. The restructure addresses current design issues and establishes a scalable foundation for future role additions.

### Goals
- Restructure Writer dashboard into Home/Stories/Library pages
- Implement role-based sidebar navigation system
- Add comprehensive multi-language support (all world languages)
- Maintain existing design elements from production Writer dashboard
- Support future role additions (PARENT, COMPETITION)

### Success Metrics
- All existing functionality preserved after migration
- Multi-language support for 12+ languages
- Role-based navigation working for all 7+ roles
- Zero downtime deployment
- Improved user satisfaction scores

---

## 2. Background & Context

### Current Issues
1. **Dashboard Structure**: Current `/dashboard/writer` shows story list directly, lacking home dashboard
2. **Stories Page**: Current `/dashboard/writer/stories` has design problems
3. **Library Access**: No clear separation between "my stories" and "published stories by others"
4. **Role Navigation**: All roles share similar navigation structure
5. **Language Support**: Limited internationalization

### User Pain Points
- Writers confused between "my stories" and "library"
- No dashboard overview for quick actions
- Language barriers for international users
- Role-specific features not clearly separated

---

## 3. User Stories

### As a WRITER (Default Role)
- I want to see my dashboard overview with statistics and quick actions
- I want to manage my submitted stories in a dedicated Stories page
- I want to browse published stories by others in Library
- I want to use the platform in my native language

### As a LEARNER
- I want to see only the books assigned to me by my teacher
- I want to track my reading progress on my dashboard
- I want to access learning tools without seeing publishing features

### As a TEACHER
- I want to manage my classes and students from my dashboard
- I want to assign books to students
- I want to monitor student progress

### As a PARENT (Future)
- I want to see my children's reading activities
- I want to view stories written by my children
- I want a simplified interface focused on monitoring

### As a COMPETITION User (Future)
- I want to write and submit stories only
- I want no access to library or other features
- I want a focused writing interface

---

## 4. Functional Requirements

### 4.1 Dashboard Page Structure

#### Writer Dashboard Pages

##### `/dashboard/writer` (NEW - Home Dashboard)
**Purpose**: Overview and quick actions

**Components**:
- Welcome banner with user name
- Statistics cards:
  - Total submissions
  - Stories in review
  - Published stories
  - Recent activity
- Quick action buttons:
  - Write new story
  - View pending feedback
  - Browse library
- Recent submissions list (last 3-5)
- Notification center preview

**Design Requirements**:
- Maintain color palette from current production page
- Use existing card components and typography
- Responsive layout (desktop/tablet/mobile)

##### `/dashboard/writer/stories` (MOVED - My Stories)
**Purpose**: Manage user's own story submissions

**Components** (migrated from current `/dashboard/writer`):
- Story submission cards with:
  - Title and summary
  - Generated image thumbnails (128x128px)
  - Status badges
  - Last updated timestamp
  - Action buttons (Edit/View/Delete)
- Filter by status (All, Draft, Pending, Review, Published)
- Search functionality
- Sort options (date, title, status)
- Pagination

**Data Source**:
```typescript
// API: /api/writer/my-stories
TextSubmission.findMany({
  where: { authorId: session.user.id },
  include: { generatedImages: true },
  orderBy: { updatedAt: 'desc' }
})
```

##### `/dashboard/writer/library` (NEW - Published Stories)
**Purpose**: Browse published stories by other users

**Components**:
- Story cards with:
  - Title and author name
  - Cover image
  - Summary excerpt
  - Publication date
  - View count
  - Rating
- Filter by:
  - Category
  - Age range
  - Language
- Search functionality
- Sort options (popular, recent, rating)

**Data Source**:
```typescript
// API: /api/library/published-books
TextSubmission.findMany({
  where: {
    status: 'PUBLISHED',
    authorId: { not: session.user.id }
  },
  include: { author: { select: { name: true } } }
})
```

### 4.2 Role-Based Sidebar Navigation

#### Navigation Menu Configuration

**menuConfig.ts Structure**:
```typescript
interface MenuItem {
  label: string; // Translation key
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string; // Optional notification badge
}

const menuItems: Record<UserRole, MenuItem[]> = {
  WRITER: [
    { label: 'nav.home', path: '/dashboard/writer', icon: Home, roles: ['WRITER'] },
    { label: 'nav.stories', path: '/dashboard/writer/stories', icon: BookOpen, roles: ['WRITER'] },
    { label: 'nav.library', path: '/dashboard/writer/library', icon: Library, roles: ['WRITER'] }
  ],
  LEARNER: [
    { label: 'nav.home', path: '/dashboard/learner', icon: Home, roles: ['LEARNER'] },
    { label: 'nav.library', path: '/dashboard/learner/library', icon: Library, roles: ['LEARNER'] },
    { label: 'nav.progress', path: '/dashboard/learner/progress', icon: TrendingUp, roles: ['LEARNER'] }
  ],
  TEACHER: [
    { label: 'nav.home', path: '/dashboard/teacher', icon: Home, roles: ['TEACHER'] },
    { label: 'nav.classes', path: '/dashboard/teacher/classes', icon: Users, roles: ['TEACHER'] },
    { label: 'nav.library', path: '/dashboard/teacher/library', icon: Library, roles: ['TEACHER'] }
  ],
  // ... other roles
}
```

#### BaseLNB Component
**File**: `/components/navigation/BaseLNB.tsx`

**Props**:
```typescript
interface BaseLNBProps {
  menuItems: MenuItem[];
  currentPath: string;
  userRole: UserRole;
  userName?: string;
  onNavigate?: (path: string) => void;
}
```

**Features**:
- Dynamic menu rendering based on role
- Active state highlighting
- Notification badges
- Responsive collapse/expand
- Logout button
- User profile preview

#### Role-Specific LNB Components
- `WriterLNB.tsx` - Uses BaseLNB with WRITER menu config
- `LearnerLNB.tsx` - Uses BaseLNB with LEARNER menu config
- `TeacherLNB.tsx` - Uses BaseLNB with TEACHER menu config
- `StoryManagerLNB.tsx` - Uses BaseLNB with STORY_MANAGER config
- `BookManagerLNB.tsx` - Uses BaseLNB with BOOK_MANAGER config
- `ContentAdminLNB.tsx` - Uses BaseLNB with CONTENT_ADMIN config
- `AdminLNB.tsx` - Uses BaseLNB with ADMIN config

### 4.3 Multi-Language System

#### Supported Languages (Initial)
1. English (en) - Default
2. Korean (ko)
3. Spanish (es)
4. French (fr)
5. Chinese Simplified (zh)
6. Arabic (ar) - RTL
7. Hindi (hi)
8. Japanese (ja)
9. Portuguese (pt)
10. German (de)
11. Russian (ru)
12. Italian (it)

#### CSV Translation Management

**Master File**: `/locales/translations.csv`

**Structure**:
```csv
key,context,en,ko,es,fr,zh,ar,hi,ja,pt,de,ru,it
nav.home,Navigation,Home,홈,Inicio,Accueil,首页,الرئيسية,होम,ホーム,Início,Startseite,Главная,Home
nav.stories,Navigation,Stories,스토리,Historias,Histoires,故事,القصص,कहानियाँ,ストーリー,Histórias,Geschichten,Истории,Storie
nav.library,Navigation,Library,라이브러리,Biblioteca,Bibliothèque,图书馆,المكتبة,पुस्तकालय,ライブラリ,Biblioteca,Bibliothek,Библиотека,Biblioteca
dashboard.welcome,Dashboard,Welcome back,다시 오신 것을 환영합니다,Bienvenido de nuevo,Bon retour,欢迎回来,مرحبا بعودتك,वापसी पर स्वागत है,おかえりなさい,Bem-vindo de volta,Willkommen zurück,Добро пожаловать,Bentornato
story.title,Forms,Story Title,스토리 제목,Título de la historia,Titre de l'histoire,故事标题,عنوان القصة,कहानी का शीर्षक,ストーリータイトル,Título da História,Geschichtentitel,Название истории,Titolo della Storia
# ... 200+ keys covering all UI elements
```

**Context Column**: Helps translators understand where the text appears

#### Translation Workflow

**Scripts**:

1. **CSV to JSON Conversion** (`scripts/csv-to-json.ts`):
```typescript
// Converts translations.csv to individual JSON files
// Output: locales/en.json, locales/ko.json, etc.
import * as fs from 'fs';
import * as csv from 'csv-parser';

interface TranslationRow {
  key: string;
  context: string;
  [lang: string]: string;
}

async function csvToJson() {
  const languages = ['en', 'ko', 'es', 'fr', 'zh', 'ar', 'hi', 'ja', 'pt', 'de', 'ru', 'it'];
  const translations: Record<string, any> = {};

  // Initialize language objects
  languages.forEach(lang => translations[lang] = {});

  // Read CSV
  fs.createReadStream('locales/translations.csv')
    .pipe(csv())
    .on('data', (row: TranslationRow) => {
      languages.forEach(lang => {
        setNestedValue(translations[lang], row.key, row[lang]);
      });
    })
    .on('end', () => {
      // Write JSON files
      languages.forEach(lang => {
        fs.writeFileSync(
          `locales/${lang}.json`,
          JSON.stringify(translations[lang], null, 2)
        );
      });
    });
}

function setNestedValue(obj: any, path: string, value: string) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}
```

2. **Extract Text for Translation** (`scripts/extract-text.ts`):
```typescript
// Scans codebase for hardcoded text and suggests translation keys
import * as fs from 'fs';
import * as glob from 'glob';

async function extractText() {
  const files = glob.sync('app/**/*.{ts,tsx}');
  const textPatterns = [
    /"([^"]+)"/g,  // Double quotes
    /'([^']+)'/g,  // Single quotes
    /`([^`]+)`/g   // Template literals
  ];

  const suggestions: string[] = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Extract and suggest translation keys
    // Output to suggestions.txt
  });
}
```

3. **Build Script Update** (`package.json`):
```json
{
  "scripts": {
    "i18n:convert": "npx tsx scripts/csv-to-json.ts",
    "i18n:extract": "npx tsx scripts/extract-text.ts",
    "prebuild": "npm run i18n:convert",
    "build": "next build"
  }
}
```

#### Language Selector Component

**File**: `/components/language/LanguageSelector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' }
];

export default function LanguageSelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (langCode: string) => {
    // Set cookie
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`;

    // Set RTL if needed
    const lang = LANGUAGES.find(l => l.code === langCode);
    if (lang?.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }

    // Refresh page
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <Globe className="h-5 w-5" />
        <span>Language</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### i18next Configuration

**File**: `/lib/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from '@/locales/en.json';
import ko from '@/locales/ko.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import zh from '@/locales/zh.json';
import ar from '@/locales/ar.json';
import hi from '@/locales/hi.json';
import ja from '@/locales/ja.json';
import pt from '@/locales/pt.json';
import de from '@/locales/de.json';
import ru from '@/locales/ru.json';
import it from '@/locales/it.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      es: { translation: es },
      fr: { translation: fr },
      zh: { translation: zh },
      ar: { translation: ar },
      hi: { translation: hi },
      ja: { translation: ja },
      pt: { translation: pt },
      de: { translation: de },
      ru: { translation: ru },
      it: { translation: it }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

#### Cookie-Based Language Persistence

**Middleware Update** (`middleware.ts`):
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get language from cookie
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';

  // Set response headers
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);

  return response;
}
```

**Root Layout Update** (`app/layout.tsx`):
```typescript
import { cookies } from 'next/headers';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <I18nextProvider locale={locale}>
          {children}
        </I18nextProvider>
      </body>
    </html>
  );
}
```

### 4.4 Additional Roles

#### PARENT Role (Future - Week 5)

**Dashboard Pages**:
- `/dashboard/parent` - Home with children overview
- `/dashboard/parent/children` - Manage children accounts
- `/dashboard/parent/stories` - View children's stories

**Features**:
- Link child accounts
- View children's reading progress
- See stories written by children
- Simplified interface

**Database Changes**:
```prisma
model User {
  // ... existing fields
  parentId     String?  // Link to parent account
  parent       User?    @relation("ParentChild", fields: [parentId], references: [id])
  children     User[]   @relation("ParentChild")
}
```

#### COMPETITION Role (Future - Week 5)

**Dashboard Pages**:
- `/dashboard/competition` - Write only interface

**Features**:
- Submit stories for competition
- No library access
- No reading features
- Focused submission form

**Navigation**:
```typescript
COMPETITION: [
  { label: 'nav.submit', path: '/dashboard/competition', icon: PenTool, roles: ['COMPETITION'] }
]
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time < 2 seconds
- Language switch < 500ms
- API response time < 1 second
- Support 1000+ concurrent users

### 5.2 Security
- Role-based access control enforced on both client and server
- API endpoints validate user permissions
- No unauthorized access to other users' data
- CSRF protection on all forms

### 5.3 Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode support
- RTL language support

### 5.4 Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

### 5.5 Responsive Design
- Desktop (1920x1080+)
- Laptop (1366x768+)
- Tablet (768x1024)
- Mobile (375x667+)

---

## 6. Technical Specifications

### 6.1 API Endpoints

#### `/api/writer/dashboard-stats`
**Method**: GET
**Auth**: Required
**Response**:
```typescript
{
  totalSubmissions: number;
  storiesInReview: number;
  publishedStories: number;
  recentActivity: {
    id: string;
    type: 'submission' | 'feedback' | 'publication';
    title: string;
    date: string;
  }[];
}
```

#### `/api/writer/my-stories`
**Method**: GET
**Auth**: Required
**Query Params**:
- `status?: string` - Filter by status
- `search?: string` - Search by title
- `page?: number` - Pagination
- `limit?: number` - Items per page

**Response**:
```typescript
{
  stories: TextSubmission[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

#### `/api/library/published-books`
**Method**: GET
**Auth**: Required
**Query Params**:
- `category?: string` - Filter by category
- `ageRange?: string` - Filter by age range
- `language?: string` - Filter by language
- `search?: string` - Search by title/author
- `sort?: 'popular' | 'recent' | 'rating'`
- `page?: number`
- `limit?: number`

**Response**:
```typescript
{
  books: {
    id: string;
    title: string;
    author: { name: string };
    summary: string;
    coverImage: string;
    publishedAt: string;
    viewCount: number;
    rating: number;
  }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

### 6.2 Database Schema Updates

No schema changes required for Phase 1-3. Phase 4 requires:

```prisma
model User {
  // Add for PARENT role
  parentId     String?
  parent       User?    @relation("ParentChild", fields: [parentId], references: [id])
  children     User[]   @relation("ParentChild")

  // Add for role-based features
  competitionId String?  // Link to competition
}

enum UserRole {
  // ... existing roles
  PARENT
  COMPETITION
}
```

### 6.3 File Structure

```
1001-stories/
├── app/
│   ├── dashboard/
│   │   ├── writer/
│   │   │   ├── page.tsx                 # NEW: Home dashboard
│   │   │   ├── stories/
│   │   │   │   └── page.tsx            # MOVED: My stories
│   │   │   └── library/
│   │   │       └── page.tsx            # NEW: Published library
│   │   ├── learner/
│   │   │   ├── page.tsx
│   │   │   ├── library/page.tsx
│   │   │   └── progress/page.tsx
│   │   ├── teacher/
│   │   │   ├── page.tsx
│   │   │   ├── classes/page.tsx
│   │   │   └── library/page.tsx
│   │   ├── parent/                      # FUTURE
│   │   │   ├── page.tsx
│   │   │   ├── children/page.tsx
│   │   │   └── stories/page.tsx
│   │   └── competition/                 # FUTURE
│   │       └── page.tsx
│   └── api/
│       ├── writer/
│       │   ├── dashboard-stats/route.ts
│       │   └── my-stories/route.ts
│       └── library/
│           └── published-books/route.ts
├── components/
│   ├── navigation/
│   │   ├── BaseLNB.tsx                  # NEW: Base sidebar
│   │   ├── WriterLNB.tsx
│   │   ├── LearnerLNB.tsx
│   │   ├── TeacherLNB.tsx
│   │   ├── StoryManagerLNB.tsx
│   │   ├── BookManagerLNB.tsx
│   │   ├── ContentAdminLNB.tsx
│   │   ├── AdminLNB.tsx
│   │   ├── ParentLNB.tsx               # FUTURE
│   │   └── CompetitionLNB.tsx          # FUTURE
│   ├── language/
│   │   └── LanguageSelector.tsx
│   └── dashboard/
│       ├── StatsCard.tsx
│       ├── QuickActions.tsx
│       └── RecentActivity.tsx
├── lib/
│   ├── i18n/
│   │   └── config.ts
│   └── navigation/
│       └── menuConfig.ts
├── locales/
│   ├── translations.csv                 # Master translation file
│   ├── en.json                          # Generated from CSV
│   ├── ko.json
│   ├── es.json
│   ├── fr.json
│   ├── zh.json
│   ├── ar.json
│   ├── hi.json
│   ├── ja.json
│   ├── pt.json
│   ├── de.json
│   ├── ru.json
│   └── it.json
└── scripts/
    ├── csv-to-json.ts
    └── extract-text.ts
```

---

## 7. Design Specifications

### 7.1 Design Principles
- Maintain existing design from `https://1001stories.seedsofempowerment.org/dashboard/writer`
- Clean, minimal interface
- Consistent spacing and typography
- Accessible color contrast
- Mobile-first responsive design

### 7.2 Color Palette (Existing)
```css
/* Primary Colors */
--color-primary: #141414;
--color-primary-hover: #1f1f1f;

/* Neutral Colors */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;

/* Border Colors */
--color-border: #E5E5EA;

/* Text Colors */
--color-text-primary: #141414;
--color-text-secondary: #8E8E93;
```

### 7.3 Typography (Existing)
```css
/* Font Family */
--font-primary: "Helvetica Neue", -apple-system, system-ui, sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;

/* Line Heights */
--leading-tight: 1.193;
--leading-normal: 1.221;
--leading-relaxed: 1.5;
```

### 7.4 Component Specifications

#### Stats Card
- Width: 100% (grid responsive)
- Height: Auto
- Border: 1px solid #E5E5EA
- Border radius: 8px
- Padding: 24px
- Background: White

#### Navigation Sidebar
- Width: 280px (desktop), 100% (mobile)
- Background: White
- Border: 1px solid #E5E5EA
- Active state: Background #F9FAFB

#### Story Cards
- Border: 1px solid #E5E5EA
- Border radius: 8px
- Padding: 20px
- Image thumbnail: 128x128px, rounded 8px
- Gap between image and content: 16px

---

## 8. Migration Strategy

### 8.1 Backup Plan
Before any changes:
1. Create backup branch: `backup/dashboard-restructure-[timestamp]`
2. Export database to `/backups/db-[timestamp].sql`
3. Archive current files to `/archive/dashboard-pre-restructure/`

### 8.2 Phased Rollout

#### Phase 1: Dashboard Pages (Week 1)
- Day 1-2: Create new Writer Home dashboard
- Day 3-4: Move content to Writer Stories page
- Day 5: Create Writer Library page
- Day 6-7: API endpoints and testing

#### Phase 2: Navigation (Week 2)
- Day 1-3: Create BaseLNB and role-specific components
- Day 4-5: Integrate navigation into all dashboards
- Day 6-7: Testing and refinement

#### Phase 3: Multi-Language (Week 3-4)
- Week 3, Day 1-3: Set up CSV system and scripts
- Week 3, Day 4-7: Create translations for core UI (50+ keys)
- Week 4, Day 1-5: Apply i18n to all pages
- Week 4, Day 6-7: Testing and fixes

#### Phase 4: Additional Roles (Week 5)
- Day 1-3: PARENT role implementation
- Day 4-5: COMPETITION role implementation
- Day 6-7: Final testing and deployment

### 8.3 Rollback Plan
If critical issues arise:
1. Revert to backup branch
2. Restore database from backup
3. Deploy previous version via Docker
4. Analyze issues and plan fix

---

## 9. Testing Strategy

### 9.1 Unit Testing
- Component rendering tests
- API endpoint tests
- Utility function tests
- i18n translation tests

### 9.2 Integration Testing
- Role-based navigation flow
- Dashboard page data loading
- Language switching
- API data fetching

### 9.3 E2E Testing (Playwright)
```typescript
// Test cases
test('Writer dashboard shows correct stats', async ({ page }) => {
  await page.goto('/dashboard/writer');
  await expect(page.locator('[data-testid="total-submissions"]')).toBeVisible();
});

test('Language selector changes UI language', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="language-selector"]');
  await page.click('[data-testid="lang-ko"]');
  await expect(page.locator('h1')).toContainText('홈');
});

test('Writer can navigate to stories page', async ({ page }) => {
  await page.goto('/dashboard/writer');
  await page.click('[data-testid="nav-stories"]');
  await expect(page).toHaveURL('/dashboard/writer/stories');
});
```

### 9.4 Manual Testing Checklist
- [ ] All dashboard pages load correctly
- [ ] Role-based navigation shows correct menu items
- [ ] Language switching updates all UI elements
- [ ] RTL languages display correctly
- [ ] Mobile responsive design works
- [ ] All API endpoints return correct data
- [ ] Authentication and authorization work
- [ ] Images and thumbnails display
- [ ] Forms submit successfully
- [ ] Error handling works

---

## 10. Deployment Plan

### 10.1 Pre-Deployment
1. Run full test suite: `npm run test`
2. Run linter: `npm run lint`
3. Build production: `npm run build`
4. Test Docker locally: `docker-compose -f docker-compose.local.yml up -d --build`
5. Verify all functionality in local Docker environment
6. Commit changes: `git add . && git commit -m "Dashboard restructure Phase X"`
7. Push to GitHub: `git push`

### 10.2 Deployment
1. SSH to server: `ssh -i /Users/jihunkong/Downloads/1001project.pem ubuntu@3.128.143.122`
2. Deploy: `./scripts/deploy.sh deploy`
3. Monitor logs: `docker-compose logs -f app`
4. Verify HTTPS: `curl https://1001stories.seedsofempowerment.org`

### 10.3 Post-Deployment
1. Smoke testing on production
2. Monitor error logs for 24 hours
3. Collect user feedback
4. Address critical bugs immediately

### 10.4 Rollback Procedure
If deployment fails:
```bash
# On server
./scripts/deploy.sh rollback

# Or manual rollback
git checkout backup/dashboard-restructure-[timestamp]
./scripts/deploy.sh deploy
```

---

## 11. Risk Management

### 11.1 Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | Critical | Create backups before changes |
| Breaking existing features | Medium | High | Comprehensive testing before deploy |
| Translation quality issues | Medium | Medium | Use professional translators, native speaker review |
| Performance degradation | Low | Medium | Load testing, optimize queries |
| User confusion after UI changes | High | Medium | User guide, gradual rollout |
| RTL language display issues | Medium | Low | Test with native speakers |

### 11.2 Mitigation Strategies
- Comprehensive backup before all changes
- Feature flags for gradual rollout
- A/B testing for UI changes
- User onboarding tooltips
- Rollback plan ready
- 24/7 monitoring during rollout

---

## 12. Success Criteria

### 12.1 Completion Criteria
- [ ] All 3 Writer dashboard pages functional
- [ ] Role-based navigation working for all 7+ roles
- [ ] 12+ languages supported with CSV system
- [ ] Zero critical bugs in production
- [ ] All existing features preserved
- [ ] Performance metrics maintained
- [ ] Accessibility standards met
- [ ] Documentation complete

### 12.2 Acceptance Testing
- Product owner review and approval
- QA team sign-off
- User acceptance testing (5+ users per role)
- Performance benchmarks passed
- Security audit passed

---

## 13. Timeline

### Week 1: Dashboard Restructure
- **Day 1-2**: Backup + Writer Home dashboard
- **Day 3-4**: Writer Stories page migration
- **Day 5**: Writer Library page
- **Day 6-7**: API routes + testing

### Week 2: Role-Based Navigation
- **Day 1-3**: BaseLNB + role components
- **Day 4-5**: Integration
- **Day 6-7**: Testing

### Week 3-4: Multi-Language System
- **Week 3, Day 1-3**: CSV setup + scripts
- **Week 3, Day 4-7**: Core translations
- **Week 4, Day 1-5**: Apply i18n
- **Week 4, Day 6-7**: Testing

### Week 5: Additional Roles
- **Day 1-3**: PARENT role
- **Day 4-5**: COMPETITION role
- **Day 6-7**: Final testing + deployment

---

## 14. Documentation Deliverables

1. **PRD** (This document)
2. **Migration Guide** - For developers
3. **User Guide** - For end users (per role)
4. **API Documentation** - New endpoints
5. **Translation Guide** - For translators
6. **Testing Report** - QA results
7. **Deployment Checklist** - DevOps

---

## 15. Appendices

### A. Glossary
- **LNB**: Left Navigation Bar (sidebar)
- **RTL**: Right-to-Left (Arabic, Hebrew languages)
- **i18n**: Internationalization
- **SSR**: Server-Side Rendering
- **PRD**: Product Requirements Document

### B. References
- Current production: https://1001stories.seedsofempowerment.org
- Figma designs: (if available)
- GitHub repository: SeedsofEmpowerment/1001storie_online
- Previous discussions: Session summary

### C. Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-01 | Development Team | Initial PRD creation |

---

## 16. Approval

**Prepared by**: Development Team
**Reviewed by**: Product Owner
**Approved by**: Stakeholders
**Date**: 2025-11-01
**Status**: ✅ Approved - Ready for Implementation
