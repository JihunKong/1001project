# Volunteer Page Redesign Plan

## Executive Summary

This document outlines a comprehensive redesign plan for the volunteer dashboard pages based on the Figma design system at `https://www.figma.com/design/AlPzpkP4Ylua6OmtfdfDe7/1001-stories_publishing?node-id=0-1`.

The redesign aligns with the "01. Writer's flow" → "Publishing (Student)" design while maintaining all existing functionality and improving user experience through consistent design patterns.

---

## Current State Analysis

### Existing Pages
1. **Main Dashboard** (`/dashboard/volunteer/page.tsx` - 459 lines)
2. **Submit Text** (`/dashboard/volunteer/submit-text/page.tsx` - 101 lines)
3. **Library** (`/dashboard/volunteer/library/page.tsx` - 499 lines)
4. **Notifications** (`/dashboard/volunteer/notifications/page.tsx` - 61 lines)

### Key Components
- `FlowProgressIndicator` (484 lines) - Writer's journey visualization
- `StoryStatusCard` (504 lines) - Individual story cards
- `TextSubmissionForm` (543 lines) - Story submission form
- `DashboardStatsCard` - Statistics cards
- `NotificationCenter` - Notification system

---

## Figma Design System Analysis

### Layout Components

#### 1. LNB (Left Navigation Bar)
- **Dimensions**: 240×1007px
- **Structure**:
  ```
  Navigation Items:
  - Home (with Home icon, Size=20)
  - Library (with Bookmark icon)
  - Profile (with User icon)
  - Stories (with File text icon) - Currently active
  ```
