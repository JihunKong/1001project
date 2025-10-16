# Dashboard Refactoring Guide

## Shared Components Created

I've created 9 reusable dashboard components that will eliminate significant code duplication across all 7 dashboard files.

### Components Overview

1. **DashboardStatsCard** - Reusable stat cards with icons, values, and trends
2. **DashboardLoadingState** - Loading spinner with customizable message
3. **DashboardErrorState** - Error display with retry button
4. **DashboardStatusBadge** - Colored status indicators for various states
5. **DashboardTable** - Common table structure with empty states
6. **DashboardHeader** - Dashboard header with title, subtitle, and actions
7. **DashboardEmptyState** - Empty state display for lists and sections
8. **DashboardProgressBar** - Progress bars with various color schemes
9. **DashboardSection** - Section wrapper with header and optional actions

## Estimated Line Savings

### Current Dashboard Files (3,778 total lines)
- admin/page.tsx: 533 lines
- teacher/page.tsx: 699 lines
- learner/page.tsx: 366 lines
- writer/page.tsx: 502 lines
- story-manager/page.tsx: 384 lines
- book-manager/page.tsx: 405 lines
- content-admin/page.tsx: 430 lines
- institution/page.tsx: 459 lines

### Shared Components (386 lines)
- DashboardStatsCard.tsx: 73 lines
- DashboardLoadingState.tsx: 24 lines
- DashboardErrorState.tsx: 34 lines
- DashboardStatusBadge.tsx: 140 lines
- DashboardTable.tsx: 110 lines
- DashboardHeader.tsx: 44 lines
- DashboardEmptyState.tsx: 34 lines
- DashboardProgressBar.tsx: 75 lines
- DashboardSection.tsx: 42 lines
- index.ts: 10 lines

### Expected Savings Per Dashboard
Each dashboard can be reduced by approximately 40-50% through:
- Loading state: ~15 lines → 3 lines (save 12 lines)
- Error state: ~15 lines → 3 lines (save 12 lines)
- Stats cards: ~40 lines per card → 8 lines (save ~32 lines per card, ~128 lines per dashboard)
- Status badges: ~10 lines per usage → 1 line (save ~9 lines per usage, ~45 lines per dashboard)
- Tables: ~80 lines → 20 lines (save 60 lines)
- Progress bars: ~15 lines → 3 lines (save 12 lines per usage)
- Empty states: ~20 lines → 5 lines (save 15 lines per usage)

### Total Expected Savings
- **Lines removed from dashboards**: ~1,800-2,200 lines
- **Lines added (shared components)**: 386 lines
- **Net reduction**: ~1,400-1,800 lines (37-48% reduction)

## Refactoring Example

Here's how to refactor the Admin Dashboard using the new components:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Users, BookOpen, FileText, Server,
  Shield, CheckCircle, Settings, BarChart3
} from 'lucide-react';
import {
  DashboardHeader,
  DashboardLoadingState,
  DashboardErrorState,
  DashboardStatsCard,
  DashboardStatusBadge,
  DashboardTable,
  DashboardSection,
  DashboardProgressBar,
  type Column
} from '@/components/dashboard';

// ... interfaces remain the same ...

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  // ... state variables remain the same ...

  // ... authentication logic remains the same ...

  if (status === 'loading' || loading) {
    return <DashboardLoadingState role="admin" message="Loading admin dashboard..." />;
  }

  if (error) {
    return <DashboardErrorState role="admin" error={error} />;
  }

  // Define table columns
  const reviewColumns: Column<PendingReview>[] = [
    {
      key: 'type',
      header: 'Type',
      accessor: (review) => (
        <span className="capitalize text-sm font-medium text-gray-900">
          {review.type}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Title',
      accessor: (review) => (
        <div className="text-sm font-medium text-gray-900">{review.title}</div>
      )
    },
    {
      key: 'submitter',
      header: 'Submitter',
      accessor: (review) => (
        <span className="text-sm text-gray-500">{review.submitter}</span>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      accessor: (review) => (
        <DashboardStatusBadge
          status={review.priority}
          variant="priority"
          size="sm"
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (review) => (
        <div className="flex space-x-2">
          <button className="text-soe-green-600 hover:text-soe-green-900">
            Review
          </button>
        </div>
      )
    }
  ];

  return (
    <div data-role="admin" className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle={`System overview and management for ${session?.user?.name}`}
        actions={
          <>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </button>
            <button className="bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardStatsCard
              title="Total Users"
              value={systemStats.totalUsers}
              subValue={`${systemStats.activeUsers.toLocaleString()} active`}
              icon={Users}
              trend={{ value: '+12% this month', isPositive: true }}
            />
            <DashboardStatsCard
              title="Total Books"
              value={systemStats.totalBooks}
              icon={BookOpen}
              iconBgColor="from-green-400 to-green-500"
            />
            <DashboardStatsCard
              title="Submissions"
              value={systemStats.totalSubmissions}
              icon={FileText}
              iconBgColor="from-purple-400 to-purple-500"
            />
            <DashboardStatsCard
              title="System Health"
              value={systemStats.systemHealth}
              subValue={`Uptime: ${systemStats.uptime}`}
              icon={Server}
              iconBgColor="from-emerald-400 to-emerald-500"
            />
          </div>
        )}

        {/* System Resources */}
        {systemStats && (
          <DashboardSection
            title="System Resources"
            icon={Server}
            className="mb-8"
          >
            <div className="space-y-4">
              <DashboardProgressBar
                label="Disk Usage"
                value={systemStats.diskUsage}
                showPercentage
                colorScheme="default"
              />
              <DashboardProgressBar
                label="Memory Usage"
                value={systemStats.memoryUsage}
                showPercentage
                colorScheme="default"
              />
            </div>
          </DashboardSection>
        )}

        {/* Pending Reviews Table */}
        <DashboardSection
          title="Pending Reviews"
          badge={
            <DashboardStatusBadge
              status={`${pendingReviews.length} pending`}
              variant="custom"
            />
          }
          noPadding
        >
          <DashboardTable
            columns={reviewColumns}
            data={pendingReviews}
            keyExtractor={(review) => review.id}
            emptyState={{
              icon: <CheckCircle className="h-12 w-12 text-green-300" />,
              title: 'No pending reviews',
              description: 'All submissions and reports are up to date'
            }}
          />
        </DashboardSection>
      </div>
    </div>
  );
}
```

## Benefits of Refactoring

1. **Consistency**: All dashboards will have the same look and feel
2. **Maintainability**: Changes to common components update all dashboards
3. **Reduced Bundle Size**: Less duplicated code means smaller JavaScript bundles
4. **Faster Development**: New dashboards can be built quickly using shared components
5. **Type Safety**: TypeScript interfaces ensure proper component usage
6. **Accessibility**: Centralized place to improve keyboard navigation and screen reader support

## Migration Steps

1. Start with one dashboard as a pilot (recommend starting with Admin or Teacher)
2. Import the shared components
3. Replace duplicated code sections with shared components
4. Test thoroughly to ensure functionality remains the same
5. Once validated, proceed with other dashboards
6. Remove any unused utility functions after migration

## Component Customization

All components accept className props for additional styling and can be extended with:
- Custom color schemes
- Additional icon sets
- Different sizing options
- Animation effects
- Theme variations

## Testing Considerations

After refactoring each dashboard:
1. Verify all data displays correctly
2. Test loading and error states
3. Check responsive design on mobile devices
4. Ensure all interactive elements work
5. Validate accessibility with keyboard navigation
6. Test with different user roles