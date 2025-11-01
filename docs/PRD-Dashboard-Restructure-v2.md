# PRD: Writer Dashboard Restructure & Multi-Language System
**Version**: 2.0 (Complete Rewrite)
**Date**: 2025-11-01
**Status**: Ready for Implementation
**Estimated Duration**: 20.5 hours total

---

## Executive Summary

Complete restructuring of the Writer dashboard to:
1. Create new Home dashboard with statistics and quick actions
2. Move current story list functionality to dedicated Stories page
3. Transform Library to show published works by other writers
4. Implement comprehensive multi-language support via CSV system
5. Establish role-based sidebar navigation foundation

**Critical Success Factors**:
- Zero downtime migration
- Maintain production design system (Apple-style, Helvetica Neue)
- Preserve all existing functionality
- Enable autonomous implementation via detailed task list

---

## Current State Analysis

### File Structure (As-Is)
```
/app/dashboard/writer/
├── page.tsx                    # Stories list with tabs (DRAFT, PENDING, etc.)
├── stories/page.tsx            # Figma-designed advanced manager (TO BE DELETED)
├── library/page.tsx            # Currently shows own submissions (WRONG)
├── notifications/page.tsx      # Notifications (KEEP)
├── submit-text/page.tsx        # Submission form (KEEP)
├── story/[id]/page.tsx         # Story detail view (KEEP)
└── components/                 # Shared components (KEEP)
```

### API Endpoints (Existing)
- `GET /api/writer/text-stats` - Stats for TextSubmissions ✅
- `GET /api/text-submissions` - User's submissions with filtering ✅
- `GET /api/books` - Published books (needs modification for library)

### Design System (Production)
```css
Colors:
  Primary Black: #141414
  Hover Black: #1f1f1f
  Border: #E5E5EA
  Background: #F9FAFB
  Text Secondary: #8E8E93

Typography:
  Font: "Helvetica Neue", -apple-system, system-ui, sans-serif
  Heading: 48px/500/1.221
  Body: 16px/400/1.5
  Button: 16px/500/1.221

Components:
  Border Radius: 8px
  Card Padding: 24px
  Button Padding: 12px 32px
  Shadow: sm (subtle)
```

---

## User Requirements (Korean → English)

### 사용자 요구사항 번역
1. **현재 `/dashboard/writer` → `/dashboard/writer/stories`로 이동**
   - Move current main page content to Stories page

2. **현재 `/dashboard/writer/stories` 페이지 삭제 (디자인 문제)**
   - Delete existing Figma-designed stories page (has design issues)

3. **`/dashboard/writer/library` 수정**
   - Change from showing own submissions to showing published stories by OTHER writers

4. **새로운 `/dashboard/writer` 생성 (Home 대시보드)**
   - Create new home dashboard with statistics and quick actions

5. **역할별 사이드바 메뉴 구조 정의**
   - Define sidebar menu structure for each role

6. **전 세계 모든 언어 지원 (CSV 기반)**
   - Support all world languages via CSV-based translation system

7. **랜딩 페이지 언어 선택 쿠키 유지**
   - Persist language selection from landing page via cookies

8. **현재 production 디자인 요소 유지**
   - Maintain current production design elements

---

## Detailed Functional Specifications

### 1. New Writer Home Dashboard (`/dashboard/writer/page.tsx`)

#### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ Welcome Header                                       │
│ "Welcome back, [User Name]"                         │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬────────┐
│ Total        │ Published    │ In Review    │ Readers│
│ Stories      │ Stories      │              │ Reached│
│   [12]       │    [5]       │    [3]       │  [847] │
└──────────────┴──────────────┴──────────────┴────────┘

┌─────────────────────────────────────────────────────┐
│ Quick Actions                                        │
│ [Write Story] [View Library] [My Stories] [Notifs] │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Recent Activity                                      │
│ ○ "My First Story" - Published 2 days ago          │
│ ○ "Adventure Tale" - Feedback received 5 days ago  │
│ ○ "Mystery Night" - In review 1 week ago           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Achievements                                         │
│ ✓ First Story   ✓ 5 Published   ○ 10 Published     │
└─────────────────────────────────────────────────────┘
```

#### Data Requirements
**API Endpoint**: `GET /api/writer/text-stats`

**Response Structure**:
```typescript
{
  submissionsTotal: number;        // All submissions count
  submissionsPublished: number;    // Published count
  submissionsInReview: number;     // Currently in review
  readersReached: number;          // Total views/reads
  recentSubmissions: number;       // Last 30 days
  achievements: [
    {
      name: string;
      icon: string;
      earned: boolean;
      description: string;
    }
  ];
  workflowInsights: {
    averageReviewTime: number;
    successRate: number;
    currentInReview: number;
    needsRevision: number;
  };
}
```

**Recent Activity Data**:
- Use existing `GET /api/text-submissions?limit=5&sortBy=updatedAt`
- Display: title, status, updatedAt

#### Component Breakdown
```typescript
// /app/dashboard/writer/page.tsx
<div className="max-w-[1240px] px-4 sm:px-8 lg:px-12 py-10">
  <WelcomeHeader userName={session.user.name} />
  <StatsGrid stats={stats} />
  <QuickActions />
  <RecentActivity submissions={recentSubmissions} />
  <AchievementsBadges achievements={stats.achievements} />
