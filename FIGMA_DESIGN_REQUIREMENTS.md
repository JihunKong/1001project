# Figma Design Implementation Requirements

## 📋 Overview

This document specifies all UI/UX requirements for implementing the **Story Publication** feature and **Landing Page Redesign** based on Figma designs and PRD requirements.

**Related Documents:**
- `docs/STORY_PUBLICATION_PRD.md` (main worktree) - Full PRD
- Figma Design Board: https://www.figma.com/design/nBZmnRMLxHhzS9Vl3bjmH8/1001-stories_Design-board?node-id=53-100

---

## 🎨 Section 1: Landing Page Redesign

### 1.1 Design Source
- **Figma URL**: https://www.figma.com/design/nBZmnRMLxHhzS9Vl3bjmH8/1001-stories_Design-board?node-id=53-100
- **Node ID**: 53-100
- **Priority**: ⭐ **HIGH** (Week 3)

### 1.2 Current Implementation
**File**: `/app/page.tsx`
- Uses `HomePage` component from `@/components/discovery/HomePage`
- Has A/B testing variants: default, hero_minimal, compact_grid
- Footer with 4 columns (Platform, Community, Support links)

### 1.3 Redesign Requirements

#### Hero Section
**Components to Update/Create:**
- Hero headline (large, bold typography)
- Sub-headline with platform value proposition
- Primary CTA button (Sign Up)
- Secondary CTA button (Explore Library)
- Hero background image/illustration

**Typography:**
```css
/* Hero Headline */
font-size: 48px (desktop), 32px (tablet), 24px (mobile)
font-weight: 700
line-height: 1.2

/* Sub-headline */
font-size: 20px (desktop), 18px (tablet), 16px (mobile)
font-weight: 400
line-height: 1.5
```

**CTA Buttons:**
- Primary: `bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg`
- Secondary: `border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg`

#### Feature Grid
**Components:**
- 3-column grid (desktop), 2-column (tablet), 1-column (mobile)
- Each feature card:
  - Icon (lucide-react)
  - Title (font-semibold text-lg)
  - Description (text-gray-600)
  - Optional CTA link

**Features to Highlight:**
1. **Global Storytelling** - Connect with stories from children worldwide
2. **AI-Enhanced Learning** - Word explanations, Q&A, content parsing
3. **Teacher Tools** - Assign books, track progress, manage classes
4. **Writer Community** - Submit stories, get feedback, publish

#### Social Proof Section
- Testimonials carousel (optional)
- Impact metrics (stories published, students reached, countries)
- Partner logos

#### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

### 1.4 Accessibility Requirements
- Semantic HTML tags (`<header>`, `<main>`, `<section>`, `<footer>`)
- ARIA labels for interactive elements
- Focus states for keyboard navigation
- Alt text for all images
- Color contrast ratio ≥ 4.5:1

### 1.5 Implementation Checklist
- [ ] Extract Figma design assets (images, icons)
- [ ] Create/update `HomePage` component
- [ ] Implement responsive grid layouts
- [ ] Add CTA button interactions
- [ ] Test on mobile/tablet/desktop
- [ ] Verify accessibility (a11y)
- [ ] Performance optimization (Lighthouse score ≥ 90)

---

## ✍️ Section 2: Story Publication UI - Writer View

### 2.1 Story Creation Form

**Route**: `/dashboard/writer/submit-text`
**Component**: `StorySubmissionForm` (new or update existing)

#### Form Fields
```typescript
interface StoryFormData {
  title: string;              // Required, max 200 chars
  content: string;            // Required, rich text editor
  language: string;           // Default: 'en'
  authorAlias?: string;       // Optional pseudonym
  summary: string;            // Required, max 500 chars
  ageRange?: string;          // Optional: "5-8", "9-12", "13+"
  category: string[];         // Multi-select
  tags: string[];             // Multi-select or input chips
}
```

#### Rich Text Editor
**Library**: Use existing editor or implement new (e.g., TipTap, Quill, Slate)

**Toolbar Features:**
- Bold, Italic, Underline
- Headings (H1, H2, H3)
- Lists (ordered, unordered)
- Links
- Block quotes
- Undo/Redo

**Auto-Save:**
- Save draft every 30 seconds
- Show "Last saved at [time]" indicator
- Prevent data loss on browser close (confirm dialog)

#### Form Actions
```
┌──────────────────────────────────────────────┐
│  [임시 저장]  [AI 리뷰 요청]  [최종 제출]      │
└──────────────────────────────────────────────┘
```

**Button States:**
- **임시 저장 (Save Draft)**: Always enabled, saves as 'Draft' status
- **AI 리뷰 요청 (Request AI Review)**: Enabled when title & content are filled, triggers AI review API
- **최종 제출 (Submit for Review)**: Enabled when content is complete, shows confirmation modal

