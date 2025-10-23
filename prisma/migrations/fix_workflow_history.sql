-- Migration: Fix workflow_history table to support both VolunteerSubmission and TextSubmission
-- Date: 2025-10-23
-- This migration updates the workflow_history table structure to match the Prisma schema

BEGIN;

-- Step 1: Drop existing foreign key constraint
ALTER TABLE workflow_history
  DROP CONSTRAINT IF EXISTS "workflow_history_submissionId_fkey";

-- Step 2: Rename submissionId to volunteerSubmissionId
ALTER TABLE workflow_history
  RENAME COLUMN "submissionId" TO "volunteerSubmissionId";

-- Step 3: Make volunteerSubmissionId nullable
ALTER TABLE workflow_history
  ALTER COLUMN "volunteerSubmissionId" DROP NOT NULL;

-- Step 4: Add textSubmissionId column (nullable)
ALTER TABLE workflow_history
  ADD COLUMN IF NOT EXISTS "textSubmissionId" TEXT;

-- Step 5: Update fromStatus to be generic TEXT type (nullable)
ALTER TABLE workflow_history
  ALTER COLUMN "fromStatus" TYPE TEXT USING "fromStatus"::TEXT;

-- Step 6: Update toStatus to be generic TEXT type (NOT NULL)
ALTER TABLE workflow_history
  ALTER COLUMN "toStatus" TYPE TEXT USING "toStatus"::TEXT;

-- Step 7: Add new foreign key constraints
ALTER TABLE workflow_history
  ADD CONSTRAINT "workflow_history_volunteerSubmissionId_fkey"
  FOREIGN KEY ("volunteerSubmissionId")
  REFERENCES volunteer_submissions(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

ALTER TABLE workflow_history
  ADD CONSTRAINT "workflow_history_textSubmissionId_fkey"
  FOREIGN KEY ("textSubmissionId")
  REFERENCES text_submissions(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

-- Step 8: Drop old index if exists
DROP INDEX IF EXISTS "workflow_history_submissionId_idx";

-- Step 9: Create new indexes
CREATE INDEX IF NOT EXISTS "workflow_history_volunteerSubmissionId_idx"
  ON workflow_history("volunteerSubmissionId");

CREATE INDEX IF NOT EXISTS "workflow_history_textSubmissionId_idx"
  ON workflow_history("textSubmissionId");

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'workflow_history'
ORDER BY ordinal_position;

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_textSubmissionId_fkey;
-- ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_volunteerSubmissionId_fkey;
-- DROP INDEX IF EXISTS workflow_history_textSubmissionId_idx;
-- ALTER TABLE workflow_history DROP COLUMN IF EXISTS textSubmissionId;
-- ALTER TABLE workflow_history RENAME COLUMN volunteerSubmissionId TO submissionId;
-- ALTER TABLE workflow_history ALTER COLUMN submissionId SET NOT NULL;
-- ALTER TABLE workflow_history ADD CONSTRAINT workflow_history_submissionId_fkey FOREIGN KEY (submissionId) REFERENCES volunteer_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE;
-- CREATE INDEX workflow_history_submissionId_idx ON workflow_history(submissionId);
-- COMMIT;
