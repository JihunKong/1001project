import { Page, APIResponse } from '@playwright/test';

export type WorkflowAction =
  | 'submit'
  | 'withdraw'
  | 'assign_story_manager'
  | 'story_approve'
  | 'story_needs_revision'
  | 'assign_book_manager'
  | 'format_decision'
  | 'final_approve'
  | 'reject';

export type TextSubmissionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'STORY_REVIEW'
  | 'STORY_APPROVED'
  | 'FORMAT_REVIEW'
  | 'CONTENT_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'NEEDS_REVISION';

export type FormatDecision = 'TEXT' | 'BOOK' | 'COLLECTION';

export interface WorkflowActionData {
  action: WorkflowAction;
  feedback?: string;
  notes?: string;
  comment?: string;
  decision?: FormatDecision;
  reason?: string;
  [key: string]: any;
}

export interface SubmissionDetails {
  id: string;
  title: string;
  status: TextSubmissionStatus;
  authorId: string;
  storyManagerId?: string;
  bookManagerId?: string;
  contentAdminId?: string;
  publishedAt?: Date;
  submittedAt?: Date;
}

export interface WorkflowHistoryEntry {
  id: string;
  textSubmissionId: string;
  fromStatus: TextSubmissionStatus;
  toStatus: TextSubmissionStatus;
  performedById: string;
  notes?: string;
  createdAt: Date;
}

