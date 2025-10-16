-- Database schema fix for missing text_submissions table
-- Date: 2025-09-29

-- First, let's create the TextSubmissionStatus enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TextSubmissionStatus') THEN
        CREATE TYPE "TextSubmissionStatus" AS ENUM (
            'DRAFT',
            'PENDING',
            'STORY_REVIEW',
            'NEEDS_REVISION',
            'STORY_APPROVED',
            'FORMAT_REVIEW',
            'CONTENT_REVIEW',
            'APPROVED',
            'PUBLISHED',
            'ARCHIVED',
            'REJECTED'
        );
    END IF;
END $$;

-- Create the text_submissions table
CREATE TABLE IF NOT EXISTS "text_submissions" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "authorAlias" TEXT,
    "summary" TEXT NOT NULL,
    "ageRange" TEXT,
    "category" TEXT[],
    "tags" TEXT[],
    "wordCount" INTEGER,
    "readingLevel" TEXT,
    "status" "TextSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "storyManagerId" TEXT,
    "bookManagerId" TEXT,
    "contentAdminId" TEXT,
    "storyFeedback" TEXT,
    "bookDecision" TEXT,
    "finalNotes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "estimatedImages" INTEGER,
    "generatedImages" TEXT[],
    "audioGenerated" BOOLEAN NOT NULL DEFAULT false,
    "audioUrl" TEXT,
    "copyrightConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "originalWork" BOOLEAN NOT NULL DEFAULT true,
    "licenseType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_submissions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for text_submissions
CREATE INDEX IF NOT EXISTS "text_submissions_status_idx" ON "text_submissions"("status");
CREATE INDEX IF NOT EXISTS "text_submissions_authorId_idx" ON "text_submissions"("authorId");
CREATE INDEX IF NOT EXISTS "text_submissions_storyManagerId_idx" ON "text_submissions"("storyManagerId");
CREATE INDEX IF NOT EXISTS "text_submissions_bookManagerId_idx" ON "text_submissions"("bookManagerId");
CREATE INDEX IF NOT EXISTS "text_submissions_contentAdminId_idx" ON "text_submissions"("contentAdminId");
CREATE INDEX IF NOT EXISTS "text_submissions_priority_idx" ON "text_submissions"("priority");

-- Add foreign key constraints
ALTER TABLE "text_submissions" ADD CONSTRAINT "text_submissions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "text_submissions" ADD CONSTRAINT "text_submissions_storyManagerId_fkey" FOREIGN KEY ("storyManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "text_submissions" ADD CONSTRAINT "text_submissions_bookManagerId_fkey" FOREIGN KEY ("bookManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "text_submissions" ADD CONSTRAINT "text_submissions_contentAdminId_fkey" FOREIGN KEY ("contentAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update workflow_history to support text submissions if not already done
ALTER TABLE "workflow_history" ADD COLUMN IF NOT EXISTS "textSubmissionId" TEXT;
CREATE INDEX IF NOT EXISTS "workflow_history_textSubmissionId_idx" ON "workflow_history"("textSubmissionId");

-- Add foreign key for workflow_history -> text_submissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workflow_history_textSubmissionId_fkey'
    ) THEN
        ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_textSubmissionId_fkey"
        FOREIGN KEY ("textSubmissionId") REFERENCES "text_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Update the existing VolunteerSubmissionStatus enum if needed
DO $$
BEGIN
    -- Check if we need to add any missing enum values
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'VolunteerSubmissionStatus' AND e.enumlabel = 'NEEDS_REVISION') THEN
        ALTER TYPE "VolunteerSubmissionStatus" ADD VALUE 'NEEDS_REVISION';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'VolunteerSubmissionStatus' AND e.enumlabel = 'ARCHIVED') THEN
        ALTER TYPE "VolunteerSubmissionStatus" ADD VALUE 'ARCHIVED';
    END IF;
END $$;

-- Final verification
SELECT 'Migration completed successfully' as status;