### 2.2 AI Review Results Display

**Trigger**: After clicking "AI 리뷰 요청"

#### Loading State
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
  <span className="ml-2">AI가 스토리를 검토 중입니다...</span>
</div>
```

#### Results Display
```tsx
<div className="bg-white border rounded-lg p-6 space-y-4">
  <h3 className="text-lg font-semibold">AI 리뷰 결과</h3>

  {/* Grammar Check */}
  <div className="border-l-4 border-green-500 pl-4">
    <h4 className="font-medium">문법 점수: {score}/100</h4>
    <ul className="mt-2 space-y-1 text-sm text-gray-600">
      {suggestions.map(s => <li key={s}>• {s}</li>)}
    </ul>
  </div>

  {/* Structure Analysis */}
  <div className="border-l-4 border-blue-500 pl-4">
    <h4 className="font-medium">구조 분석: 기승전결</h4>
    <p className="text-sm text-gray-600">{structureAnalysis}</p>
  </div>

  {/* Accept/Dismiss Actions */}
  <div className="flex gap-2">
    <Button variant="outline" onClick={applyAllSuggestions}>
      모든 제안 적용
    </Button>
    <Button variant="ghost" onClick={dismissReview}>
      닫기
    </Button>
  </div>
</div>
```

### 2.3 Submission Confirmation Modal

**Trigger**: Click "최종 제출" button

```tsx
<Modal isOpen={showConfirmModal}>
  <ModalHeader>스토리 제출 확인</ModalHeader>
  <ModalBody>
    <p>작성한 스토리를 관리자 검토를 위해 제출하시겠습니까?</p>
    <p className="mt-2 text-sm text-gray-600">
      제출 후에는 수정할 수 없으며, 관리자의 피드백을 기다려야 합니다.
    </p>

    {/* Copyright Confirmation */}
    <label className="mt-4 flex items-start gap-2">
      <input type="checkbox" checked={copyrightConfirmed} onChange={...} />
      <span className="text-sm">
        이 스토리는 본인의 창작물이며, 1001 Stories 플랫폼에 사용 권한을 부여합니다.
      </span>
    </label>
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={closeModal}>취소</Button>
    <Button
      variant="primary"
      disabled={!copyrightConfirmed}
      onClick={handleSubmit}
    >
      제출
    </Button>
  </ModalFooter>
</Modal>
```

### 2.4 "My Stories" Dashboard

**Route**: `/dashboard/writer/stories`

#### Layout
```
┌────────────────────────────────────────────────────────────┐
│  내가 쓴 스토리                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [전체] [Draft] [Pending Review] [Under Revision]    │  │
│  │  [Approved] [Published]                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │  스토리 제목          │  │  스토리 제목          │      │
│  │  상태: Draft          │  │  상태: Published     │      │
│  │  최종 수정: 2시간 전   │  │  출판일: 2024-10-01   │      │
│  │  [수정] [삭제]        │  │  [보기]              │      │
│  └──────────────────────┘  └──────────────────────┘      │
│                                                            │
│  [+ 새 스토리 작성]                                         │
└────────────────────────────────────────────────────────────┘
```

#### Story Card Component
```tsx
<div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
  <h3 className="text-lg font-semibold line-clamp-2">{story.title}</h3>

  {/* Status Badge */}
  <Badge variant={statusVariant}>{status}</Badge>

  {/* Metadata */}
  <div className="text-sm text-gray-600 mt-2">
    <p>최종 수정: {formatRelativeTime(story.updatedAt)}</p>
    {story.status === 'NEEDS_REVISION' && (
      <p className="text-orange-600">
        관리자 피드백 있음 - <Link href={`/dashboard/writer/story/${story.id}`}>확인하기</Link>
      </p>
    )}
  </div>

  {/* Actions */}
  <div className="flex gap-2 mt-4">
    {story.status === 'DRAFT' || story.status === 'NEEDS_REVISION' ? (
      <>
        <Button size="sm" onClick={editStory}>수정</Button>
        <Button size="sm" variant="ghost" onClick={deleteStory}>삭제</Button>
      </>
    ) : (
      <Button size="sm" variant="outline" onClick={viewStory}>보기</Button>
    )}
  </div>