async function performWorkflowAction(
  page: Page,
  submissionId: string,
  action: WorkflowAction,
  data?: Partial<WorkflowActionData>
): Promise<APIResponse> {
  const response = await page.request.put(
    `/api/text-submissions/${submissionId}`,
    {
      data: {
        action,
        ...data,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response;
}

async function storyManagerApprove(
  page: Page,
  submissionId: string,
  feedback?: string
): Promise<APIResponse> {
  console.log(`📝 STORY_MANAGER approving submission ${submissionId}`);

  const response = await performWorkflowAction(page, submissionId, 'story_approve', {
    feedback,
  });

  if (response.ok()) {
    console.log('✅ Story approved successfully');
  } else {
    console.log(`❌ Story approval failed: ${response.status()}`);
  }

  return response;
}

async function storyManagerRequestRevision(
  page: Page,
  submissionId: string,
  feedback: string
): Promise<APIResponse> {
  console.log(`📝 STORY_MANAGER requesting revision for ${submissionId}`);

  const response = await performWorkflowAction(page, submissionId, 'story_needs_revision', {
    feedback,
  });

  if (response.ok()) {
    console.log('✅ Revision requested successfully');
  } else {
    console.log(`❌ Revision request failed: ${response.status()}`);
  }

  return response;
}

async function storyManagerReject(
  page: Page,
  submissionId: string,
  reason: string
): Promise<APIResponse> {
  console.log(`📝 STORY_MANAGER rejecting submission ${submissionId}`);

  const response = await performWorkflowAction(page, submissionId, 'reject', {
    reason,
  });

  if (response.ok()) {
    console.log('✅ Story rejected successfully');
  } else {
    console.log(`❌ Story rejection failed: ${response.status()}`);
  }

  return response;
}

async function bookManagerDecideFormat(
  page: Page,
  submissionId: string,
  decision: FormatDecision,
  notes?: string
): Promise<APIResponse> {
  console.log(`📚 BOOK_MANAGER deciding format ${decision} for ${submissionId}`);

  const response = await performWorkflowAction(page, submissionId, 'format_decision', {
    decision,
    notes,
  });

  if (response.ok()) {
    console.log(`✅ Format decision (${decision}) submitted successfully`);
  } else {
    console.log(`❌ Format decision failed: ${response.status()}`);
  }

  return response;
}

async function contentAdminPublish(
  page: Page,
  submissionId: string,
  notes?: string
): Promise<APIResponse> {
  console.log(`🎉 CONTENT_ADMIN publishing submission ${submissionId}`);

  const response = await performWorkflowAction(page, submissionId, 'final_approve', {
    notes,
  });

  if (response.ok()) {
    console.log('✅ Story published successfully');
  } else {
    console.log(`❌ Publication failed: ${response.status()}`);
  }

  return response;
}

async function contentAdminReject(
  page: Page,
  submissionId: string,
  reason: string
): Promise<APIResponse> {
  console.log(`❌ CONTENT_ADMIN rejecting submission ${submissionId}`);

  const response = await performWorkflowAction(page, submissionId, 'reject', {
    reason,
  });

  if (response.ok()) {
    console.log('✅ Story rejected successfully');
  } else {
    console.log(`❌ Rejection failed: ${response.status()}`);
  }

  return response;
}

async function navigateToStoryReview(
  page: Page,
  submissionId: string
): Promise<void> {
  console.log(`🔗 Navigating to STORY_MANAGER review page for ${submissionId}`);
  await page.goto(`/dashboard/story-manager/review/${submissionId}`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Review page loaded');
}

async function navigateToFormatDecision(
  page: Page,
  submissionId: string
): Promise<void> {
  console.log(`🔗 Navigating to BOOK_MANAGER format decision page for ${submissionId}`);
  await page.goto(`/dashboard/book-manager/decide/${submissionId}`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Format decision page loaded');
}

async function navigateToFinalReview(
  page: Page,
  submissionId: string
): Promise<void> {
  console.log(`🔗 Navigating to CONTENT_ADMIN final review page for ${submissionId}`);
  await page.goto(`/dashboard/content-admin/review/${submissionId}`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Final review page loaded');
}

async function findSubmissionInQueue(
  page: Page,
  titleOrId: string
): Promise<string | null> {
  console.log(`🔍 Searching for submission: ${titleOrId}`);

  const submissionRows = page.locator('table tbody tr, .submission-card, [data-testid="submission-row"]');
  const count = await submissionRows.count();

  for (let i = 0; i < count; i++) {
    const row = submissionRows.nth(i);
    const text = await row.textContent();

    if (text && (text.includes(titleOrId))) {
      console.log(`✅ Found submission at index ${i}`);

      const idAttribute = await row.getAttribute('data-submission-id');
      if (idAttribute) {
        return idAttribute;
      }

      const linkElement = row.locator('a[href*="/review/"], a[href*="/decide/"]').first();
      if (await linkElement.count() > 0) {
        const href = await linkElement.getAttribute('href');
        if (href) {
          const id = extractSubmissionIdFromUrl(href);
          if (id) return id;
        }
      }
    }
  }

  console.log('⚠️  Submission not found in queue');
  return null;
}

function extractSubmissionIdFromUrl(url: string): string | null {
  const matches = url.match(/\/review\/([a-zA-Z0-9-]+)|\/decide\/([a-zA-Z0-9-]+)/);
  return matches ? (matches[1] || matches[2]) : null;
}

async function extractSubmissionId(
  page: Page,
  element: any
): Promise<string | null> {
  const idAttribute = await element.getAttribute('data-submission-id');
  if (idAttribute) {
    return idAttribute;
  }

  const href = await element.getAttribute('href');
  if (href) {
    return extractSubmissionIdFromUrl(href);
  }

  const currentUrl = page.url();
  return extractSubmissionIdFromUrl(currentUrl);
}

async function selectFormatAndSubmit(
  page: Page,
  format: FormatDecision
): Promise<void> {
  console.log(`📋 Selecting format: ${format}`);

  const formatText = format === 'TEXT'
    ? 'Standalone Text'
    : format === 'BOOK'
    ? 'Book Format'
    : 'Series Collection';

  const formatCard = page.locator(`div:has-text("${formatText}")`).first();
  await formatCard.click();
  console.log(`✅ Format ${format} selected`);

  await page.waitForTimeout(500);

  const submitButton = page.locator('button:has-text("Submit Decision")');
  await submitButton.click();
  console.log('✅ Submit Decision button clicked');

  await page.waitForSelector('text=/submitted successfully/i', { timeout: 5000 })
    .catch(() => console.log('⚠️  Success message not found, continuing...'));
}

async function verifySubmissionStatus(
  page: Page,
  submissionId: string,
  expectedStatus: TextSubmissionStatus
): Promise<boolean> {
  console.log(`🔍 Verifying submission ${submissionId} status is ${expectedStatus}`);

  const response = await page.request.get(`/api/text-submissions/${submissionId}`);

  if (!response.ok()) {
    console.log(`❌ Failed to fetch submission: ${response.status()}`);
    return false;
  }

  const data = await response.json();
  const actualStatus = data.submission?.status || data.status;

  if (actualStatus === expectedStatus) {
    console.log(`✅ Status verified: ${actualStatus}`);
    return true;
  } else {
    console.log(`❌ Status mismatch: expected ${expectedStatus}, got ${actualStatus}`);
    return false;
  }
}

async function verifyWorkflowHistory(
  page: Page,
  submissionId: string,
  expectedFromStatus: TextSubmissionStatus,
  expectedToStatus: TextSubmissionStatus
): Promise<boolean> {
  console.log(`🔍 Verifying workflow history: ${expectedFromStatus} → ${expectedToStatus}`);

  const response = await page.request.get(
    `/api/text-submissions/${submissionId}`
  );

  if (!response.ok()) {
    console.log(`❌ Failed to fetch submission: ${response.status()}`);
    return false;
  }

  const data = await response.json();
  const history: WorkflowHistoryEntry[] = data.submission?.workflowHistory || [];

  const matchingEntry = history.find(
    (entry) =>
      entry.fromStatus === expectedFromStatus &&
      entry.toStatus === expectedToStatus
  );

  if (matchingEntry) {
    console.log(`✅ Workflow history entry found`);
    return true;
  } else {
    console.log(`❌ Workflow history entry not found`);
    return false;
  }
}

async function verifyNotificationSent(
  page: Page,
  userId: string,
  submissionId: string
): Promise<boolean> {
  console.log(`🔍 Verifying notification sent to user ${userId}`);

  const response = await page.request.get(`/api/notifications?userId=${userId}`);

  if (!response.ok()) {
    console.log(`⚠️  Failed to fetch notifications: ${response.status()}`);
    return false;
  }

  const data = await response.json();
  const notifications = data.notifications || data;

  const matchingNotification = notifications.find(
    (notif: any) =>
      notif.data?.submissionId === submissionId ||
      notif.relatedSubmissionId === submissionId
  );

  if (matchingNotification) {
    console.log(`✅ Notification found`);
    return true;
  } else {
    console.log(`⚠️  Notification not found (may not be implemented yet)`);
    return false;
  }
}

async function getSubmissionDetails(
  page: Page,
  submissionId: string
): Promise<SubmissionDetails | null> {
  console.log(`📥 Fetching submission details for ${submissionId}`);

  const response = await page.request.get(`/api/text-submissions/${submissionId}`);

  if (!response.ok()) {
    console.log(`❌ Failed to fetch submission: ${response.status()}`);
    return null;
  }

  const data = await response.json();
  const submission = data.submission || data;

  console.log(`✅ Submission details fetched`);
  return submission;
}

async function getWorkflowHistory(
  page: Page,
  submissionId: string
): Promise<WorkflowHistoryEntry[]> {
  console.log(`📥 Fetching workflow history for ${submissionId}`);

  const response = await page.request.get(
    `/api/text-submissions/${submissionId}`
  );

  if (!response.ok()) {
    console.log(`❌ Failed to fetch submission: ${response.status()}`);
    return [];
  }

  const data = await response.json();
  const history = data.submission?.workflowHistory || [];

  console.log(`✅ Workflow history fetched: ${history.length} entries`);
  return history;
}

export {
  performWorkflowAction,
  storyManagerApprove,
  storyManagerRequestRevision,
  storyManagerReject,
  bookManagerDecideFormat,
  contentAdminPublish,
  contentAdminReject,
  navigateToStoryReview,
  navigateToFormatDecision,
  navigateToFinalReview,
  findSubmissionInQueue,
  extractSubmissionId,
  extractSubmissionIdFromUrl,
  selectFormatAndSubmit,
  verifySubmissionStatus,
  verifyWorkflowHistory,
  verifyNotificationSent,
  getSubmissionDetails,
  getWorkflowHistory,
};
