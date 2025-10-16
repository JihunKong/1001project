# Troubleshooting Guide - Volunteer Submit Text Page

## Overview
This document records critical issues encountered during the development of the volunteer submit-text page and their solutions. These patterns may apply to other pages in the application.

---

## Issue #1: Server-Side Rendering (SSR) Failure with DOMPurify

### Problem
Editor page rendered visually but was completely non-interactive. All navigation links, buttons, and form elements were frozen.

### Symptoms
- Page loads and displays correctly
- No JavaScript errors in console
- Clicking any element does nothing
- Editor itself works (because it was already client-only)
- Navigation completely broken

### Root Cause
`RichTextEditor` component imported `DOMPurify` at the top level:
```tsx
import DOMPurify from 'dompurify';
```

DOMPurify is a browser-only library that requires `window.document`. When Next.js tried to render this component during SSR, it failed silently, causing React hydration to completely break. When hydration fails, React cannot attach event listeners to ANY elements on the page.

### Solution
Use dynamic import with `ssr: false` for components that use browser-only libraries:

```tsx
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('./ui/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-[#E5E5EA] rounded-lg overflow-hidden bg-white min-h-[400px] flex items-center justify-center">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  )
});
```

**Key Point:** Always provide a `loading` fallback. Without it, the component renders nothing and may fail silently.

### Prevention
1. Identify browser-only libraries: `DOMPurify`, `chart.js`, `react-player`, etc.
2. Always use dynamic imports with `ssr: false` for these components
3. Always provide a loading fallback
4. Test SSR behavior: `npm run build` will catch these issues

---

## Issue #2: Dynamic Imports Without Loading Fallback

### Problem
Header (GlobalNavigationBar) and sidebar (VolunteerLNB) completely disappeared from the page.

### Symptoms
- Page renders but navigation components missing
- No errors in console
- Components exist in code but don't appear

### Root Cause
Layout used dynamic imports with `ssr: false` but **NO loading fallback**:

```tsx
// ❌ WRONG - No loading fallback
const VolunteerLNB = dynamic(() => import('@/components/figma/layout/VolunteerLNB'), {
  ssr: false
});
```

Without a loading fallback, the component renders nothing while loading. If the import fails or encounters an error, it fails silently.

### Solution
These components were already marked `'use client'`, so dynamic imports were unnecessary. Simply use normal imports:

```tsx
// ✅ CORRECT - Normal import for client components
import VolunteerLNB from '@/components/figma/layout/VolunteerLNB';
import GlobalNavigationBar from '@/components/figma/layout/GlobalNavigationBar';
```

### When to Use Dynamic Imports
- **Use dynamic imports:** For components with browser-only dependencies (DOMPurify, etc.)
- **Don't use dynamic imports:** For components already marked `'use client'` with no browser-only deps
- **Always provide loading fallback:** If using dynamic imports

---

## Issue #3: Infinite Re-rendering Loop

### Problem
After fixing SSR issues, navigation still didn't work. Page appeared to work but clicks did nothing.

### Symptoms
- Page renders correctly
- Editor works (draft saving, content editing)
- Navigation links appear but don't respond to clicks
- Sidebar links don't work
- Console shows no errors (infinite loop is silent)

### Root Cause
Non-memoized callback function causing infinite re-renders:

```tsx
// ❌ WRONG - Function recreated on every render
const handleFormChange = (data: any) => {
  setFormData(prev => ({ ...prev, ...data }));
};

// This function is passed to TextSubmissionForm, which uses it in useEffect:
useEffect(() => {
  if (onFormChange) {
    onFormChange({ title, summary, content, ... });
  }
}, [title, summary, content, onFormChange]); // ⚠️ onFormChange changes every render!
```

**The Loop:**
1. Page renders → creates new `handleFormChange` function
2. Child's `useEffect` sees new function reference → runs
3. Calls `onFormChange` → updates parent state
4. Parent re-renders → creates new `handleFormChange`
5. **REPEAT infinitely!**

