# Workflow Testing TODO (Phase 2-6)

**Status:** Ready to start
**Estimated Total Time:** 15-16 hours
**Priority:** High - Complete approval pipeline testing

---

## Phase 2: Workflow Helper Functions (2 hours)

**File:** `tests/helpers/workflow-helpers.ts`

**Tasks:**
- [ ] Create helper file structure
- [ ] Implement API call helpers:
  - [ ] `performWorkflowAction(page, submissionId, action, data?)` - Execute workflow actions via API
  - [ ] `getSubmissionStatus(page, submissionId)` - Fetch current submission status
  - [ ] `getWorkflowHistory(page, submissionId)` - Fetch workflow history
- [ ] Implement UI helpers:
  - [ ] `findSubmissionInQueue(page, title or id)` - Locate submission in dashboard queue
  - [ ] `extractSubmissionId(page, element)` - Extract ID from URL or data attributes
  - [ ] `navigateToReviewPage(page, submissionId, role)` - Navigate to role-specific review page
- [ ] Implement verification helpers:
  - [ ] `verifyStatusTransition(page, submissionId, expectedStatus)` - Confirm status changed
  - [ ] `verifyHistoryRecorded(page, submissionId, action, role)` - Confirm history entry exists
  - [ ] `verifyNotificationSent(page, recipientRole, submissionId)` - Confirm notification created

**Dependencies:** None

---

## Phase 3: BOOK_MANAGER Workflow Tests (3 hours)

**File:** `tests/book-manager-workflow.spec.ts`

**Tasks:**
- [ ] Create test file with BOOK_MANAGER login
- [ ] Test 1: Format Decision - TEXT option
  - [ ] Find submission with STORY_APPROVED status
  - [ ] Navigate to detail page
  - [ ] Select TEXT format
  - [ ] Submit format decision
  - [ ] Verify status: FORMAT_REVIEW → CONTENT_REVIEW
  - [ ] Verify workflow history recorded
  - [ ] Verify CONTENT_ADMIN notification sent
- [ ] Test 2: Format Decision - BOOK option
  - [ ] Select BOOK format with justification
  - [ ] Verify transition to CONTENT_REVIEW
- [ ] Test 3: Format Decision - COLLECTION option
  - [ ] Select COLLECTION format
  - [ ] Verify transition to CONTENT_REVIEW
- [ ] Test 4: Error handling
  - [ ] Attempt format decision on wrong status (should fail)
  - [ ] Verify status unchanged

**Dependencies:** Phase 2 helpers

**Known Issues to Address:**
- Format Decision button location (may be on detail page, not dashboard)
- Need to identify actual button selector

---

## Phase 4: CONTENT_ADMIN Workflow Tests (3 hours)

**File:** `tests/content-admin-workflow.spec.ts`

**Tasks:**
- [ ] Create test file with CONTENT_ADMIN login
- [ ] Test 1: Final Approval - Approve
  - [ ] Find submission with CONTENT_REVIEW status
  - [ ] Navigate to detail page
  - [ ] Click "Approve" or "Publish" button
  - [ ] Verify status: CONTENT_REVIEW → PUBLISHED
  - [ ] Verify workflow history recorded
  - [ ] Verify WRITER notification sent
  - [ ] Verify submission appears in published library
- [ ] Test 2: Final Approval - Reject
  - [ ] Click "Reject" button with reason
  - [ ] Verify status: CONTENT_REVIEW → REJECTED
  - [ ] Verify rejection reason in history
  - [ ] Verify WRITER rejection notification
- [ ] Test 3: Error handling
  - [ ] Attempt approval on wrong status (should fail)

**Dependencies:** Phase 2 helpers, Phase 3 (need CONTENT_REVIEW submissions)

**Known Issues to Address:**
- Approve/Publish button location (may be on detail page)
- Need to identify actual button selectors
- Verify published library access

---

## Phase 5: Complete E2E Workflow (4 hours)

**File:** `tests/complete-approval-workflow-e2e.spec.ts`

**Tasks:**
- [ ] Setup: Create fresh test submission as WRITER
- [ ] Step 1: WRITER submission
  - [ ] Login as WRITER
  - [ ] Submit new story (unique title)
  - [ ] Verify status: DRAFT → PENDING
  - [ ] Capture submission ID
- [ ] Step 2: STORY_MANAGER initial review
  - [ ] Login as STORY_MANAGER
  - [ ] Find submission in queue
  - [ ] Approve submission
  - [ ] Verify status: PENDING → STORY_REVIEW → STORY_APPROVED
  - [ ] Verify BOOK_MANAGER notification sent
- [ ] Step 3: BOOK_MANAGER format decision
  - [ ] Login as BOOK_MANAGER
  - [ ] Find submission in format queue
  - [ ] Select TEXT format
  - [ ] Verify status: STORY_APPROVED → FORMAT_REVIEW → CONTENT_REVIEW
  - [ ] Verify CONTENT_ADMIN notification sent
- [ ] Step 4: CONTENT_ADMIN final approval
  - [ ] Login as CONTENT_ADMIN
  - [ ] Find submission in approval queue
  - [ ] Approve for publication
  - [ ] Verify status: CONTENT_REVIEW → PUBLISHED
  - [ ] Verify WRITER success notification