- **Design Details**:
  - Active state: Bold text (#141414)
  - Inactive state: Regular text (#8E8E93)
  - Icon size: 20px
  - Spacing: Vertical list with consistent padding

#### 2. GNB (Global Navigation Bar)
- **Dimensions**: 1920px wide × variable height
- **Layout**: Horizontal flex with space-between
- **Padding**: 15px 40px
- **Border**: Bottom 1px solid #E5E5EA
- **Elements**: Logo, user info, notifications, settings

#### 3. Main Content Area
- **Background**: #FFFFFF
- **Max Width**: Responsive with proper margins
- **Padding**: Consistent 24px-40px based on breakpoint

### Typography System

```css
/* Primary Text Styles */
Title/Title03:
  font-family: Helvetica Neue
  font-size: 24px
  font-weight: 500
  line-height: 1.221

Body/Body03:
  font-family: Helvetica Neue
  font-size: 18px
  font-weight: 400
  line-height: 1.193

Body/Body04:
  font-family: Helvetica Neue
  font-size: 16px
  font-weight: 400
  line-height: 1.193
```

### Color Palette

```css
/* Base Colors */
--color-white: #FFFFFF
--color-black: #141414
--color-gray-inactive: #8E8E93
--color-gray-border: #E5E5EA
--color-gray-border-alt: #E4E4E4
--color-gray-bg: #73757C
--color-active: #33363F

/* Status Colors (from existing system) */
--color-soe-green: #10B981 (keep existing)
--color-soe-purple: #8B5CF6 (keep existing)
--color-soe-yellow: #F59E0B (keep existing)
```

### Component Patterns

#### Buttons
- **Large Button (Rec_Large)**:
  - Height: 48px
  - Padding: 12px 24px
  - Border-radius: 8px
  - Font-size: 16px, Font-weight: 500

- **Small Button (Rec_small)**:
  - Height: 36px
  - Padding: 8px 16px
  - Border-radius: 6px
  - Font-size: 14px, Font-weight: 500

#### Status Badges
- Rounded-full or rounded-lg (8px)
- Padding: 6px 12px
- Font-size: 12px-14px
- Icon + Text combination

---

## Page-by-Page Redesign Plan

### 1. Main Dashboard Redesign

**File**: `app/dashboard/volunteer/page.tsx`

**Current Structure**:
```tsx
- Real-time SSE notifications
- FlowProgressIndicator
- DashboardStatsCard (4 cards)
- Workflow insights
- Achievements
- StoryStatusCard grid
```

**Redesign Changes**:

#### A. Layout Restructure
```tsx
<div className="flex min-h-screen bg-gray-50">
  {/* LNB - Left Navigation */}
  <VolunteerLNB activeItem="home" />

  {/* Main Content */}
  <div className="flex-1">
    {/* GNB - Global Navigation */}
    <GlobalNavigationBar />

    {/* Content Area */}
    <main className="p-6 lg:p-10">
      {/* Workflow Progress - Redesigned */}
      <EnhancedFlowProgress />

      {/* Stats Grid - Redesigned */}
      <StatsGrid />

      {/* Current Text for Publishing Workflow */}
      <WorkflowSection />

      {/* Your Stories Grid */}
      <StoriesGrid />
    </main>
  </div>
</div>
```

#### B. New Components to Create

**`VolunteerLNB.tsx`** (NEW)
```tsx
- Fixed left sidebar (240px wide)
- Navigation items: Home, Library, Profile, Stories
- Active state highlighting
- Responsive: Collapse to icons on mobile
```

**`GlobalNavigationBar.tsx`** (NEW or UPDATE)
```tsx
- Full-width top bar
- 1001 Stories logo
- User info dropdown
- Notification bell with badge
- Settings icon
- Border-bottom: 1px #E5E5EA
```

**`EnhancedFlowProgress.tsx`** (REDESIGN)
```tsx
// Based on FlowProgressIndicator but with Figma design
- Cleaner visual design
- Larger icons (24px instead of 16px)
- Better spacing (use Figma measurements)
- Typography: Title/Title03 for headers
- Typography: Body/Body04 for descriptions
```

**`StatsGrid.tsx`** (REDESIGN)
```tsx
// Replace DashboardStatsCard with Figma-aligned design
Grid layout:
- 4 cards on desktop (could expand to 5 like Library page)
- 2 cards on tablet
- 1 card on mobile

Card design:
- White background (#FFFFFF)
- Border: 1px solid #E5E5EA
- Border-radius: 12px
- Padding: 24px
- Hover: subtle shadow
```

**`WorkflowSection.tsx`** (NEW)
```tsx
// "Current Text for Publishing Workflow" section from Figma
- Shows active submissions in workflow
- Quick action buttons
- Status visualization
```

**`StoriesGrid.tsx`** (REDESIGN)
```tsx
// Redesigned StoryStatusCard grid
- Grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- Gap: 24px
- Card design matches Figma status components
```

#### C. Typography Updates
```tsx
// Page Title
<h1 className="text-[24px] font-medium leading-[1.221] text-[#141414]">
  Writer's Dashboard
</h1>

// Section Headers
<h2 className="text-[18px] font-normal leading-[1.193] text-[#141414]">
  Your Stories
</h2>

// Body Text
<p className="text-[16px] font-normal leading-[1.193] text-[#8E8E93]">
  Track your submission progress
</p>
```

#### D. Color Updates
- Replace generic grays with Figma colors (#8E8E93, #E5E5EA)
- Keep existing brand colors (soe-green, soe-purple, soe-yellow)
- Use #141414 for primary text
- Use #8E8E93 for secondary/inactive text

---

### 2. Submit Text Page Redesign

**File**: `app/dashboard/volunteer/submit-text/page.tsx`

**Current Structure**:
```tsx
- Back navigation
- Guidelines section
- TextSubmissionForm component
- Review process overview
```

**Redesign Changes**:

#### A. Layout Restructure
```tsx
<div className="flex min-h-screen bg-gray-50">
  {/* LNB */}
  <VolunteerLNB activeItem="stories" />

  <div className="flex-1">
    {/* GNB */}
    <GlobalNavigationBar />

    {/* Content */}
    <main className="p-6 lg:p-10">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header */}
      <PageHeader
        title="Upload a Story"
        subtitle="Share your story with the world"
      />

      {/* Form Container */}
      <div className="max-w-4xl mx-auto">
        <RedesignedTextSubmissionForm />
      </div>
    </main>
  </div>
</div>
```

#### B. Form Redesign

**`RedesignedTextSubmissionForm.tsx`** (MAJOR UPDATE)

**Visual Changes**:
```tsx
// Step Indicator at Top
<FormStepIndicator currentStep={1} totalSteps={3} />

// Steps:
// 1. Basic Info (title, author, age range, reading level)
// 2. Story Content (rich text editor)
// 3. Review & Submit (summary, categories, tags, copyright)

// Form Fields Styling
Input fields:
- Height: 48px (match Figma Rec_Large)
- Border: 1px solid #E5E5EA
- Border-radius: 8px
- Focus border: #141414
- Padding: 12px 16px
- Font-size: 16px
- Placeholder color: #8E8E93

Textarea:
- Min-height: 120px
- Same border/padding as inputs

Rich Text Editor:
- Toolbar: redesigned with Figma button styles
- Min-height: 400px
- Border: 1px solid #E5E5EA
- Border-radius: 12px
```

**Button Updates**:
```tsx
// Primary Button (Submit for Review)
<button className="
  h-12 px-6
  bg-gradient-to-r from-soe-green-500 to-soe-green-600
  text-white font-medium text-[16px]
  rounded-lg
  hover:from-soe-green-600 hover:to-soe-green-700
  focus:ring-4 focus:ring-soe-green-300
  transition-all duration-200
">
  Submit for Review
</button>

// Secondary Button (Save as Draft)
<button className="
  h-12 px-6
  bg-white text-[#141414] font-medium text-[16px]
  border border-[#E5E5EA]
  rounded-lg
  hover:bg-gray-50
  focus:ring-4 focus:ring-gray-200
  transition-all duration-200
">
  Save as Draft
</button>
```

**Category/Tag Selection**:
```tsx
// Redesigned category buttons
Categories:
- Display as pill-shaped buttons
- Inactive: white bg, #E5E5EA border, #141414 text
- Active: soe-purple bg, white text
- Height: 36px
- Padding: 8px 16px
- Border-radius: 18px (fully rounded)
- Font-size: 14px

Tags:
- Same style as categories
- Add button matches Figma small button design
- Tag removal: X icon on right side
```

**Copyright Section**:
```tsx
// Redesigned as expandable card
<div className="
  bg-white
  border border-[#E5E5EA]
  rounded-xl
  p-6
">
  <h3 className="text-[18px] font-medium text-[#141414] mb-4">
    Terms & Disclosures
  </h3>

  {/* Checkbox styling */}
  <label className="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" className="
      mt-1 w-5 h-5
      rounded border-[#E5E5EA]
      text-soe-green-500
      focus:ring-soe-green-300
    " />
    <span className="text-[16px] text-[#141414]">
      I confirm this is my original work...
    </span>
  </label>
</div>
```

---

### 3. Library Page Redesign

**File**: `app/dashboard/volunteer/library/page.tsx`

**Current Structure**:
```tsx
- Stats overview (5 cards)
- Search, filter, sort toolbar
- Submissions grid
- Timeline modal
```

**Redesign Changes**:

#### A. Layout Restructure
```tsx
<div className="flex min-h-screen bg-gray-50">
  {/* LNB */}
  <VolunteerLNB activeItem="library" />

  <div className="flex-1">
    {/* GNB */}
    <GlobalNavigationBar />

    <main className="p-6 lg:p-10">
      {/* Page Header with Action */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-medium text-[#141414]">
            My Library
          </h1>
          <p className="text-[16px] text-[#8E8E93] mt-1">
            Manage and track all your story submissions
          </p>
        </div>

        <button className="Figma-Large-Button">
          <Plus className="w-5 h-5 mr-2" />
          New Story
        </button>
      </div>

      {/* Stats Grid - Redesigned */}
      <RedesignedStatsGrid />

      {/* Toolbar - Redesigned */}
      <RedesignedToolbar />

      {/* Stories Grid - Redesigned */}
      <RedesignedStoriesGrid />
    </main>
  </div>
</div>
```

#### B. Component Updates

**`RedesignedStatsGrid.tsx`**:
```tsx
// 5 cards: Total, Drafts, In Review, Published, Needs Action
Card design:
- White background
- Border: 1px solid #E5E5EA
- Border-radius: 12px
- Padding: 20px
- Hover: border color #141414

Card content:
- Large number: text-[32px] font-medium #141414
- Label: text-[14px] #8E8E93
- Icon: 24×24px, positioned top-right
```

**`RedesignedToolbar.tsx`**:
```tsx
<div className="
  bg-white
  border border-[#E5E5EA]
  rounded-xl
  p-4
  mb-6
">
  <div className="flex flex-wrap gap-4 items-center">
    {/* Search Input */}
    <div className="relative flex-1 min-w-[240px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2
        w-5 h-5 text-[#8E8E93]" />
      <input
        type="text"
        placeholder="Search stories..."
        className="
          w-full h-12 pl-10 pr-4
          border border-[#E5E5EA]
          rounded-lg
          text-[16px]
          focus:border-[#141414]
          focus:ring-0
        "
      />
    </div>

    {/* Filter Dropdown */}
    <select className="
      h-12 px-4
      border border-[#E5E5EA]
      rounded-lg
      text-[16px] text-[#141414]
      bg-white
    ">
      <option>All Status</option>
      {/* ... */}
    </select>

    {/* Sort Dropdown */}
    <select className="h-12 px-4 ...">
      <option>Sort by Date</option>
      {/* ... */}
    </select>
  </div>
</div>
```

**`RedesignedStoriesGrid.tsx`**:
```tsx
// Grid layout
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
  {stories.map(story => (
    <RedesignedStoryCard key={story.id} story={story} />
  ))}
</div>

// Card design (RedesignedStoryCard)
<div className="
  bg-white
  border border-[#E5E5EA]
  rounded-xl
  p-6
  hover:border-[#141414]
  hover:shadow-lg
  transition-all duration-200
">
  {/* Header */}
  <div className="flex items-start justify-between mb-4">
    <h3 className="text-[18px] font-medium text-[#141414] flex-1">
      {story.title}
    </h3>

    {/* Status Badge */}
    <StatusBadge status={story.status} />
  </div>

  {/* Metadata */}
  <div className="flex items-center gap-4 text-[14px] text-[#8E8E93] mb-3">
    <span>{formatDate(story.updatedAt)}</span>
    <span>•</span>
    <span>{story.wordCount} words</span>
  </div>

  {/* Progress Bar */}
  <ProgressBar progress={getProgress(story.status)} />

  {/* Actions */}
  <div className="flex gap-2 mt-4">
    {renderActionButtons(story)}
  </div>
</div>
```

**`StatusBadge.tsx`** (REDESIGN):
```tsx
// Match Figma status component design
const statusStyles = {
  DRAFT: {
    bg: '#F5F5F5',
    text: '#141414',
    border: '#E5E5EA'
  },
  PENDING: {
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FCD34D'
  },
  // ... other statuses
};

<span className={`
  inline-flex items-center gap-2
  px-3 py-1.5
  rounded-lg
  text-[12px] font-medium
  border
`} style={{
  backgroundColor: statusStyles[status].bg,
  color: statusStyles[status].text,
  borderColor: statusStyles[status].border
}}>
  <StatusIcon className="w-3 h-3" />
  {statusLabel}
</span>
```

---

### 4. Notifications Page Redesign

**File**: `app/dashboard/volunteer/notifications/page.tsx`

**Redesign Changes**:

```tsx
<div className="flex min-h-screen bg-gray-50">
  {/* LNB */}
  <VolunteerLNB activeItem="home" />

  <div className="flex-1">
    {/* GNB */}
    <GlobalNavigationBar />

    <main className="p-6 lg:p-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-[#141414]">
          All Notifications
        </h1>
        <p className="text-[16px] text-[#8E8E93] mt-1">
          Stay updated on your story progress
        </p>
      </div>

      {/* Notification Center - Redesigned */}
      <RedesignedNotificationCenter />
    </main>
  </div>
</div>
```

**`RedesignedNotificationCenter.tsx`**:
```tsx
// Notification item design
<div className="
  bg-white
  border border-[#E5E5EA]
  rounded-xl
  p-4
  hover:bg-gray-50
  transition-colors
">
  <div className="flex items-start gap-4">
    {/* Icon */}
    <div className="
      w-10 h-10
      rounded-full
      bg-soe-green-100
      flex items-center justify-center
      flex-shrink-0
    ">
      <BellIcon className="w-5 h-5 text-soe-green-600" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className="text-[16px] text-[#141414] mb-1">
        {notification.title}
      </p>
      <p className="text-[14px] text-[#8E8E93]">
        {notification.message}
      </p>
      <time className="text-[12px] text-[#8E8E93] mt-2 block">
        {formatTime(notification.createdAt)}
      </time>
    </div>

    {/* Unread indicator */}
    {!notification.read && (
      <div className="w-2 h-2 rounded-full bg-soe-green-500" />
    )}
  </div>
</div>
```

---

## Component Migration Strategy

### Phase 1: Foundation Components (Week 1)

1. **Create New Layout Components**
   - [ ] `VolunteerLNB.tsx` - Left navigation bar
   - [ ] `GlobalNavigationBar.tsx` - Top navigation bar
   - [ ] Update `tailwind.config.ts` with Figma colors

2. **Update Base Components**
   - [ ] `StatusBadge.tsx` - Redesign with Figma styles
   - [ ] Create `Button.tsx` - Figma button variants
   - [ ] Create `Card.tsx` - Figma card pattern

### Phase 2: Dashboard Components (Week 2)

3. **Main Dashboard**
   - [ ] `EnhancedFlowProgress.tsx` - Redesigned flow indicator
   - [ ] `StatsGrid.tsx` - Redesigned stats cards
   - [ ] `WorkflowSection.tsx` - Current workflow section
   - [ ] `StoriesGrid.tsx` - Redesigned story cards

4. **Update Main Dashboard Page**
   - [ ] Integrate new layout (LNB + GNB)
   - [ ] Replace old components with redesigned versions
   - [ ] Test responsive behavior

### Phase 3: Form & Library (Week 3)

5. **Submit Text Page**
   - [ ] `FormStepIndicator.tsx` - Multi-step form indicator
   - [ ] `RedesignedTextSubmissionForm.tsx` - Update form design
   - [ ] Update page layout with LNB + GNB

6. **Library Page**
   - [ ] `RedesignedToolbar.tsx` - Search/filter/sort toolbar
   - [ ] `RedesignedStoryCard.tsx` - Story card for grid
   - [ ] `TimelineModal.tsx` - Update timeline modal design
   - [ ] Update page layout

### Phase 4: Polish & Testing (Week 4)

7. **Notifications Page**
   - [ ] `RedesignedNotificationCenter.tsx`
   - [ ] Update page layout

8. **Final Polish**
   - [ ] Cross-browser testing
   - [ ] Mobile responsiveness verification
   - [ ] Accessibility audit
   - [ ] Performance optimization
   - [ ] Documentation updates

---

## Design System Implementation

### Tailwind Config Updates

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        figma: {
          black: '#141414',
          'gray-inactive': '#8E8E93',
          'gray-border': '#E5E5EA',
          'gray-border-alt': '#E4E4E4',
          'gray-bg': '#73757C',
          'active': '#33363F',
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'figma-title-03': ['24px', { lineHeight: '1.221' }],
        'figma-body-03': ['18px', { lineHeight: '1.193' }],
        'figma-body-04': ['16px', { lineHeight: '1.193' }],
      },
      borderRadius: {
        'figma-lg': '12px',
        'figma-md': '8px',
        'figma-sm': '6px',
      },
      spacing: {
        'lnb': '240px', // LNB width
      }
    }
  }
}
```

### Reusable Components Library

Create `/components/figma/` directory for Figma-aligned components:

```
components/
  figma/
    layout/
      VolunteerLNB.tsx
      GlobalNavigationBar.tsx
      MainLayout.tsx
    ui/
      Button.tsx           # Large/Small variants
      Card.tsx             # Base card pattern
      StatusBadge.tsx      # Status indicators
      Input.tsx            # Form inputs
      Select.tsx           # Dropdowns
      Checkbox.tsx         # Checkboxes
    feedback/
      ProgressBar.tsx      # Linear progress
      LoadingSpinner.tsx   # Loading states
      Toast.tsx            # Notifications
