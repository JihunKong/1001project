# Console.log Migration Report

Generated: Tue Oct  7 11:23:29 KST 2025

## Files with console statements

- `app/signup/page.tsx`: 1 statements
- `app/library/page.tsx`: 1 statements
- `app/dashboard/volunteer/library/page.tsx`: 1 statements
- `app/dashboard/volunteer/page.tsx`: 2 statements
- `app/dashboard/page.tsx`: 1 statements
- `app/api/text-submissions/route.ts`: 4 statements
- `app/api/text-submissions/[id]/route.ts`: 4 statements
- `app/api/auth/verify/route.ts`: 2 statements
- `app/api/auth/signup/route.ts`: 1 statements
- `app/api/auth/session/route.ts`: 3 statements
- `app/api/classes/join/[code]/route.ts`: 2 statements
- `app/api/classes/route.ts`: 2 statements
- `app/api/classes/[id]/students/route.ts`: 2 statements
- `app/api/book-manager/stats/route.ts`: 1 statements
- `app/api/health/route.ts`: 3 statements
- `app/api/admin/stats/route.ts`: 1 statements
- `app/api/books/assign/route.ts`: 2 statements
- `app/api/books/route.ts`: 2 statements
- `app/api/books/[id]/route.ts`: 4 statements
- `app/api/learner/assignments/route.ts`: 2 statements
- `app/api/learner/reading-progress/route.ts`: 2 statements
- `app/api/content-admin/stats/route.ts`: 1 statements
- `app/api/volunteer/text-stats/route.ts`: 1 statements
- `app/api/volunteer/submissions/route.ts`: 3 statements
- `app/api/volunteer/stats/route.ts`: 1 statements
- `app/api/ai/analyze-structure/route.ts`: 1 statements
- `app/api/ai/check-grammar/route.ts`: 1 statements
- `app/api/ai/writing-help/route.ts`: 1 statements
- `app/api/book-assignments/route.ts`: 3 statements
- `app/api/story-manager/stats/route.ts`: 1 statements
- `app/api/teacher/assign-book/route.ts`: 2 statements
- `app/api/notifications/preferences/route.ts`: 4 statements
- `app/api/notifications/sse/route.ts`: 3 statements
- `app/api/notifications/bulk-delete/route.ts`: 1 statements
- `app/api/notifications/bulk-update/route.ts`: 1 statements
- `app/api/notifications/mark-all-read/route.ts`: 1 statements
- `app/api/notifications/route.ts`: 2 statements
- `app/api/notifications/[id]/route.ts`: 2 statements
- `app/login/page.tsx`: 1 statements
- `lib/prisma.ts`: 2 statements
- `lib/audit-reporting.ts`: 1 statements
- `lib/auth-demo.ts`: 2 statements
- `lib/performance.ts`: 6 statements
- `lib/security/headers.ts`: 2 statements
- `lib/security/payment-security.ts`: 1 statements
- `lib/auth/EnhancedAuthProvider.tsx`: 4 statements
- `lib/audit-monitoring.ts`: 11 statements
- `lib/security-middleware.ts`: 2 statements
- `lib/email.ts`: 18 statements
- `lib/gdpr-deletion.ts`: 1 statements
- `lib/sse-notifications.ts`: 5 statements
- `lib/logger.ts`: 4 statements
- `lib/api-utils.ts`: 2 statements
- `lib/error-handling.ts`: 3 statements
- `lib/ai/openai.ts`: 3 statements
- `lib/hooks/useContentAccess.ts`: 1 statements
- `lib/hooks/useEnhancedAuth.ts`: 3 statements
- `lib/content-access.ts`: 5 statements
- `lib/prisma-secure.ts`: 7 statements
- `lib/notifications/NotificationService.ts`: 6 statements
- `lib/notifications/sse-broadcast.ts`: 4 statements
- `lib/notifications/EmailService.ts`: 2 statements
- `lib/language-server.ts`: 1 statements
- `components/ui/BuildInfo.tsx`: 1 statements
- `components/WriterSubmissionForm.tsx`: 4 statements
- `components/discovery/HomePage.tsx`: 3 statements
- `components/admin/UnifiedReviewQueue.tsx`: 1 statements
- `components/TextSubmissionForm.tsx`: 1 statements
- `components/workflow/ActionButtons.tsx`: 1 statements
- `components/workflow/StoryStatusCardDemo.tsx`: 6 statements
- `components/workflow/useWorkflowUpdates.ts`: 1 statements
- `components/notifications/NotificationCenter.tsx`: 4 statements
- `components/notifications/NotificationPreferences.tsx`: 2 statements
- `components/notifications/NotificationDropdown.tsx`: 8 statements

## Total Statistics

- Total files with console statements: 74
- Total console statements: 201

## Migration Progress

✅ Completed:
- lib/auth.ts (16 statements)
- lib/redis.ts (10 statements)
- lib/rate-limit.ts (1 statement)

📋 Remaining: 74 files, 201 statements