</div>
```

### 2. Writer Stories Page (`/dashboard/writer/stories/page.tsx`)

#### Migration Plan
**Source**: Current `/dashboard/writer/page.tsx` (lines 1-329)
**Destination**: `/dashboard/writer/stories/page.tsx`

**Changes Required**:
- Copy entire current page.tsx content
- Update heading from "Stories" to "My Stories"
- No other changes (preserve all functionality)

**Preserved Features**:
- Tab navigation (DRAFT, PENDING, STORY_REVIEW, PUBLISHED, NEEDS_REVISION)
- SubmissionList with cards
- SSE notifications
- Actions: View, Edit, Delete, Withdraw
- Empty states
- Loading/error states

### 3. Writer Library Page (`/dashboard/writer/library/page.tsx`)

#### Current State (WRONG)
Shows user's own submissions via wrong API endpoint

#### New Implementation
**API Endpoint**: `GET /api/books?published=true&exclude=authorId`

**Query Modifications Needed**:
```typescript
// /app/api/books/route.ts
const authorId = session?.user?.id;

const books = await prisma.book.findMany({
  where: {
    isPublished: true,
    visibility: 'PUBLIC',
    // Exclude current user's books
    author: {
      id: { not: authorId }
    }
  },
  include: {
    author: {
      select: { name: true, authorAlias: true }
    }
  },
  orderBy: { publishedAt: 'desc' }
});
```

#### UI Structure
```typescript
<div className="max-w-[1240px] px-4 sm:px-8 lg:px-12 py-10">
  <h1>Published Library</h1>
  <p>Explore stories published by other writers</p>

  <FilterBar>
    <CategoryFilter />
    <AgeRangeFilter />
    <LanguageFilter />
  </FilterBar>

  <BookGrid>
    {books.map(book => (
      <BookCard
        title={book.title}
        author={book.author.authorAlias || book.author.name}
        coverImage={book.coverImage}
        summary={book.summary}
        rating={book.rating}
        viewCount={book.viewCount}
        onClick={() => openBookDetail(book.id)}
      />
    ))}
  </BookGrid>
</div>
```

**Book Model Fields to Display**:
- coverImage
- title
- authorName / authorAlias
- summary (excerpt, max 200 chars)
- rating
- viewCount
- publishedAt

### 4. Navigation Update (`WriterLNB.tsx`)

#### Current Navigation
```typescript
[
  { id: 'home', label: 'Home', href: '/dashboard/writer', icon: Home },
  { id: 'library', label: 'Library', href: '/dashboard/writer/library', icon: Bookmark },
  { id: 'stories', label: 'Stories', href: '/dashboard/writer/stories', icon: FileText }
]
```

#### New Navigation (Updated Order & Labels)
```typescript
const navItems = [
  {
    id: 'home',
    label: t('nav.home'), // 'Home' in selected language
    href: '/dashboard/writer',
    icon: Home
  },
  {
    id: 'stories',
    label: t('nav.myStories'), // 'My Stories'
    href: '/dashboard/writer/stories',
    icon: FileText
  },
  {
    id: 'library',
    label: t('nav.library'), // 'Library'
    href: '/dashboard/writer/library',
    icon: Bookmark
  },
  {
    id: 'submit',
    label: t('nav.writeStory'), // 'Write Story'
    href: '/dashboard/writer/submit-text',
    icon: PenTool,
    highlight: true // Optional: highlight as CTA
  }
];
```

---

## Multi-Language System Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ translations.csv (Master Source)                 │
│ key,en,ko,es,ar,hi,fr,de,ja,pt,ru,it,zh         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ csv-to-json.ts       │
        │ (Build-time parser)  │
        └──────────┬───────────┘
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
┌─────────┐                 ┌─────────┐
│ en.json │  ...  ...      │ ko.json │
└────┬────┘                 └────┬────┘
     │                           │
     └───────────┬───────────────┘
                 ▼
      ┌────────────────────┐
      │ useTranslation()   │
      │ hook               │
      └──────┬─────────────┘
             │
             ▼
      ┌────────────────────┐
      │ UI Components      │
      │ t('key') → value   │
      └────────────────────┘
```