```

---

## Mobile Responsive Strategy

### Breakpoints
```css
/* Tailwind defaults + custom */
sm: 640px   - Mobile landscape
md: 768px   - Tablet portrait
lg: 1024px  - Tablet landscape / Small desktop
xl: 1280px  - Desktop
2xl: 1536px - Large desktop
```

### LNB Mobile Behavior
```tsx
// Desktop (lg+): Fixed 240px sidebar
// Mobile (<lg): Collapsible overlay or bottom navigation

<VolunteerLNB
  mode="desktop"  // Fixed sidebar
  className="hidden lg:block"
/>

<MobileBottomNav
  className="lg:hidden fixed bottom-0 left-0 right-0"
/>
```

### Content Area Adjustments
```tsx
// Desktop: Full width minus LNB
<main className="lg:ml-[240px] p-6 lg:p-10">

// Mobile: Full width with bottom nav spacing
<main className="p-4 pb-20 lg:pb-10">
```

---

## Accessibility Improvements

### ARIA Labels
```tsx
// LNB Navigation
<nav aria-label="Main navigation" role="navigation">
  <a
    href="/dashboard/volunteer"
    aria-current={isActive ? "page" : undefined}
    className={...}
  >
    Home
  </a>
</nav>

// Status Badge
<span
  role="status"
  aria-label={`Story status: ${statusLabel}`}
  className={...}