This constant re-rendering prevents React from properly attaching event listeners to navigation Links.

### Solution
Memoize the callback with `useCallback`:

```tsx
// ✅ CORRECT - Function memoized, won't change
const handleFormChange = useCallback((data: any) => {
  setFormData(prev => ({ ...prev, ...data }));
}, []); // Empty deps = function never changes
```

### Prevention
1. **Always use `useCallback`** for functions passed as props
2. **Always use `useMemo`** for expensive computed values passed as props
3. **Lint rule:** Enable `react-hooks/exhaustive-deps` ESLint rule
4. **Testing:** If page seems slow or unresponsive, check for infinite loops in React DevTools Profiler

---

## Diagnostic Checklist

When navigation or interactions stop working:

### 1. Check for SSR Issues
```bash
# Build will fail if SSR breaks
npm run build

# Look for errors about:
# - "window is not defined"
# - "document is not defined"
# - "ReferenceError: DOMPurify is not defined"
```

### 2. Check Dynamic Imports
```bash
# Search for dynamic imports without loading fallback
grep -r "dynamic.*ssr.*false" --include="*.tsx" | grep -v "loading:"
```

### 3. Check for Infinite Loops
```tsx
// Add temporary logging
useEffect(() => {
  console.count('Component rendered');
}, []);

// If count increases rapidly without user action = infinite loop
```

### 4. Check useCallback/useMemo
```bash
# Find functions passed as props without memoization
# Look for patterns like:
const handleSomething = (data) => { ... };
// passed to: <Component onChange={handleSomething} />
```

---

## Best Practices

### 1. Client Component Structure
```tsx
'use client';

import { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// ✅ Normal imports for client-only components
import ClientComponent from './ClientComponent';

// ✅ Dynamic imports only for browser-dep components
const BrowserOnlyComponent = dynamic(() => import('./BrowserOnly'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function MyComponent() {
  // ✅ Memoize callbacks
  const handleChange = useCallback((data) => {
    // ...
  }, []);

  // ✅ Memoize computed values
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);

  return (
    <div>
      <ClientComponent onChange={handleChange} />
      <BrowserOnlyComponent value={expensiveValue} />
    </div>
  );
}
```

### 2. Testing Approach
```bash
# 1. Always build before deploying
npm run build

# 2. Test in production mode locally
npm run start

# 3. Check React DevTools
# - Profiler: Look for excessive renders
# - Components: Check for hydration mismatches
```

### 3. Error Boundaries
Always wrap risky components in ErrorBoundary:
```tsx
<ErrorBoundary>
  <ComponentThatMightFail />
</ErrorBoundary>
```

---

## Related Files
- `/app/dashboard/volunteer/submit-text/page.tsx` - Main page with fixes
- `/components/TextSubmissionForm.tsx` - Form with dynamic RichTextEditor
- `/components/ui/RichTextEditor.tsx` - Component with DOMPurify
- `/app/dashboard/volunteer/layout.tsx` - Layout with navigation components
- `/components/ErrorBoundary.tsx` - Error boundary implementation

---

## Timeline of Fixes

### 2025-10-16 (Today)
1. **06:01** - Initial issue: Navigation completely frozen
2. **06:10** - Added ErrorBoundary and dynamic import for RichTextEditor
3. **06:38** - Fixed missing header/sidebar (removed unnecessary dynamic imports)
4. **07:30** - Fixed infinite re-rendering (added useCallback)
5. **07:38** - ✅ All issues resolved, navigation working

### Key Insight
The problems were layered - solving one revealed the next:
1. SSR failure broke hydration → fixed with dynamic import
2. Dynamic imports without fallback hid components → fixed by removing unnecessary dynamics
3. Infinite loop prevented event listeners → fixed with useCallback

Each fix was necessary but not sufficient alone. All three had to be addressed.
