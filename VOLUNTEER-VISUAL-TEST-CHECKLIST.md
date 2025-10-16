# Volunteer Dashboard Visual Testing Checklist

**Platform:** 1001 Stories - Global Education Platform for Children
**Quality Standard:** Critical - Serving children worldwide
**Last Updated:** 2025-10-11

## Table of Contents
1. [Testing Environment Setup](#testing-environment-setup)
2. [Component Testing Checklists](#component-testing-checklists)
3. [Page Integration Testing](#page-integration-testing)
4. [Screenshot Documentation](#screenshot-documentation)
5. [Before/After Comparison](#beforeafter-comparison)

---

## Testing Environment Setup

### Required Breakpoints
- **Mobile:** 320px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px and above

### Design System Reference
- **Primary Black:** #141414 (figma-black)
- **Gray Inactive:** #8E8E93 (figma-gray-inactive)
- **Border Color:** #E5E5EA (figma-gray-border)
- **SOE Green:** #8db832 (soe-green-500) to #7ba426 (soe-green-600)
- **SOE Purple:** #874FFF (soe-purple-500) to #7339f0 (soe-purple-600)

### Typography Standards
- **Title03:** 24px, line-height 1.221, font-weight 500
- **Body03:** 18px, line-height 1.193, font-weight 400
- **Body04:** 16px, line-height 1.193, font-weight 400

### Testing Tools
- [ ] Chrome DevTools (device emulation)
- [ ] Firefox Developer Tools
- [ ] Safari Web Inspector
- [ ] Responsive design mode
- [ ] Lighthouse accessibility audit
- [ ] axe DevTools (accessibility)

---

## Component Testing Checklists

### 1. VolunteerLNB (Sidebar + Mobile Bottom Nav)

#### Desktop View (≥1024px)
- [ ] **Structure**
  - [ ] Fixed left sidebar at 240px width (w-60)
  - [ ] Positioned from top-0 to bottom-0
  - [ ] White background (#FFFFFF)
  - [ ] Border-right with figma-gray-border (#E5E5EA)

- [ ] **Logo Section**
  - [ ] 1001 Stories logo with gradient (soe-green-500 to soe-purple-500)
  - [ ] BookOpen icon (24x24px) centered in 40x40px circle
  - [ ] Title "1001 Stories" in 18px semibold
  - [ ] Subtitle "Volunteer" in 12px figma-gray-inactive
  - [ ] Proper spacing: p-6 with border-bottom

- [ ] **Navigation Items**
  - [ ] Home, Library, Stories, Profile icons (20x20px)
  - [ ] Text labels in 14px (text-sm)
  - [ ] Inactive state: figma-gray-inactive text, no background
  - [ ] Active state: gradient background (soe-green-50 to soe-purple-50)
  - [ ] Active icon: soe-green-600 color
  - [ ] Active indicator: 6x6px green dot on right
  - [ ] Rounded corners: rounded-lg
  - [ ] Padding: px-4 py-3

- [ ] **Hover States**
  - [ ] Smooth transition (200ms)
  - [ ] Background changes to gray-50
  - [ ] Text changes to figma-black
  - [ ] Cursor pointer on all items

- [ ] **Bottom Section**
  - [ ] Border-top separator
  - [ ] Notifications link with Bell icon
  - [ ] Settings link with Settings icon
  - [ ] Sign Out button in red-600 text
  - [ ] Red-50 background on Sign Out hover

- [ ] **Accessibility**
  - [ ] role="navigation" attribute
  - [ ] aria-label="Main navigation"
  - [ ] aria-current="page" on active items
  - [ ] Screen reader text "(current page)" for active
  - [ ] Keyboard navigation (Tab, Enter)
  - [ ] Focus visible states

#### Mobile View (<1024px)
- [ ] **Structure**
  - [ ] Sidebar completely hidden (hidden lg:flex)
  - [ ] Bottom navigation visible (lg:hidden)
  - [ ] Fixed position at bottom-0
  - [ ] Full width with safe-area-inset-bottom
  - [ ] White background with border-top
  - [ ] z-index: 50

- [ ] **Navigation Items**
  - [ ] 4 items evenly spaced (justify-around)
  - [ ] Icons 20x20px centered
  - [ ] Labels 10px (text-[10px]) below icons
  - [ ] Minimum width 64px per item
  - [ ] Vertical flex layout (flex-col)

- [ ] **Active State**
  - [ ] soe-green-600 text color
  - [ ] soe-green-50 background
  - [ ] Rounded-lg corners
  - [ ] Proper touch target (min-w-[64px])

- [ ] **Touch Interactions**
  - [ ] Minimum 44x44px touch targets
  - [ ] No double-tap delay
  - [ ] Instant visual feedback
  - [ ] No hover effects on mobile

#### Tablet View (768-1023px)
- [ ] Mobile navigation layout used
- [ ] Icons and text properly sized
- [ ] Touch targets maintained
- [ ] No sidebar interference

---

### 2. GlobalNavigationBar (Top Navigation)

#### Desktop View (≥1024px)
- [ ] **Structure**
  - [ ] Sticky position top-0
  - [ ] Height 64px (h-16)
  - [ ] White background with border-bottom
  - [ ] z-index: 40
  - [ ] Horizontal padding: px-10

- [ ] **Logo/Branding**
  - [ ] Hidden on desktop (mobile logo hidden lg:block)
  - [ ] Dashboard breadcrumb links visible
  - [ ] 14px (text-sm) link text
  - [ ] figma-gray-inactive default color
  - [ ] figma-black on hover

- [ ] **Navigation Links**
  - [ ] Dashboard, My Library, Explore links
  - [ ] Horizontal layout with gap-6
  - [ ] 14px text size
  - [ ] Smooth color transition on hover

- [ ] **Right Actions**
  - [ ] Notification bell with badge (if count > 0)
  - [ ] Settings icon (visible on sm breakpoint)
  - [ ] User avatar with dropdown
  - [ ] Icons 20x20px (w-5 h-5)

- [ ] **User Menu**
  - [ ] Avatar: 32x32px (w-8 h-8)
  - [ ] Gradient background (soe-purple-400 to soe-purple-600)
  - [ ] Initial letter uppercase and centered
  - [ ] Name displayed (hidden on mobile)
  - [ ] Role badge below name
  - [ ] ChevronDown rotates 180° when open

- [ ] **Dropdown Menu**
  - [ ] Positioned absolute right-0 top-full
  - [ ] Width 224px (w-56)
  - [ ] White background with shadow-lg
  - [ ] Border: figma-gray-border
  - [ ] Rounded-xl corners
  - [ ] mt-2 spacing from trigger

- [ ] **Dropdown Items**
  - [ ] User info section at top (border-bottom)
  - [ ] Name in 14px semibold
  - [ ] Email in 12px figma-gray-inactive
  - [ ] Menu items: View Profile, Settings, Help
  - [ ] Sign Out at bottom (border-top)
  - [ ] Red-600 text for Sign Out
  - [ ] Red-50 background on hover

- [ ] **Accessibility**
  - [ ] aria-expanded on user menu button
  - [ ] aria-haspopup="true"
  - [ ] aria-label for notification (with count)
  - [ ] Keyboard navigation (Tab, Escape)
  - [ ] Escape key closes menu
  - [ ] Focus trap in dropdown

#### Mobile View (<1024px)
- [ ] **Logo Display**
  - [ ] Compact logo visible (lg:hidden)
  - [ ] Gradient circle 32x32px
  - [ ] "1001" text in white
  - [ ] "Stories" text beside logo
  - [ ] Link to dashboard

- [ ] **Actions Simplified**
  - [ ] Notification bell visible
  - [ ] Settings hidden (hidden sm:block)
  - [ ] User menu simplified
  - [ ] Avatar only (no name/role text)
  - [ ] Dropdown still functional

- [ ] **Notification Badge**
  - [ ] Red dot (w-2 h-2)
  - [ ] Positioned absolute top-1 right-1
  - [ ] bg-red-500
  - [ ] Visible when count > 0

#### Tablet View (768-1023px)
- [ ] Mobile logo layout
- [ ] Settings icon becomes visible (sm:block)
- [ ] User info displayed in menu
- [ ] Touch-friendly dropdown

---

### 3. Button Component (5 Variants × 3 Sizes)

#### Variant Testing

**Primary Variant**
- [ ] Background gradient: soe-green-500 to soe-green-600
- [ ] Hover: soe-green-600 to soe-green-700
- [ ] White text color
- [ ] Shadow-sm, hover:shadow-md
- [ ] Focus ring: soe-green-300

**Secondary Variant**
- [ ] Background gradient: soe-purple-500 to soe-purple-600
- [ ] Hover: soe-purple-600 to soe-purple-700
- [ ] White text color
- [ ] Shadow-sm, hover:shadow-md
- [ ] Focus ring: soe-purple-300

**Outline Variant**
- [ ] White background
- [ ] Border: figma-gray-border
- [ ] Text: figma-black
- [ ] Hover: gray-50 background, figma-black border
- [ ] Focus ring: gray-200

**Ghost Variant**
- [ ] Transparent background
- [ ] Text: figma-gray-inactive
- [ ] Hover: gray-50 background, figma-black text
- [ ] Focus ring: gray-200

**Danger Variant**
- [ ] Background: red-600
- [ ] Hover: red-700
- [ ] White text
- [ ] Shadow-sm, hover:shadow-md
- [ ] Focus ring: red-300

#### Size Testing

**Small (sm)**
- [ ] Height: 36px (h-9)
- [ ] Padding: px-4
- [ ] Text: 14px (text-sm)
- [ ] Icon gap: gap-2

**Medium (md)**
- [ ] Height: 48px (h-12)
- [ ] Padding: px-6
- [ ] Text: 16px (text-base)
- [ ] Icon gap: gap-2

**Large (lg)**
- [ ] Height: 56px (h-14)
- [ ] Padding: px-8
- [ ] Text: 18px (text-lg)
- [ ] Icon gap: gap-3

#### Interactive States
- [ ] **Default:** Proper colors and spacing
- [ ] **Hover:** Smooth gradient/color transition (200ms)
- [ ] **Focus:** 4px ring with 2px offset
- [ ] **Active:** Visual press feedback
- [ ] **Disabled:** 50% opacity, cursor-not-allowed
- [ ] **Loading:** Loader2 spinner animation

#### Icon Support
- [ ] Left icon displays before text
- [ ] Right icon displays after text
- [ ] Icons sized correctly per button size
- [ ] Icons hidden when loading
- [ ] Flex-shrink-0 on icon containers

#### Accessibility
- [ ] Proper contrast ratios (WCAG AA)
- [ ] Focus visible and clear
- [ ] Disabled state announced
- [ ] Loading state announced
- [ ] Keyboard activation (Enter/Space)

---

### 4. Card Component (3 Variants)

#### Default Variant
- [ ] White background
- [ ] Border: 1px figma-gray-border
- [ ] Rounded-xl corners
- [ ] Smooth transitions (200ms)

#### Bordered Variant
- [ ] White background
- [ ] Border: 2px figma-gray-border
- [ ] Rounded-xl corners
- [ ] Thicker border clearly visible

#### Elevated Variant
- [ ] White background
- [ ] Shadow-lg
- [ ] Border: 1px figma-gray-border
- [ ] Rounded-xl corners
- [ ] Elevated appearance

#### Padding Options
- [ ] **None:** No padding (p-0)
- [ ] **Small:** p-4 (16px)
- [ ] **Medium:** p-6 (24px)
- [ ] **Large:** p-8 (32px)

#### Hoverable State
- [ ] Border changes to figma-black
- [ ] Shadow increases to shadow-lg
- [ ] Cursor pointer
- [ ] Smooth transition

#### Responsive Behavior
- [ ] Desktop: Full padding maintained
- [ ] Tablet: Padding scales appropriately
- [ ] Mobile: Consider reduced padding
- [ ] No overflow issues

---

### 5. Input Component

#### Structure
- [ ] Label above input (optional)
- [ ] Input field with proper sizing
- [ ] Error message below (if present)
- [ ] Icon support (left/right)

#### Default State
- [ ] Height: 48px (h-12)
- [ ] Padding: px-4
- [ ] Background: white
- [ ] Border: 1px figma-gray-border
- [ ] Rounded-lg corners
- [ ] Text: 16px figma-black
- [ ] Placeholder: figma-gray-inactive

#### Focus State
- [ ] Border: figma-black
- [ ] Ring: 4px gray-100
- [ ] No outline
- [ ] Smooth transition

#### Error State
- [ ] Border: red-500
- [ ] Focus border: red-500
- [ ] Focus ring: red-100
- [ ] Error text: 14px red-600
- [ ] Error text margin-top: 6px

#### Disabled State
- [ ] Background: gray-50
- [ ] Cursor: not-allowed
- [ ] Reduced opacity or grayed appearance

#### Icon Integration
- [ ] **Left Icon:**
  - [ ] Positioned absolute left-4
  - [ ] Centered vertically
  - [ ] figma-gray-inactive color
  - [ ] Input padding-left: 44px (pl-11)

- [ ] **Right Icon:**
  - [ ] Positioned absolute right-4
  - [ ] Centered vertically
  - [ ] figma-gray-inactive color
  - [ ] Input padding-right: 44px (pr-11)

#### Label
- [ ] Text: 14px medium weight
- [ ] Color: figma-black
- [ ] Margin-bottom: 8px (mb-2)
- [ ] Associated with input (htmlFor)

#### Accessibility
- [ ] Label properly associated
- [ ] aria-invalid when error
- [ ] aria-describedby for error
- [ ] Placeholder not sole label
- [ ] Error announced to screen readers

---

### 6. StatusBadge (11 Status Types)

#### Badge Structure
- [ ] Inline-flex layout
- [ ] Items centered (items-center justify-center)
- [ ] Rounded-full shape
- [ ] Border: 1px matching variant
- [ ] Icon + text layout
- [ ] Smooth transitions (200ms)

#### Size Variants

**Small (sm)**
- [ ] Height: 24px (h-6)
- [ ] Padding: px-2
- [ ] Gap: gap-1
- [ ] Icon: 12x12px (w-3 h-3)
- [ ] Text: 12px (text-xs)

**Medium (md)**
- [ ] Height: 32px (h-8)
- [ ] Padding: px-3
- [ ] Gap: gap-1.5
- [ ] Icon: 16x16px (w-4 h-4)
- [ ] Text: 14px (text-sm)

**Large (lg)**
- [ ] Height: 40px (h-10)
- [ ] Padding: px-4
- [ ] Gap: gap-2
- [ ] Icon: 20x20px (w-5 h-5)
- [ ] Text: 16px (text-base)

#### Status Types

**DRAFT**
- [ ] Icon: FileEdit
- [ ] Background: gray-50
- [ ] Text: figma-gray-inactive
- [ ] Border: figma-gray-border
- [ ] Label: "Draft"

**PENDING**
- [ ] Icon: Clock
- [ ] Background: amber-50
- [ ] Text: amber-700
- [ ] Border: amber-200
- [ ] Label: "Pending Review"

**STORY_REVIEW**
- [ ] Icon: Eye
- [ ] Background: blue-50
- [ ] Text: blue-700
- [ ] Border: blue-200
- [ ] Label: "Story Review"

**NEEDS_REVISION**
- [ ] Icon: AlertCircle
- [ ] Background: orange-50
- [ ] Text: orange-700
- [ ] Border: orange-200
- [ ] Label: "Needs Revision"

**STORY_APPROVED**
- [ ] Icon: CheckCircle2
- [ ] Background: emerald-50
- [ ] Text: emerald-700
- [ ] Border: emerald-200
- [ ] Label: "Story Approved"

**FORMAT_REVIEW**
- [ ] Icon: Eye
- [ ] Background: purple-50
- [ ] Text: purple-700
- [ ] Border: purple-200
- [ ] Label: "Format Review"

**CONTENT_REVIEW**
- [ ] Icon: Eye
- [ ] Background: indigo-50
- [ ] Text: indigo-700
- [ ] Border: indigo-200
- [ ] Label: "Content Review"

**APPROVED**
- [ ] Icon: CheckCircle2
- [ ] Background: green-50
- [ ] Text: green-700
- [ ] Border: green-200
- [ ] Label: "Approved"

**PUBLISHED**
- [ ] Icon: Sparkles
- [ ] Background: soe-green-50
- [ ] Text: soe-green-700
- [ ] Border: soe-green-200
- [ ] Label: "Published"

**ARCHIVED**
- [ ] Icon: Archive
- [ ] Background: gray-100
- [ ] Text: gray-600
- [ ] Border: gray-300
- [ ] Label: "Archived"

**REJECTED**
- [ ] Icon: XCircle
- [ ] Background: red-50
- [ ] Text: red-700
- [ ] Border: red-200
- [ ] Label: "Rejected"

#### Accessibility
- [ ] role="status" attribute
- [ ] aria-label with full status text
- [ ] Color not sole indicator
- [ ] Icons provide visual redundancy
- [ ] Sufficient color contrast

---

### 7. Select Component

#### Structure
- [ ] Label (optional)
- [ ] Select field with custom styling
- [ ] Chevron icon
- [ ] Error message area

#### Default State
- [ ] Height: 48px (h-12)
- [ ] Padding: px-4
- [ ] Padding-right: pr-10 (for chevron)
- [ ] Background: white
- [ ] Border: 1px figma-gray-border
- [ ] Rounded-lg
- [ ] Text: 16px figma-black
- [ ] Appearance: none (custom chevron)

#### Focus State
- [ ] Border: figma-black
- [ ] Ring: 4px gray-100
- [ ] Smooth transition

#### Error State
- [ ] Border: red-500
- [ ] Focus border: red-500
- [ ] Focus ring: red-100
- [ ] Error text: 14px red-600
- [ ] Chevron: red-500

#### Disabled State
- [ ] Background: gray-50
- [ ] Text: figma-gray-inactive
- [ ] Cursor: not-allowed

#### Chevron Icon
- [ ] Positioned absolute right-4
- [ ] Top: 50%, translate-y-1/2
- [ ] Size: 20x20px (w-5 h-5)
- [ ] Color: figma-gray-inactive (or red-500 if error)
- [ ] Pointer-events: none
- [ ] Smooth color transition

#### Placeholder
- [ ] First option disabled
- [ ] Text: figma-gray-inactive
- [ ] Shown when no value selected

#### Options
- [ ] Proper label display
- [ ] Disabled options grayed out
- [ ] Value correctly mapped

#### Accessibility
- [ ] Label association
- [ ] aria-invalid when error
- [ ] aria-describedby for error
- [ ] Error role="alert"
- [ ] Keyboard navigation (Arrow keys)

---

### 8. ProgressBar (5 Variants)

#### Structure
- [ ] Label area (optional)
- [ ] Progress track (background)
- [ ] Progress fill (foreground)
- [ ] Animation overlay (optional)

#### Base Styling
- [ ] Track height: 8px (h-2)
- [ ] Track rounded-full
- [ ] Fill rounded-full
- [ ] Smooth transition: 500ms ease-out

#### Variants

**Green**
- [ ] Track: soe-green-100
- [ ] Fill gradient: soe-green-500 to soe-green-600
- [ ] Label text: soe-green-700

**Purple**
- [ ] Track: soe-purple-100
- [ ] Fill gradient: soe-purple-500 to soe-purple-600
- [ ] Label text: soe-purple-700

**Blue**
- [ ] Track: blue-100
- [ ] Fill gradient: blue-500 to blue-600
- [ ] Label text: blue-700

**Yellow**
- [ ] Track: soe-yellow-100
- [ ] Fill gradient: soe-yellow-500 to soe-yellow-600
- [ ] Label text: soe-yellow-700

**Gray**
- [ ] Track: gray-100
- [ ] Fill gradient: gray-400 to gray-500
- [ ] Label text: gray-700

#### Label Display
- [ ] Shown if showLabel=true
- [ ] Text: 14px medium (text-sm font-medium)
- [ ] Margin-bottom: 8px (mb-2)
- [ ] Default label: percentage rounded
- [ ] Custom label supported

#### Animation
- [ ] Shimmer effect enabled by default
- [ ] Gradient overlay: transparent → white/20 → transparent
- [ ] Animation: 2s infinite
- [ ] translateX from -100% to 100%
- [ ] Can be disabled (animated=false)

#### Progress Calculation
- [ ] Value clamped between 0-100
- [ ] Width style: percentage-based
- [ ] Smooth width transition

#### Accessibility
- [ ] role="progressbar"
- [ ] aria-valuenow (clamped progress)
- [ ] aria-valuemin="0"
- [ ] aria-valuemax="100"
- [ ] aria-label with description

---

### 9. Redesigned Volunteer Dashboard Page

#### Layout Structure
- [ ] **Base Layout:**
  - [ ] Full height layout (min-h-screen)
  - [ ] Flex container
  - [ ] Background: gray-50
  - [ ] Desktop: Sidebar + main content
  - [ ] Mobile: Bottom nav + main content

- [ ] **Sidebar/Nav Integration:**
  - [ ] VolunteerLNB on left (desktop)
  - [ ] GlobalNavigationBar at top (sticky)
  - [ ] Main content margin-left: 240px (lg:ml-lnb) on desktop
  - [ ] Bottom nav visible on mobile

#### Header Section
- [ ] **Title Area:**
  - [ ] "Writer's Dashboard" heading (text-2xl sm:text-3xl)
  - [ ] figma-black color, bold weight
  - [ ] Welcome message with user name
  - [ ] Rank display in figma-gray-inactive
  - [ ] Responsive: column on mobile, row on desktop

- [ ] **Action Buttons:**
  - [ ] "My Library" button (blue gradient)
  - [ ] "Write Story" button (green gradient)
  - [ ] "Refresh" button (outline, desktop only)
  - [ ] Icons: 20x20px (BookOpen, PenTool, RefreshCw)
  - [ ] Minimum touch target: 44px
  - [ ] Hover scale effect: 1.05
  - [ ] Focus rings visible

#### Notifications
- [ ] **Success Notification:**
  - [ ] Green background (green-100)
  - [ ] Left border: green-500 (border-l-4)
  - [ ] Sticky top-16, z-30
  - [ ] CheckCircle icon
  - [ ] Close button (×)
  - [ ] Auto-dismiss after 5s

- [ ] **Error Notification (SSE):**
  - [ ] Red background (red-100)
  - [ ] Left border: red-500
  - [ ] Reconnect button underlined
  - [ ] Connection indicator dot

#### Active Submission Card
- [ ] **Progress Indicator:**
  - [ ] FlowProgressIndicator component
  - [ ] Shows current workflow stage
  - [ ] Margin-bottom: 24px (mb-6)

- [ ] **Focus Card:**
  - [ ] White background, rounded-xl
  - [ ] Border: figma-gray-border
  - [ ] Padding: 24px (p-6)
  - [ ] Target icon with soe-green-500
  - [ ] Title in figma-black, text-xl bold
  - [ ] Last updated timestamp
  - [ ] ActionButtons component

#### Stats Grid
- [ ] **Layout:**
  - [ ] Grid: 2 columns mobile, 4 columns desktop
  - [ ] Gap: 16px mobile, 24px desktop
  - [ ] Margin-bottom: 32px mobile, 40px desktop

- [ ] **Stat Cards:**
  - [ ] Total Stories (FileText icon, primary gradient)
  - [ ] Published (CheckCircle icon, emerald gradient)
  - [ ] Readers Reached (TrendingUp icon, blue gradient)
  - [ ] Rank (Award icon, amber gradient)
  - [ ] Icons in gradient circles
  - [ ] Values prominent
  - [ ] Labels clear

#### Workflow Insights
- [ ] **Container:**
  - [ ] White background, rounded-2xl
  - [ ] Shadow-md, border figma-gray-border
  - [ ] Padding: 24px (p-6)
  - [ ] Lightbulb icon with heading

- [ ] **Metrics Grid:**
  - [ ] 2 columns mobile, 4 columns desktop
  - [ ] Gap: 16px (gap-4)
  - [ ] Center-aligned text

- [ ] **Metric Cards:**
  - [ ] Success Rate (blue-600, large number)
  - [ ] In Review (orange-600)
  - [ ] Needs Revision (red-600)
  - [ ] This Month (green-600)
  - [ ] Labels in figma-gray-inactive

#### Achievements Section
- [ ] **Header:**
  - [ ] Gradient background (primary-50 to emerald-50)
  - [ ] Award icon in gradient circle
  - [ ] "Achievements" title (text-xl sm:text-2xl)
  - [ ] Subtitle in figma-gray-inactive
  - [ ] Border-bottom separator

- [ ] **Achievement Grid:**
  - [ ] 1 column mobile, 2 tablet, 3 desktop
  - [ ] Gap: 16px mobile, 24px desktop
  - [ ] Padding: 24px mobile, 32px desktop

- [ ] **Achievement Cards:**
  - [ ] Earned: emerald gradient background, emerald border
  - [ ] Locked: gray gradient background, gray border
  - [ ] Hover: translate-y-1, shadow-lg
  - [ ] Icon: 48x48px gradient circle
  - [ ] Badge: "✨ Unlocked" for earned
  - [ ] Title: 18px bold
  - [ ] Description: 14px

#### Stories List
- [ ] **Header:**
  - [ ] "Your Stories" heading (text-xl bold)
  - [ ] Story count on right (figma-gray-inactive)
  - [ ] Flex layout, space-between

- [ ] **Empty State:**
  - [ ] White background, rounded-2xl
  - [ ] Dashed border (border-2 border-dashed)
  - [ ] figma-gray-border color
  - [ ] Padding: 48px (p-12)
  - [ ] PenTool icon
  - [ ] "Start Your Writing Journey" title
  - [ ] Motivational description
  - [ ] CTA button with gradient

- [ ] **Story Cards:**
  - [ ] StoryStatusCard components
  - [ ] Grid gap: 24px (gap-6)
  - [ ] View, Edit, Delete actions
  - [ ] Status badges visible

#### Loading States
- [ ] DashboardLoadingState component
- [ ] "Loading your dashboard..." message
- [ ] Role: "volunteer" specified
- [ ] Spinner or skeleton UI

#### Error States
- [ ] DashboardErrorState component
- [ ] Error message displayed
- [ ] Role: "volunteer" specified
- [ ] Retry option if applicable

#### Responsive Behavior

**Mobile (<768px)**
- [ ] Single column layout
- [ ] Bottom navigation visible
- [ ] Compact header (vertical stack)
- [ ] Full-width buttons
- [ ] 2-column stats grid
- [ ] Reduced padding throughout
- [ ] Touch-friendly targets (44px min)

**Tablet (768-1023px)**
- [ ] 2-column grids where appropriate
- [ ] Bottom navigation
- [ ] Increased spacing
- [ ] Touch-optimized

**Desktop (≥1024px)**
- [ ] Sidebar navigation
- [ ] 4-column stats grid
- [ ] Maximum content width
- [ ] Mouse hover effects
- [ ] Keyboard shortcuts

#### Accessibility
- [ ] Semantic HTML structure
- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Screen reader announcements
- [ ] Color contrast (WCAG AA minimum)
- [ ] Touch target sizes (44x44px)

#### Performance
- [ ] Images optimized
- [ ] Lazy loading for below-fold content
- [ ] Smooth animations (60fps)
- [ ] No layout shift
- [ ] Fast initial load
- [ ] Efficient re-renders

---

## Page Integration Testing

### Cross-Component Interactions
- [ ] Navigation state syncs across components
- [ ] Theme consistency throughout
- [ ] Color palette uniformity
- [ ] Typography scale consistent
- [ ] Spacing rhythm maintained

### User Flows
- [ ] **Dashboard → Write Story:**
  - [ ] Button click navigates correctly
  - [ ] State preserved if returning
  - [ ] Loading indicators shown

- [ ] **Dashboard → Library:**
  - [ ] Navigation smooth
  - [ ] Active state updates
  - [ ] Content loads properly

- [ ] **Dashboard → Profile:**
  - [ ] User menu functional
  - [ ] Dropdown closes on selection
  - [ ] Profile page loads

- [ ] **Dashboard → Settings:**
  - [ ] Multiple entry points work (LNB, top nav, menu)
  - [ ] Consistent behavior
  - [ ] Settings persist

- [ ] **Notification Flow:**
  - [ ] SSE connection established
  - [ ] Real-time updates received
  - [ ] UI updates automatically
  - [ ] Reconnection works

### State Management
- [ ] Active story selection persists
- [ ] Stats update on data change
- [ ] Notifications auto-dismiss
- [ ] Dropdown states independent
- [ ] Loading states clear

### Error Handling
- [ ] Network errors shown gracefully
- [ ] Retry mechanisms work
- [ ] Fallback UI displays
- [ ] User informed of issues
- [ ] No blank screens

---

## Screenshot Documentation

### Required Screenshots

#### Desktop (1920x1080)
**Location:** `/docs/screenshots/volunteer-dashboard/desktop/`

- [ ] `01-full-dashboard-view.png` - Complete page overview
- [ ] `02-sidebar-navigation.png` - LNB with all states
- [ ] `03-top-navigation.png` - GlobalNavigationBar
- [ ] `04-user-menu-open.png` - Dropdown expanded
- [ ] `05-active-submission-card.png` - Current focus section
- [ ] `06-stats-grid.png` - All four stat cards
- [ ] `07-workflow-insights.png` - Insights panel
- [ ] `08-achievements-section.png` - Achievement cards (earned + locked)
- [ ] `09-stories-list-populated.png` - Story cards displayed
- [ ] `10-stories-empty-state.png` - No stories view
- [ ] `11-notification-banner.png` - Success notification
- [ ] `12-error-notification.png` - SSE error notification
- [ ] `13-hover-states.png` - Various hover effects
- [ ] `14-focus-states.png` - Keyboard focus indicators

#### Tablet (768x1024)
**Location:** `/docs/screenshots/volunteer-dashboard/tablet/`

- [ ] `01-portrait-view.png` - Full page portrait
- [ ] `02-landscape-view.png` - Full page landscape
- [ ] `03-bottom-navigation.png` - Mobile nav bar
- [ ] `04-top-navigation-collapsed.png` - Compact header
- [ ] `05-stats-grid-2col.png` - Two-column stats
- [ ] `06-achievements-2col.png` - Two-column achievements
- [ ] `07-user-menu-tablet.png` - Dropdown on tablet

#### Mobile (375x667)
**Location:** `/docs/screenshots/volunteer-dashboard/mobile/`

- [ ] `01-dashboard-scroll-top.png` - Above fold
- [ ] `02-dashboard-scroll-mid.png` - Middle section
- [ ] `03-dashboard-scroll-bottom.png` - Bottom section
- [ ] `04-bottom-navigation.png` - Mobile nav active states
- [ ] `05-compact-header.png` - Mobile header
- [ ] `06-mobile-user-menu.png` - Simplified dropdown
- [ ] `07-stats-2col.png` - Mobile stats grid
- [ ] `08-achievements-1col.png` - Single column achievements
- [ ] `09-story-cards-mobile.png` - Mobile story list
- [ ] `10-empty-state-mobile.png` - Empty state on mobile
- [ ] `11-notification-mobile.png` - Mobile notification

#### Component Library
**Location:** `/docs/screenshots/components/`

- [ ] `button-variants.png` - All 5 button variants, 3 sizes
- [ ] `button-states.png` - Hover, focus, disabled, loading
- [ ] `card-variants.png` - Default, bordered, elevated
- [ ] `card-hoverable.png` - Hover effect demonstration
- [ ] `input-default.png` - Normal input state
- [ ] `input-focus.png` - Focus state with ring
- [ ] `input-error.png` - Error state with message
- [ ] `input-with-icons.png` - Left and right icons
- [ ] `status-badges-all.png` - All 11 status types
- [ ] `status-badges-sizes.png` - Small, medium, large
- [ ] `select-default.png` - Default select state
- [ ] `select-open.png` - Options dropdown
- [ ] `select-error.png` - Error state
- [ ] `progressbar-variants.png` - All 5 color variants
- [ ] `progressbar-animation.png` - Shimmer effect
- [ ] `lnb-desktop.png` - Full sidebar
- [ ] `lnb-mobile.png` - Bottom navigation
- [ ] `global-nav-desktop.png` - Top nav expanded
- [ ] `global-nav-mobile.png` - Mobile top nav

### Screenshot Guidelines
- [ ] Use consistent browser (Chrome recommended)
- [ ] Disable browser extensions
- [ ] Clear browser cache before capture
- [ ] Use exact breakpoint dimensions
- [ ] Capture at 2x resolution (Retina)
- [ ] Save as PNG (lossless)
- [ ] Use descriptive filenames
- [ ] Include timestamps in metadata
- [ ] Organize by device/component
- [ ] Document any special states

---

## Before/After Comparison

### Comparison Locations
**Directory:** `/docs/screenshots/before-after/`

#### Layout Changes
- [ ] `layout-before.png` - Old dashboard layout
- [ ] `layout-after.png` - New Figma-based layout
- [ ] `layout-comparison.png` - Side-by-side overlay

#### Navigation Changes
- [ ] `nav-sidebar-before.png` - Old sidebar design
- [ ] `nav-sidebar-after.png` - New VolunteerLNB
- [ ] `nav-mobile-before.png` - Old mobile nav
- [ ] `nav-mobile-after.png` - New bottom nav
- [ ] `nav-comparison.png` - Annotated differences

#### Component Evolution
- [ ] `button-before.png` - Old button styles
- [ ] `button-after.png` - New Figma buttons
- [ ] `card-before.png` - Old card design
- [ ] `card-after.png` - New card variants
- [ ] `input-before.png` - Old form inputs
- [ ] `input-after.png` - New input design
- [ ] `badge-before.png` - Old status badges
- [ ] `badge-after.png` - New StatusBadge component

#### Color System
- [ ] `colors-before.png` - Old color palette
- [ ] `colors-after.png` - New Figma colors (#141414, #8E8E93, #E5E5EA)
- [ ] `colors-comparison.png` - Palette migration map

#### Typography
- [ ] `typography-before.png` - Old text styles
- [ ] `typography-after.png` - Title03, Body03, Body04
- [ ] `typography-comparison.png` - Size and weight changes

### Comparison Checklist
- [ ] All major components documented
- [ ] Side-by-side views created
- [ ] Annotations added to highlight changes
- [ ] Color swatches extracted
- [ ] Typography specs measured
- [ ] Spacing differences noted
- [ ] Accessibility improvements documented
- [ ] Performance metrics compared (if available)

### Migration Notes Template
For each component comparison, document:
- [ ] **Visual Changes:** What changed visually
- [ ] **Code Changes:** Implementation differences
- [ ] **Behavioral Changes:** Interaction updates
- [ ] **Accessibility Improvements:** A11y enhancements
- [ ] **Breaking Changes:** What might break
- [ ] **Migration Steps:** How to update existing code

---

## Edge Cases & Special Scenarios

### Data Variations
- [ ] **No submissions:**
  - [ ] Empty state displays correctly
  - [ ] CTA button functional
  - [ ] No JavaScript errors

- [ ] **Many submissions (20+):**
  - [ ] Pagination or scroll works
  - [ ] Performance acceptable
  - [ ] Layout doesn't break

- [ ] **Long story titles:**
  - [ ] Text truncates with ellipsis
  - [ ] Tooltip shows full title
  - [ ] No layout overflow

- [ ] **Long user names:**
  - [ ] Truncation in navigation
  - [ ] Full name in dropdown
  - [ ] No visual breaks

- [ ] **No achievements earned:**
  - [ ] All show locked state
  - [ ] Grid layout maintained
  - [ ] Motivational copy displayed

- [ ] **All achievements earned:**
  - [ ] Celebration visual
  - [ ] All badges shown
  - [ ] No UI issues

### Network Conditions
- [ ] **Slow connection:**
  - [ ] Loading states shown
  - [ ] Skeleton screens or spinners
  - [ ] No blank content

- [ ] **Offline:**
  - [ ] Offline message displayed
  - [ ] Cached content shown if available
  - [ ] Retry option provided

- [ ] **Failed API calls:**
  - [ ] Error states triggered
  - [ ] User-friendly messages
  - [ ] Retry mechanisms available

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Device Variations
- [ ] iPhone SE (375x667)
- [ ] iPhone 12/13/14 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] iPad Mini (768x1024)
- [ ] iPad Pro 11" (834x1194)
- [ ] iPad Pro 12.9" (1024x1366)
- [ ] Desktop 1920x1080
- [ ] Desktop 2560x1440
- [ ] Desktop 3840x2160 (4K)

### Interaction Edge Cases
- [ ] Rapid button clicking
- [ ] Form submission during loading
- [ ] Multiple dropdowns open
- [ ] Deep navigation then back button
- [ ] Session timeout handling
- [ ] Concurrent updates (SSE + manual refresh)

---

## Accessibility Audit

### WCAG 2.1 Level AA Compliance
- [ ] **1.1 Text Alternatives:**
  - [ ] All images have alt text
  - [ ] Icons have aria-labels
  - [ ] Decorative images marked

- [ ] **1.3 Adaptable:**
  - [ ] Semantic HTML structure
  - [ ] Proper heading hierarchy
  - [ ] Landmark regions defined
  - [ ] Reading order logical

- [ ] **1.4 Distinguishable:**
  - [ ] Color contrast ≥4.5:1 (normal text)
  - [ ] Color contrast ≥3:1 (large text)
  - [ ] Color not sole indicator
  - [ ] Text resizable to 200%
  - [ ] No text in images (decorative only)

- [ ] **2.1 Keyboard Accessible:**
  - [ ] All functionality keyboard accessible
  - [ ] No keyboard traps
  - [ ] Focus order logical
  - [ ] Keyboard shortcuts documented

- [ ] **2.4 Navigable:**
  - [ ] Skip links provided
  - [ ] Page titles descriptive
  - [ ] Focus visible
  - [ ] Link purpose clear
  - [ ] Multiple ways to navigate

- [ ] **3.1 Readable:**
  - [ ] Language declared (lang attribute)
  - [ ] Complex terms defined
  - [ ] Abbreviations explained

- [ ] **3.2 Predictable:**
  - [ ] Consistent navigation
  - [ ] Consistent identification
  - [ ] No automatic changes on focus/input

- [ ] **3.3 Input Assistance:**
  - [ ] Error identification clear
  - [ ] Labels or instructions provided
  - [ ] Error suggestions offered
  - [ ] Error prevention (confirmations)

### Screen Reader Testing
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS/iOS)
- [ ] TalkBack (Android)

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Shift+Tab works correctly
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate where appropriate
- [ ] Escape closes modals/dropdowns
- [ ] Focus visible at all times

---

## Performance Checklist

### Load Performance
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1

### Runtime Performance
- [ ] Smooth scrolling (60fps)
- [ ] Animations smooth (60fps)
- [ ] No janky interactions
- [ ] Memory usage acceptable
- [ ] No memory leaks

### Optimization
- [ ] Images optimized and lazy-loaded
- [ ] Code split appropriately
- [ ] Unused code removed
- [ ] Critical CSS inlined
- [ ] Fonts optimized (woff2)
- [ ] Minimal third-party scripts

### Network
- [ ] Assets compressed (gzip/brotli)
- [ ] HTTP/2 or HTTP/3 used
- [ ] CDN for static assets
- [ ] Appropriate caching headers
- [ ] Service worker (if applicable)

---

## Sign-Off Checklist

### Visual Design
- [ ] Figma designs matched exactly
- [ ] Color palette consistent (#141414, #8E8E93, #E5E5EA)
- [ ] Typography scales correct (Title03, Body03, Body04)
- [ ] Spacing follows design system
- [ ] Shadows and borders accurate
- [ ] Gradients rendered properly

### Functionality
- [ ] All components working
- [ ] Navigation functional
- [ ] Forms submitting correctly
- [ ] Real-time updates working (SSE)
- [ ] Error handling robust
- [ ] Loading states appropriate

### Responsive Design
- [ ] Mobile layout perfect
- [ ] Tablet layout perfect
- [ ] Desktop layout perfect
- [ ] Transitions smooth between breakpoints
- [ ] Touch targets adequate (44x44px)
- [ ] No horizontal scroll

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Screen reader tested
- [ ] Keyboard navigation complete
- [ ] Color contrast verified
- [ ] ARIA attributes correct
- [ ] Semantic HTML used

### Performance
- [ ] Lighthouse score >90
- [ ] Core Web Vitals green
- [ ] Load time acceptable
- [ ] Animations smooth
- [ ] No console errors

### Browser/Device Testing
- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Edge (desktop)
- [ ] Physical device testing completed
- [ ] Various screen sizes verified

### Documentation
- [ ] Screenshots captured
- [ ] Before/after comparisons made
- [ ] Edge cases documented
- [ ] Known issues logged
- [ ] Migration notes written

### Quality Assurance
- [ ] Code reviewed
- [ ] Linting passed
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Security audit passed
- [ ] Privacy considerations addressed

---

## Test Execution Log

### Tester Information
- **Name:** _________________
- **Date:** _________________
- **Environment:** _________________
- **Browser:** _________________
- **Device:** _________________

### Issues Found

| ID | Component | Issue Description | Severity | Status | Notes |
|----|-----------|------------------|----------|--------|-------|
| 001 | | | High/Med/Low | Open/Fixed | |
| 002 | | | High/Med/Low | Open/Fixed | |
| 003 | | | High/Med/Low | Open/Fixed | |

### Overall Assessment
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major revisions
- [ ] Blocked by: _________________

### Notes & Observations
_____________________________________
_____________________________________
_____________________________________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-11 | Claude Code | Initial checklist created |

---

**IMPORTANT NOTES:**

1. **Quality is Critical:** This platform serves children worldwide. Every detail matters.

2. **Design Fidelity:** Match Figma designs exactly. No approximations.

3. **Accessibility First:** WCAG 2.1 AA is minimum. Test with real users if possible.

4. **Cross-Device Testing:** Don't assume. Test on real devices across all breakpoints.

5. **Document Everything:** Screenshots, issues, decisions. Future you will thank you.

6. **Performance Matters:** Children may use slow devices/networks. Optimize aggressively.

7. **Error States:** Every happy path needs an unhappy path. Test both thoroughly.

8. **Real Data:** Test with realistic data volumes, not just happy path samples.

9. **Security:** This is an education platform. Protect user data and privacy.

10. **Continuous Testing:** This checklist is for initial launch. Continue testing post-launch.

---

**END OF CHECKLIST**