### CSV Structure

**File**: `/locales/translations.csv`

```csv
key,context,en,ko,es,ar,hi
dashboard.writer.home.title,Page Title,Home,홈,Inicio,الصفحة الرئيسية,होम
dashboard.writer.home.welcome,Greeting,Welcome back,다시 오신 것을 환영합니다,Bienvenido de nuevo,مرحبا بعودتك,वापसी पर स्वागत है
dashboard.writer.stats.total,Stats Card,Total Stories,전체 스토리,Historias Totales,القصص الإجمالية,कुल कहानियाँ
dashboard.writer.stats.published,Stats Card,Published,출판됨,Publicadas,منشور,प्रकाशित
dashboard.writer.stats.inReview,Stats Card,In Review,검토 중,En Revisión,قيد المراجعة,समीक्षाधीन
dashboard.writer.stats.readers,Stats Card,Readers Reached,독자 도달,Lectores Alcanzados,القراء الذين تم الوصول إليهم,पाठकों तक पहुंचे
nav.home,Navigation,Home,홈,Inicio,الرئيسية,होम
nav.myStories,Navigation,My Stories,내 스토리,Mis Historias,قصصي,मेरी कहानियाँ
nav.library,Navigation,Library,라이브러리,Biblioteca,المكتبة,पुस्तकालय
nav.writeStory,Navigation,Write Story,스토리 쓰기,Escribir Historia,اكتب قصة,कहानी लिखें
actions.writeNew,Button,Write New Story,새 스토리 쓰기,Escribir Nueva Historia,اكتب قصة جديدة,नई कहानी लिखें
actions.viewLibrary,Button,View Library,라이브러리 보기,Ver Biblioteca,عرض المكتبة,पुस्तकालय देखें
library.title,Page Title,Published Library,출판된 라이브러리,Biblioteca Publicada,المكتبة المنشورة,प्रकाशित पुस्तकालय
library.subtitle,Description,Explore stories by other writers,다른 작가들의 스토리 탐색,Explora historias de otros escritores,استكشف قصص كتاب آخرين,अन्य लेखकों की कहानियाँ देखें
```

**Total Keys Required**: ~150-200 covering all dashboard text

### Implementation Components

#### 1. CSV Parser (`/lib/i18n/csv-loader.ts`)
```typescript
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

interface TranslationRow {
  key: string;
  context: string;
  [lang: string]: string;
}

export function loadTranslationsFromCSV(): Record<string, any> {
  const csvPath = path.join(process.cwd(), 'locales', 'translations.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const { data } = Papa.parse<TranslationRow>(csvContent, {
    header: true,
    skipEmptyLines: true
  });

  const languages = ['en', 'ko', 'es', 'ar', 'hi', 'fr', 'de', 'ja', 'pt', 'ru', 'it', 'zh'];
  const translations: Record<string, any> = {};

  languages.forEach(lang => {
    translations[lang] = {};
    data.forEach(row => {
      setNestedValue(translations[lang], row.key, row[lang] || row.en); // Fallback to English
    });
  });

  return translations;
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

// Generate JSON files
export function generateJSONFiles() {
  const translations = loadTranslationsFromCSV();
  const outputDir = path.join(process.cwd(), 'locales');

  Object.entries(translations).forEach(([lang, content]) => {
    const outputPath = path.join(outputDir, `${lang}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
  });
}
```

#### 2. Language Cookie Management (`/lib/i18n/language-cookie.ts`)
```typescript
import Cookies from 'js-cookie';

export const LANGUAGE_COOKIE_NAME = 'user-language';
export const DEFAULT_LANGUAGE = 'en';

export function getLanguage(): string {
  // 1. Check cookie
  const cookieLang = Cookies.get(LANGUAGE_COOKIE_NAME);
  if (cookieLang) return cookieLang;

  // 2. Check browser language
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.split('-')[0]; // 'en-US' → 'en'
    return browserLang;
  }

  // 3. Default
  return DEFAULT_LANGUAGE;
}