</div>
```

#### Status Badge Colors
```tsx
const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  STORY_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
  NEEDS_REVISION: { label: 'Needs Revision', color: 'bg-orange-100 text-orange-800' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  PUBLISHED: { label: 'Published', color: 'bg-purple-100 text-purple-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
};
```

---

## 👨‍💼 Section 3: Story Publication UI - Admin View

### 3.1 Review Queue Interface

**Routes:**
- STORY_MANAGER: `/dashboard/story-manager/review`
- BOOK_MANAGER: `/dashboard/book-manager/review`
- CONTENT_ADMIN: `/dashboard/content-admin/review`

#### Layout
```
┌────────────────────────────────────────────────────────────┐
│  검토 대기 중인 스토리 (12)                                   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [우선순위: 높음] [제출일: 최신순] [작가: 전체]        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⚠️ 고우선순위 - 제출 7일 경과                          │  │
│  │  제목: "어린 왕자의 여행"                               │  │
│  │  작가: writer_alias_123                               │  │
│  │  제출일: 2024-10-09                                    │  │
│  │  카테고리: Fantasy, Adventure                          │  │
│  │  [검토하기]                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  제목: "바다 속 친구들"                                 │  │
│  │  작가: ocean_writer                                   │  │
│  │  제출일: 2024-10-14                                    │  │
│  │  [검토하기]                                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Story Review Screen

**Route**: `/dashboard/story-manager/review/[id]`

#### Layout Components
```
┌────────────────────────────────────────────────────────────┐
│  ← 목록으로                              [승인] [수정 요청]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  제목: 어린 왕자의 여행                                      │
│  작가: writer_alias_123                                    │
│  제출일: 2024-10-09                                         │
│  카테고리: Fantasy, Adventure                               │
│                                                            │
│  ─────────────────────────────────────                    │
│                                                            │
│  [스토리 내용]                                              │
│  Lorem ipsum dolor sit amet, consectetur adipiscing        │
│  elit. Sed do eiusmod tempor incididunt ut labore et       │
│  dolore magna aliqua...                                    │
│                                                            │
│  [인라인 코멘트 마커 ⓘ]                                      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  💬 코멘트 (3)                                             │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  reviewer_admin • 2024-10-10                       │    │
│  │  첫 문단의 서술이 매우 좋습니다.                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  [새 코멘트 작성...]                                        │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Inline Comment System

**Implementation**: Use a library like **TipTap** or **Draft.js** with comment annotations

#### Comment Marker
```tsx
<span className="bg-yellow-200 cursor-pointer relative" onClick={showCommentPopup}>
  [Selected Text]
  <CommentIcon className="ml-1 h-4 w-4" />
</span>
```

#### Comment Popup
```tsx
<Popover>
  <PopoverTrigger>
    <span className="bg-yellow-200">[Highlighted Text]</span>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <p className="font-medium">reviewer_admin</p>
      <p className="text-sm">이 부분의 표현을 더 명확히 해주세요.</p>
      <Button size="sm" variant="ghost">답변</Button>
    </div>
  </PopoverContent>
</Popover>
```

### 3.4 Revision Request Form

**Trigger**: Click "수정 요청" button

```tsx
<Modal isOpen={showRevisionModal}>
  <ModalHeader>수정 요청</ModalHeader>
  <ModalBody>
    <label>
      <span className="font-medium">수정 요청 사유 *</span>
      <Textarea
        placeholder="작가에게 전달할 수정 요청 내용을 상세히 작성해주세요."
        rows={6}
        value={revisionNotes}
        onChange={(e) => setRevisionNotes(e.target.value)}
      />
    </label>

    {/* Priority */}
    <label className="mt-4">
      <span className="font-medium">우선순위</span>
      <Select value={priority} onChange={setPriority}>
        <option value="LOW">낮음</option>
        <option value="MEDIUM">보통</option>
        <option value="HIGH">높음</option>
        <option value="URGENT">긴급</option>
      </Select>
    </label>
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={closeModal}>취소</Button>
    <Button variant="primary" onClick={requestRevision}>요청</Button>
  </ModalFooter>
</Modal>
```

### 3.5 Approve/Reject Actions

#### Approve Modal
```tsx
<Modal isOpen={showApproveModal}>
  <ModalHeader>스토리 승인</ModalHeader>
  <ModalBody>
    <p>이 스토리를 승인하시겠습니까?</p>
    <p className="mt-2 text-sm text-gray-600">
      승인 후 Book Manager가 출판 형식을 결정하게 됩니다.
    </p>
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={closeModal}>취소</Button>
    <Button variant="success" onClick={approveStory}>승인</Button>
  </ModalFooter>
</Modal>
```

#### Reject Modal
```tsx
<Modal isOpen={showRejectModal}>
  <ModalHeader>스토리 반려</ModalHeader>
  <ModalBody>
    <label>
      <span className="font-medium">반려 사유 *</span>
      <Textarea
        placeholder="반려 사유를 상세히 작성해주세요."
        rows={4}
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
      />
    </label>
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={closeModal}>취소</Button>
    <Button variant="danger" onClick={rejectStory}>반려</Button>
  </ModalFooter>
</Modal>
```

---

## 📷 Section 4: Image Upload (Optional)

### 4.1 Image Upload Interface

**Route**: `/dashboard/writer/story/[id]/images` or integrated in main form

#### Drag & Drop Area
```tsx
<div
  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
  onDrop={handleDrop}
  onDragOver={handleDragOver}
>
  <Upload className="mx-auto h-12 w-12 text-gray-400" />
  <p className="mt-2 text-sm text-gray-600">
    이미지를 드래그하거나 클릭하여 업로드
  </p>
  <input
    type="file"
    accept="image/*"
    multiple
    className="hidden"
    ref={fileInputRef}
    onChange={handleFileSelect}
  />
  <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
    파일 선택
  </Button>
</div>
```

#### Image Preview Grid
```tsx
<div className="grid grid-cols-3 gap-4 mt-4">
  {images.map(img => (
    <div key={img.id} className="relative">
      <img src={img.url} alt={img.alt} className="rounded-lg" />
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-1 right-1"
        onClick={() => removeImage(img.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  ))}
</div>
```

---

## 📱 Section 5: Responsive Design Guidelines

### 5.1 Breakpoints
```css
/* Tailwind CSS default breakpoints */
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large screens */
```

### 5.2 Component Adaptations

#### Navigation
- Mobile: Hamburger menu
- Tablet: Collapsed sidebar
- Desktop: Full sidebar

#### Story Card Grid
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

#### Form Layouts
- Mobile: Single column, full width
- Tablet: Single column, max-width
- Desktop: Two columns (form left, preview right)

### 5.3 Touch Interactions
- Minimum button size: 44x44px (touch-friendly)
- Adequate spacing between interactive elements
- Swipeable modals on mobile

---

## 🎯 Section 6: Implementation Priorities

### Phase 1 (Week 3) - High Priority
1. ✅ Landing Page Redesign
2. ✅ Writer Story Creation Form
3. ✅ "My Stories" Dashboard

### Phase 2 (Week 4) - Medium Priority
4. ✅ Admin Review Queue
5. ✅ Story Review Screen
6. ✅ Inline Comment System

### Phase 3 (Optional) - Low Priority
7. ⚪ Image Upload Interface
8. ⚪ Advanced Filters (search, sort)
9. ⚪ Story Analytics Dashboard

---

## ✅ Testing Checklist

### Functional Testing
- [ ] Story creation form saves drafts automatically
- [ ] AI review request triggers correctly
- [ ] Submission confirmation modal works
- [ ] Status filters in "My Stories" work
- [ ] Admin can request revision
- [ ] Inline comments save and display correctly
- [ ] Approve/reject actions update status

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Testing
- [ ] iPhone SE (375px)
- [ ] iPad (768px)
- [ ] MacBook (1280px)
- [ ] Large Desktop (1920px)

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus states visible

### Performance Testing
- [ ] Lighthouse score ≥ 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Images optimized (WebP, lazy loading)

---

## 📚 Component Library

### UI Components to Create/Update
```
components/
├── story-publication/
│   ├── StorySubmissionForm.tsx      # Main creation form
│   ├── AIReviewResults.tsx          # AI review display
│   ├── StoryCard.tsx                # Story list item
│   ├── StatusBadge.tsx              # Status indicator
│   ├── SubmissionModal.tsx          # Confirmation dialog
│   ├── ReviewQueue.tsx              # Admin queue view
│   ├── InlineCommentMarker.tsx      # Highlight + comment
│   ├── RevisionRequestForm.tsx      # Revision modal
│   └── ImageUploadZone.tsx          # Drag & drop upload
├── discovery/
│   └── HomePage.tsx                 # Landing page (update)
└── ui/
    ├── Button.tsx
    ├── Modal.tsx
    ├── Badge.tsx
    ├── Textarea.tsx
    ├── Select.tsx
    └── Popover.tsx
```

---

## 🚀 Getting Started

### 1. Setup Development Environment
```bash
cd /Users/jihunkong/1001project/figma-design
npm install
npm run dev
```

### 2. Extract Figma Assets
- Download images from Figma (node-id: 53-100)
- Save to `/public/images/landing/`
- Optimize images (use next/image)

### 3. Create Components
- Start with atomic components (buttons, badges)
- Build up to composite components (forms, cards)
- Test in isolation (Storybook optional)

### 4. Integration with Backend
- Requires API endpoints from workflow-implementation worktree
- Use mock data during development
- Switch to real APIs after merge

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Owner**: UI/UX Team
**Status**: Ready for Implementation