- [ ] Step 5: Verify complete workflow history
  - [ ] Fetch workflow history via API
  - [ ] Verify all 5 transitions recorded:
    - DRAFT → PENDING (WRITER)
    - PENDING → STORY_REVIEW (STORY_MANAGER)
    - STORY_REVIEW → STORY_APPROVED (STORY_MANAGER)
    - STORY_APPROVED → CONTENT_REVIEW (BOOK_MANAGER)
    - CONTENT_REVIEW → PUBLISHED (CONTENT_ADMIN)
  - [ ] Verify timestamps sequential
  - [ ] Verify actor roles correct
- [ ] Step 6: Verify published story accessible
  - [ ] Login as LEARNER
  - [ ] Search for published story
  - [ ] Verify appears in library

**Dependencies:** Phase 2 helpers, Phase 3, Phase 4

**Performance Note:** This test will be longest (~2 minutes), as it simulates full pipeline.

---

## Phase 6: Revision Workflow Tests (3 hours)

**File:** `tests/revision-workflow.spec.ts`

**Tasks:**
- [ ] Setup: Create test submission for revision cycle
- [ ] Test 1: Single revision cycle
  - [ ] WRITER submits story
  - [ ] STORY_MANAGER requests revision with feedback
  - [ ] Verify status: PENDING → NEEDS_REVISION
  - [ ] Verify WRITER notification with feedback
  - [ ] WRITER resubmits with changes
  - [ ] Verify status: NEEDS_REVISION → PENDING
  - [ ] STORY_MANAGER approves resubmission
  - [ ] Verify status: PENDING → STORY_APPROVED
- [ ] Test 2: Multiple revision cycles
  - [ ] Request revision twice
  - [ ] Verify both cycles recorded in history
  - [ ] Verify revision count tracked
- [ ] Test 3: Revision after STORY_REVIEW
  - [ ] Submission reaches STORY_REVIEW
  - [ ] STORY_MANAGER requests revision
  - [ ] Verify status: STORY_REVIEW → NEEDS_REVISION
- [ ] Test 4: Abandoned revisions
  - [ ] Request revision
  - [ ] WRITER does not resubmit
  - [ ] Verify submission remains NEEDS_REVISION

**Dependencies:** Phase 2 helpers

**Note:** This tests the revision branch of the workflow, separate from happy path.

---

## Post-Testing Tasks

**After Phase 2-6 Completion:**
- [ ] Run full test suite: `npx playwright test`
- [ ] Verify all 19+ tests passing (13 existing + 6+ new)
- [ ] Generate final test report
- [ ] Take screenshots of all test results
- [ ] Update test documentation
- [ ] Git commit with "test: Complete workflow approval pipeline tests"

---

## Known Limitations to Address

### From Phase 1 Testing:

1. **API Endpoints Not Deployed:**
   - `/api/profile/activity` - 404 in production
   - `/api/profile/stories` - 404 in production
   - **Impact:** Phase 5 verification step may need adjustment
   - **Solution:** Use workflow history API instead, or skip published library check

2. **BOOK_MANAGER Format Decision Button:**
   - Not found on dashboard in Phase 1 test
   - **Hypothesis:** Button is on submission detail page
   - **Action:** Phase 3 must explore detail page navigation

3. **CONTENT_ADMIN Approve/Publish Button:**
   - Not found on dashboard in Phase 1 test
   - **Hypothesis:** Button is on submission detail page
   - **Action:** Phase 4 must explore detail page navigation

4. **Comment Button Disabled State:**
   - In STORY_MANAGER review, comment button was disabled
   - **Hypothesis:** Validation logic requires minimum character count
   - **Action:** Phase 6 should test with sufficient comment text

---

## Reference: Workflow Status Transitions

```
DRAFT (Writer creates)
  ↓
PENDING (Writer submits)
  ↓
STORY_REVIEW (Story Manager reviews)
  ↓ ←─────────┐
STORY_APPROVED      │ (Revision cycle)
  ↓                 │
FORMAT_REVIEW       │
  ↓                 │
CONTENT_REVIEW ─────┘ (Can request revision)
  ↓
PUBLISHED (Final state)

Alternative paths:
- PENDING → NEEDS_REVISION → PENDING (revision cycle)
- STORY_REVIEW → NEEDS_REVISION → PENDING (revision cycle)
- CONTENT_REVIEW → REJECTED (final rejection)
```

---

## Test Accounts Reference

```javascript
WRITER: writer@test.1001stories.org / test1234
STORY_MANAGER: story-manager@test.1001stories.org / test1234
BOOK_MANAGER: book-manager@test.1001stories.org / test1234
CONTENT_ADMIN: content-admin@test.1001stories.org / test1234
LEARNER: learner@test.1001stories.org / test1234
```

---

## Success Criteria

**Phase 2-6 is complete when:**
- ✅ All helper functions implemented and tested
- ✅ BOOK_MANAGER can perform format decisions
- ✅ CONTENT_ADMIN can approve/reject submissions
- ✅ Complete E2E pipeline (DRAFT → PUBLISHED) verified
- ✅ Revision workflow tested with multiple cycles
- ✅ All workflow history transitions verified
- ✅ All notifications verified
- ✅ 100% test pass rate maintained
- ✅ Documentation updated with findings

---

**Created:** 2025-11-07
**Phase 1 Completion Report:** `/tmp/phase1-completion-report.md`
**Phase 1 Test Log:** `/tmp/playwright-phase1-extended.log`
**Ready to Start:** Phase 2