export function setLanguage(lang: string): void {
  Cookies.set(LANGUAGE_COOKIE_NAME, lang, {
    expires: 365, // 1 year
    path: '/',
    sameSite: 'lax'
  });
}
```

#### 3. Translation Hook (`/hooks/useTranslation.ts`)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getLanguage, setLanguage as setCookieLanguage } from '@/lib/i18n/language-cookie';

// Import all translation JSONs
import en from '@/locales/en.json';
import ko from '@/locales/ko.json';
import es from '@/locales/es.json';
import ar from '@/locales/ar.json';
import hi from '@/locales/hi.json';
// ... other languages

const translations: Record<string, any> = {
  en, ko, es, ar, hi
  // ... other languages
};

export function useTranslation() {
  const [currentLang, setCurrentLangState] = useState<string>('en');

  useEffect(() => {
    const lang = getLanguage();
    setCurrentLangState(lang);
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLang] || translations.en;

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    // Fallback to English if translation missing
    if (!value) {
      let fallback: any = translations.en;
      for (const k of keys) {
        fallback = fallback?.[k];
        if (!fallback) break;
      }
      value = fallback || key; // Last resort: return key itself
    }

    return value;
  };

  const setLanguage = (lang: string) => {
    setCookieLanguage(lang);
    setCurrentLangState(lang);

    // Update HTML dir attribute for RTL languages
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  return { t, currentLang, setLanguage };
}
```

#### 4. Language Selector Component (`/components/LanguageSelector.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
];