>
  {statusLabel}
</span>
```

### Keyboard Navigation
```tsx
// Focusable elements with visible focus rings
<button className="
  focus:outline-none
  focus:ring-4
  focus:ring-soe-green-300
  transition-all
">
```

### Color Contrast
- Ensure all text meets WCAG AA standards (4.5:1 for normal text)
- #141414 on #FFFFFF: 14.77:1 ✅
- #8E8E93 on #FFFFFF: 4.54:1 ✅
- Test all status badge combinations

---

## Performance Optimizations

### Code Splitting
```tsx
// Lazy load heavy components
const TimelineModal = dynamic(
  () => import('@/components/modals/TimelineModal'),
  { ssr: false }
);

const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);
```

### Image Optimization
```tsx
// Use Next.js Image for all images
import Image from 'next/image';

<Image
  src={iconSrc}
  alt={altText}
  width={20}
  height={20}
  className="..."
/>
```

### Bundle Size Reduction
- Remove unused Lucide icons
- Tree-shake CSS with PurgeCSS (built into Tailwind)
- Minimize third-party dependencies

---

## Testing Strategy

### Visual Regression Testing
```bash
# Use Playwright for screenshot comparison
npx playwright test tests/volunteer-redesign/ --update-snapshots
```

### Component Testing
```tsx
// Example: VolunteerLNB.test.tsx
describe('VolunteerLNB', () => {
  it('renders all navigation items', () => {
    render(<VolunteerLNB activeItem="home" />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
  });

  it('highlights active item', () => {
    render(<VolunteerLNB activeItem="library" />);
    const libraryItem = screen.getByText('Library');
    expect(libraryItem).toHaveClass('font-medium', 'text-[#141414]');
  });
});
```

### E2E Testing
```bash
# Test complete flows with redesigned pages
npx playwright test tests/volunteer-workflow.spec.ts
```

---

## Migration Checklist

### Pre-Migration
- [ ] Review and approve Figma designs with stakeholders
- [ ] Set up Figma-to-code pipeline (if needed)
- [ ] Create design system documentation
- [ ] Set up feature flag for gradual rollout

### During Migration
- [ ] Create feature branch: `feature/volunteer-redesign`
- [ ] Implement Phase 1 components
- [ ] Implement Phase 2 components
- [ ] Implement Phase 3 components
- [ ] Implement Phase 4 polish
- [ ] Run full test suite
- [ ] Conduct accessibility audit
- [ ] Performance benchmarking

### Post-Migration
- [ ] Deploy to staging environment
- [ ] Stakeholder review and approval
- [ ] User acceptance testing (UAT)
- [ ] Monitor error rates and performance
- [ ] Gather user feedback
- [ ] Deploy to production with feature flag
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Remove old code after successful rollout

---

## Risk Mitigation

### Potential Risks
1. **Breaking Changes**: Old components might be used elsewhere
   - Mitigation: Create new components with different names, deprecate old ones gradually

2. **Performance Degradation**: New designs might be heavier
   - Mitigation: Implement code splitting, lazy loading, and monitor bundle size

3. **User Confusion**: Sudden design change might confuse users
   - Mitigation: Add tooltips, guided tours, and optional "What's New" modal

4. **Mobile Responsiveness Issues**: Complex designs might not scale well
   - Mitigation: Test on multiple devices, implement mobile-first approach

5. **Accessibility Regressions**: New designs might introduce a11y issues
   - Mitigation: Run automated a11y tests, conduct manual keyboard navigation tests

---

## Success Metrics

### Quantitative Metrics
- **Page Load Time**: Should not increase by more than 10%
- **Time to Interactive (TTI)**: Target < 3 seconds on 4G
- **Bundle Size**: Should not increase by more than 15%
- **Accessibility Score**: Maintain 100/100 on Lighthouse
- **User Task Completion Time**: Should decrease by 10-15%

### Qualitative Metrics
- User feedback surveys (NPS score)
- Support ticket volume (should decrease)
- User engagement metrics (time on page, actions per session)

---

## Timeline

### Week 1: Foundation
- Day 1-2: Set up Tailwind config, create base components (Button, Card, Input)
- Day 3-4: Implement LNB and GNB
- Day 5: Testing and documentation

### Week 2: Dashboard
- Day 1-2: Redesign FlowProgressIndicator and StatsGrid
- Day 3-4: Redesign StoryStatusCard and integrate with main dashboard
- Day 5: Testing and bug fixes

### Week 3: Form & Library
- Day 1-3: Redesign TextSubmissionForm with step indicator
- Day 4-5: Redesign Library page (toolbar, grid, cards)

### Week 4: Polish & Launch
- Day 1-2: Redesign Notifications page
- Day 3: Cross-browser and mobile testing
- Day 4: Accessibility audit and fixes
- Day 5: Final review, documentation, and deployment prep

---

## Deployment Strategy

### Deployment Options

#### Option A: Big Bang (NOT RECOMMENDED)
- Deploy all changes at once
- Risks: High chance of issues, difficult rollback

#### Option B: Feature Flag Rollout (RECOMMENDED)
```tsx
// Use feature flag for gradual rollout
const { enabled: useRedesign } = useFeatureFlag('volunteer-redesign');

return useRedesign ? (
  <RedesignedVolunteerDashboard />
) : (
  <VolunteerDashboard />
);
```

Rollout plan:
1. Deploy with flag disabled (0% users)
2. Enable for internal team (5% users)
3. Enable for beta testers (10% users)
4. Gradual increase: 25% → 50% → 75% → 100%
5. Monitor metrics at each stage
6. Rollback capability at any point

#### Option C: Page-by-Page Rollout
1. Week 1: Deploy Main Dashboard redesign
2. Week 2: Deploy Submit Text page redesign
3. Week 3: Deploy Library page redesign
4. Week 4: Deploy Notifications page redesign

This allows for focused testing and easier rollback per page.

---

## Conclusion

This redesign plan provides a systematic approach to transforming the volunteer pages to match the Figma design system while maintaining all existing functionality and improving user experience.

**Key Principles:**
1. **Design Consistency**: Align with Figma design system
2. **Functionality Preservation**: Maintain all existing features
3. **Progressive Enhancement**: Mobile-first, responsive design
4. **Accessibility**: WCAG AA compliance
5. **Performance**: No significant degradation
6. **User-Centric**: Improve task completion and satisfaction

**Next Steps:**
1. Review and approve this plan with stakeholders
2. Set up development environment and feature flags
3. Begin Phase 1 implementation
4. Establish regular check-ins for progress review

---

## Appendix

### A. Component Mapping

| Current Component | Redesigned Component | Status |
|------------------|---------------------|--------|
| VolunteerDashboard | RedesignedVolunteerDashboard | To Create |
| FlowProgressIndicator | EnhancedFlowProgress | To Update |
| DashboardStatsCard | StatsGrid | To Redesign |
| StoryStatusCard | RedesignedStoryCard | To Redesign |
| TextSubmissionForm | RedesignedTextSubmissionForm | To Update |
| Library Grid | RedesignedStoriesGrid | To Redesign |
| NotificationCenter | RedesignedNotificationCenter | To Update |

### B. Color Reference

```tsx
// Old colors (keep for backward compatibility)
--color-soe-green-400: #10B981
--color-soe-green-500: #059669
--color-soe-green-600: #047857
--color-soe-purple-400: #A78BFA
--color-soe-purple-500: #8B5CF6
--color-soe-purple-600: #7C3AED
--color-soe-yellow-400: #FBBF24
--color-soe-yellow-500: #F59E0B

// New Figma colors (add)
--color-figma-black: #141414
--color-figma-gray-inactive: #8E8E93
--color-figma-gray-border: #E5E5EA
--color-figma-gray-border-alt: #E4E4E4
--color-figma-gray-bg: #73757C
--color-figma-active: #33363F
```

### C. Typography Reference

```css
/* Figma Typography */
.title-03 {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.221;
}

.body-03 {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.193;
}

.body-04 {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.193;
}
```

### D. Resources

- **Figma Design**: https://www.figma.com/design/AlPzpkP4Ylua6OmtfdfDe7/1001-stories_publishing?node-id=0-1
- **Current Implementation**: `/app/dashboard/volunteer/`
- **Component Library**: `/components/`
- **Design System Docs**: (To be created)
- **Playwright Tests**: `/tests/volunteer/`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-11
**Author**: Claude Code (AI Assistant)
**Status**: READY FOR REVIEW