export default function LanguageSelector() {
  const { currentLang, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
    // Trigger page refresh to update all text
    window.location.reload();
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium">{currentLanguage.nativeName}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                  lang.code === currentLang ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{lang.nativeName}</span>
                  {lang.code === currentLang && (
                    <span className="text-green-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Implementation Timeline

### Phase Breakdown

| Phase | Duration | Tasks | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1: Preparation** | 30 mins | Git branch, backup, planning | Branch ready, files backed up |
| **Phase 2: Navigation** | 30 mins | Update WriterLNB structure | New nav menu with correct order |
| **Phase 3: File Restructure** | 20 mins | Move/delete files | stories/page.tsx ready, old deleted |
| **Phase 4: Home Dashboard** | 4.25 hrs | Build new home page | Fully functional home dashboard |
| **Phase 5: Library Page** | 3.5 hrs | Modify library to show others' books | Library shows published books |
| **Phase 6: i18n System** | 7.25 hrs | CSV, parser, hook, UI updates | 12 languages working |
| **Phase 7: Testing** | 2.5 hrs | Comprehensive testing | All features verified |
| **TOTAL** | **20.5 hrs** | **21 tasks** | **Production-ready dashboard** |

---

## Risk Assessment & Mitigation

### High-Risk Items

1. **Data Loss During File Migration**
   - **Risk Level**: Medium
   - **Impact**: Critical
   - **Mitigation**:
     - Git branch before changes
     - Backup directory created
     - Test locally before server deployment

2. **Breaking Current Functionality**
   - **Risk Level**: High
   - **Impact**: High
   - **Mitigation**:
     - Preserve exact code when moving files
     - No modifications during migration
     - Comprehensive testing checklist

3. **i18n Cookie Conflicts**
   - **Risk Level**: Low
   - **Impact**: Medium
   - **Mitigation**:
     - Unique cookie name `user-language`
     - Proper domain/path settings
     - Fallback to browser language

4. **API Data Mismatch (TextSubmission vs Book)**
   - **Risk Level**: Medium
   - **Impact**: High
   - **Mitigation**:
     - TypeScript interfaces defined upfront
     - Type guards in data fetching
     - Error boundaries in UI

### Rollback Procedure

If critical issues arise:

```bash
# 1. Checkout backup branch
git checkout backup/dashboard-pre-restructure-20251101-202418

# 2. Force deploy old version
npm run build
./scripts/deploy.sh deploy

# 3. Verify restoration
curl https://1001stories.seedsofempowerment.org/dashboard/writer
```

---

## Testing Strategy

### Test Checklist

#### Navigation Testing
- [ ] Home link goes to `/dashboard/writer`
- [ ] My Stories link goes to `/dashboard/writer/stories`
- [ ] Library link goes to `/dashboard/writer/library`
- [ ] Active state highlights correctly
- [ ] Mobile hamburger menu works
- [ ] All links accessible via keyboard (Tab navigation)

#### Data Loading Testing
- [ ] Home dashboard stats load correctly
- [ ] Recent activity shows last 5 submissions
- [ ] My Stories shows all user submissions
- [ ] Library shows ONLY other writers' books (not own)
- [ ] Filters work in library (category, age, language)
- [ ] No API errors in console

#### Language Testing
- [ ] Language selector appears on landing page
- [ ] Selecting language sets cookie
- [ ] Cookie persists after page reload
- [ ] Dashboard text changes to selected language
- [ ] Fallback to English for missing keys works
- [ ] RTL layout activates for Arabic
- [ ] All 12 languages render correctly

#### Responsive Testing
- [ ] Mobile (375px): All content fits, no horizontal scroll
- [ ] Tablet (768px): Layout adapts properly
- [ ] Desktop (1440px): Content centered, proper spacing
- [ ] Touch targets min 44px on mobile
- [ ] Sidebar collapses on mobile

#### Functional Testing
- [ ] Write Story button navigates correctly
- [ ] Quick actions all work
- [ ] Story cards display images correctly
- [ ] Status badges show correct colors
- [ ] SSE notifications still work
- [ ] Edit/Delete/Withdraw actions function

---

## Success Metrics

### Quantitative Metrics
1. **Zero production downtime** during deployment
2. **100% feature parity** with old version
3. **<2 second page load** for all dashboard pages
4. **<500ms language switch** time
5. **12 languages** fully supported
6. **Zero TypeScript errors** in build
7. **Zero console errors** in browser

### Qualitative Metrics
1. User can navigate dashboard intuitively
2. Design maintains Apple-style aesthetic
3. Text is readable in all languages
4. Mobile experience is smooth
5. No confusion between "My Stories" and "Library"

---

## Appendix A: Complete File Map

### Files to Create
```
/locales/translations.csv
/locales/en.json (generated)
/locales/ko.json (generated)
/locales/es.json (generated)
/locales/ar.json (generated)
/locales/hi.json (generated)
/locales/fr.json (generated)
/locales/de.json (generated)
/locales/ja.json (generated)
/locales/pt.json (generated)
/locales/ru.json (generated)
/locales/it.json (generated)
/locales/zh.json (generated)
/lib/i18n/csv-loader.ts
/lib/i18n/language-cookie.ts
/hooks/useTranslation.ts
/components/LanguageSelector.tsx
/app/dashboard/writer/page.tsx (NEW HOME)
```

### Files to Modify
```
/app/dashboard/writer/stories/page.tsx (OVERWRITE with current page.tsx)
/app/dashboard/writer/library/page.tsx (CHANGE data source)
/components/figma/layout/WriterLNB.tsx (UPDATE nav items)
/app/api/books/route.ts (ADD exclude filter)
/app/page.tsx (ADD language selector)
```

### Files to Delete
```
/app/dashboard/writer/stories/page.tsx (FIRST - before overwrite)
```

### Files to Preserve (No Changes)
```
/app/dashboard/writer/notifications/page.tsx
/app/dashboard/writer/submit-text/page.tsx
/app/dashboard/writer/story/[id]/page.tsx
/app/dashboard/writer/layout.tsx
/app/dashboard/writer/components/**/*
```

---

## Appendix B: Translation Key Inventory

### Required Translation Keys (Partial List)

```typescript
{
  dashboard: {
    writer: {
      home: {
        title: "Home",
        welcome: "Welcome back",
        stats: {
          total: "Total Stories",
          published: "Published",
          inReview: "In Review",
          readers: "Readers Reached"
        },
        quickActions: {
          title: "Quick Actions",
          writeNew: "Write New Story",
          viewLibrary: "View Library",
          myStories: "My Stories",
          notifications: "Notifications"
        },
        recentActivity: {
          title: "Recent Activity",
          published: "Published",
          feedback: "Feedback received",
          inReview: "In review"
        },
        achievements: {
          title: "Achievements",
          firstStory: "First Story",
          fivePublished: "5 Published",
          tenPublished: "10 Published"
        }
      },
      stories: {
        title: "My Stories",
        tabs: {
          draft: "Draft",
          pending: "Pending",
          review: "In Review",
          published: "Published",
          needsRevision: "Needs Revision"
        },
        empty: {
          title: "No stories yet",
          description: "Start your writing journey",
          cta: "Write Your First Story"
        }
      },
      library: {
        title: "Published Library",
        subtitle: "Explore stories by other writers",
        filters: {
          category: "Category",
          ageRange: "Age Range",
          language: "Language"
        }
      }
    }
  },
  nav: {
    home: "Home",
    myStories: "My Stories",
    library: "Library",
    writeStory: "Write Story",
    notifications: "Notifications"
  }
}
```

**Total Keys**: ~150-200

---

## Approval & Sign-off

**Prepared by**: Development Team
**Analysis by**: Plan Agent (Comprehensive Codebase Analysis)
**Status**: ✅ Ready for Autonomous Implementation
**Estimated Completion**: 20.5 hours
**Next Step**: Execute detailed to-do list in TodoWrite

---

**END OF PRD v2.0**
